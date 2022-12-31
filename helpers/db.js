const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URL);

client.connect();

const db = client.db("main");

module.exports = db;
