console.log("Starting...");

require("dotenv").config();

const express = require("express");
const http = require("http");
const app = express();

const { animetracker } = require("./server/api/animetracker.js");
const { echo } = require("./server/api/echo.js");

require("./server/helpers/db.js");

app.use("/", function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
});

app.get("/", (req, res) => res.end("OK"));

app.get("/api/anime-tracker", async (req, res) => {
  try {
    const result = await animetracker(req.query.f, req.query.d);
    res.send(result);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.get("/api/echo", async (req, res) => {
  try {
    const link = await echo(req.query.q);
    res.send(link);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

http.createServer(app).listen(process.env.PORT, () => console.log("Ready!"));
