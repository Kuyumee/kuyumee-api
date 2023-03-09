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
      for (const file of req.files) {
        fs.removeSync(file.path);
      }
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
  // IMG_20230307_114313.jpg IMG20230307070131.jpg IMG20230307070131~2.jpg IMG20230307004845_00.jpg IMG_20230228_004154.jpg
  const date = filename.match(/[^\d](\d{4})(\d{2})(\d{2})_?(\d{2})(\d{2})(\d{2})[^\d]/);
  if (date) {
    return new Date(date[1], date[2] - 1, date[3], date[4], date[5], date[6]);
  } else {
    return new Date();
  }
}

app.listen(process.env.PORT, () => console.log("Ready!"));
