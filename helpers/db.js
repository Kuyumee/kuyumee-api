const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });

let mongodb;
connect();

async function connect() {
  await client.connect();
  mongodb = client.db("main");

  console.log("Connected to MongoDB");
}

function getDB() {
  return mongodb;
}

module.exports = {
  getDB,
};
