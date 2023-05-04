const { S3Client, PutObjectCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");

let client = null;

async function init() {
  if (client) return;
  const connecting = new S3Client({
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY,
      secretAccessKey: process.env.R2_SECRET_KEY,
    },
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
  });

  await connecting.send(
    new HeadBucketCommand({
      Bucket: process.env.R2_BUCKET_NAME,
    })
  );

  client = connecting;

  console.log("Connected to Cloudflare R2");
}

async function upload(filepath, filename) {
  await init();

  const key = filename;

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(filepath),
      // ContentLength: fs.statSync(filepath).size,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

module.exports = {
  upload,
  init,
};
