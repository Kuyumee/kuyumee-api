const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URL);

client.connect();
const db = client.db("database").collection("data");

let cache = {};

async function init() {
  const rawdb = await db.find().toArray();
  for (let i = 0; i < rawdb.length; i++) {
    cache[rawdb[i].key] = rawdb[i].value;
  }
}

function get(key) {
  return cache[key] ? cache[key] : null;
}

async function set(key, value) {
  cache[key] = value;
  db.findOneAndReplace({ key }, { key, value }).then((a) => (a.value === null ? db.insertOne({ key, value }) : ""));
}

module.exports = { set, get, init };
