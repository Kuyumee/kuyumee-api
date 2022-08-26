console.log("Starting...");

require("dotenv").config();

const express = require("express");
const http = require("http");
const app = express();

const { animepics } = require("./server/api/animepics.js");
const { animetracker } = require("./server/api/animetracker.js");
const { echo } = require("./server/api/echo.js");

require("./server/helpers/db.js");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (req, res) => res.end("Ready!"));

app.get("/api/anime-tracker", async (req, res) => {
  try {
    const result = await animetracker(req.query.f, req.query.d);
    res.send(result);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.get("/api/anime-pics", async (req, res) => {
  try {
    const images = await animepics(req.query.dates, req.query.pages, req.get("host"));
    res.send(images);
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
