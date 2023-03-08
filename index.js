process.env.TZ = "Asia/Manila";
require("dotenv").config();

const path = require("path");
const os = require("os");

const fs = require("fs-extra");
const express = require("express");
const multer = require("multer");
const archiver = require("archiver");
const animetracker = require("./api/animetracker.js");

const app = express();
const upload = multer({ dest: os.tmpdir() });
archiver.registerFormat("zip-encrypted", require("archiver-zip-encrypted"));
require("./helpers/db.js").init();

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
    if (!req.files || req.files.length === 0) {
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
      const imageDate = new Date(getDateFromFilename(file.originalname));
      fs.utimesSync(file.path, imageDate, imageDate);
      archive.file(file.path, { name: file.originalname });
    }

    archive.finalize();

    res.send("Files uploaded successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading files");
  }
});

function getDateFromFilename(filename) {
  // IMG_20230307_114313.jpg
  // IMG20230307070131.jpg
  // IMG20230307070131~2.jpg
  // IMG20230307004845_00.jpg
  // IMG_20230228_004154.jpg

  const date = filename.match(/(\d{4})(\d{2})(\d{2})_?(\d{2})(\d{2})(\d{2})/);
  if (date) {
    console.log("Date found");
    return new Date(date[1], date[2] - 1, date[3], date[4], date[5], date[6]);
  } else {
    console.log("Date not found");
    return new Date();
  }
}

app.listen(process.env.PORT, () => console.log("Ready!"));
