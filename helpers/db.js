const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });

let mongodb = null;

connect();

async function connect() {
  if (mongodb) return;

  await client.connect();
  mongodb = client.db("main");

  console.log("Connected to MongoDB");
}

async function getDB() {
  await connect();
  return mongodb;
}

module.exports = {
  getDB,
};
