const { MongoClient, GridFSBucket } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URL);

let mongodb;
let bucket;

async function init() {
  await client.connect();
  mongodb = client.db("main");
  bucket = new GridFSBucket(mongodb);
}

function db() {
  return mongodb;
}

function getBucket() {
  return bucket;
}

module.exports = {
  init,
  db,
  getBucket,
};
