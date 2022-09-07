console.log("Starting...");

require("dotenv").config();

const express = require("express");
const app = express();

require("./server/helpers/db.js").init();

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
    const result = await require("./server/api/animetracker.js").animetracker(req.query.f, req.query.d);
    res.send(result);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT, () => console.log(`Ready!`));
