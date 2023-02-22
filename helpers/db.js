const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URL);

client.connect();

let db;

function init() {
  db = client.db("main");
}

function getDb() {
  return db;
}

module.exports = {
  init,
  getDb,
};
