console.log("Starting...");

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const os = require("os");

const express = require("express");
const app = express();

const multer = require("multer");
const upload = multer({ dest: os.tmpdir() });

const archiver = require("archiver");
archiver.registerFormat("zip-encrypted", require("archiver-zip-encrypted"));

const db = require("./helpers/db.js").init();
const { animetracker } = require("./api/animetracker.js");

app.use("/", function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.get("/", (req, res) => {
  res.end("OK");
});

app.get("/api/anime-tracker", async (req, res) => {
  try {
    if (req.query.key !== process.env.KEY) {
      return res.sendStatus(403);
    }
    const result = await animetracker(req.query.f, req.query.d);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).send("No files were uploaded.");
    }

    const filename = `${Date.now()}.zip`;
    const output = fs.createWriteStream(path.join(__dirname, `./.${filename}`));

    output.on("close", () => {
      fs.renameSync(path.join(__dirname, `./.${filename}`), path.join(__dirname, `./${filename}`));
    });

    const archive = archiver("zip-encrypted", {
      zlib: { level: 9 },
      encryptionMethod: "aes256",
      password: process.env.KEY,
    });

    archive.pipe(output);

    for (const file of req.files) {
      archive.append(fs.createReadStream(file.path), { name: file.originalname });
    }

    archive.finalize();

    res.send("Files uploaded successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading files");
  }
});

app.listen(process.env.PORT, () => console.log("Ready!"));
