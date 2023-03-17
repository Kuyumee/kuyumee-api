require("dotenv").config();

const path = require("path");

const fs = require("fs-extra");
const express = require("express");
const multer = require("multer");
const archiver = require("archiver");
const animetracker = require("./api/animetracker.js");

const app = express();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.ensureDirSync("uploads");
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const existing = fs.readdirSync("uploads").filter((f) => f.startsWith(file.originalname));
    if (existing.length > 0) {
      const last = existing[existing.length - 1];
      const lastNumber = parseInt(last.split("~")[1]) || 1;
      cb(null, `${file.originalname}~${lastNumber + 1}`);
    } else {
      cb(null, file.originalname);
    }
  },
});
const upload = multer({ storage: storage });
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
    if (req.query.key !== process.env.KEY) return res.sendStatus(403);
    res.send(await animetracker(req.query.f, req.query.d));
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).send("No files specified");

    const path = path.join(__dirname, `/uploads/${Date.now()}}`);
    const output = fs.createWriteStream();

    output.on("close", () => {
      fs.renameSync(path, path + ".zip");
      res.send("Files uploaded successfully");
      for (const file of req.files) {
        fs.removeSync(file.path);
      }
    });

    const archive = archiver("zip-encrypted", { zlib: { level: 9 }, encryptionMethod: "aes256", password: process.env.KEY });

    archive.pipe(output);

    for (const file of req.files) {
      const date = file.originalname.match(/(\d{4})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})/);
      const fileDate = date ? new Date(Date.UTC(date[1], date[2] - 1, date[3], date[4], date[5], date[6])) : new Date();
      fs.utimesSync(file.path, fileDate, fileDate);

      archive.file(file.path, { name: file.originalname });
    }

    archive.finalize();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading files");
  }
});

app.get("/download", async (req, res) => {
  try {
    if (!req.query.f) return res.status(400).send("No file specified");
    res.sendFile(path.join(__dirname, `/uploads/${req.query.f}`));
  } catch (error) {
    console.error(error);
    res.status(500).send("Error downloading files");
  }
});

app.listen(process.env.PORT, () => console.log("Ready!"));
