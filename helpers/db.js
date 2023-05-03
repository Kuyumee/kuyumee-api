const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });

let mongodb = null;


async function init() {
  if (mongodb) return;

  await client.connect();
  mongodb = client.db("main");

  console.log("Connected to MongoDB");
}

async function getDB() {
  await init();
  return mongodb;
}

module.exports = {
  getDB,
  init,
};
