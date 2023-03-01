const { MongoClient, GridFSBucket } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URL);

let db;
let bucket;

async function init() {
  await client.connect();
  db = client.db("main");
  bucket = new GridFSBucket(db);
}

function getDb() {
  return db;
}

function getBucket() {
  return bucket;
}

module.exports = {
  init,
  getDb,
  getBucket,
};
