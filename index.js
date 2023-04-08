require("dotenv").config();

const path = require("path");

const fs = require("fs-extra");
const express = require("express");
const multer = require("multer");
const os = require("os");

const app = express();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
});

const upload = multer({ storage: storage });

require("./helpers/db.js");
require("./helpers/bucket.js");

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

app.get("/animetracker", async (req, res) => {
  try {
    if (req.query.key !== process.env.KEY) return res.sendStatus(403);
    require("./api/animetracker.js")(req, res);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    if (!req?.files?.length) return res.status(400).send("No files specified");
    await require("./api/upload.js")(req, res);
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

app.listen(process.env.PORT);
