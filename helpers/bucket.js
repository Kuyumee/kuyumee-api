const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");

let client;

connect();

async function connect() {
  client = new S3Client({
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY,
      secretAccessKey: process.env.R2_SECRET_KEY,
    },
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
  });

  console.log("Connected to Cloudflare R2");
}

async function upload(filepath, filename) {
  const key = filename;

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(filepath),
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

module.exports = {
  upload,
};
