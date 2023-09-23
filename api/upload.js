const { send } = require("process");

async function upload(request, reply) {
  let files;

  try {
    files = await request.saveRequestFiles();
  } catch (e) {
    console.log(e);
    reply.code(500).send("Internal Server Error");
    await request.cleanRequestFiles();
    return;
  }

  const bucket = require("../helpers/bucket.js");

  if (files.length === 1) {
    const { filepath, filename } = files[0];
    const url = await bucket.upload(filepath, filename);
    sendToDiscord(`${request.headers["x-forwarded-for"]} uploaded ${filename} to ${url}`);
  } else if (files.length > 1) {
    const { zipPath, zipName } = makeZip(files);
    const url = await bucket.upload(zipPath, zipName);
    sendToDiscord(`${request.headers["x-forwarded-for"]} uploaded ${files.length} files to ${url}`);
  }

  reply.send("OK");
}

async function sendToDiscord(message) {
  const axios = require("axios");

  const webhook = process.env.DISCORD_WEBHOOK;
  if (!webhook) return;

  await axios(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    data: {
      content: message,
    },
  });
}

async function makeZip(files) {
  const os = require("os");
  const path = require("path");
  const fs = require("fs-extra");
  const archiver = require("archiver");

  const archive = archiver("zip", {
    zlib: { level: 0 },
  });

  const zipName = `upload-${Date.now()}.zip`;
  const zipPath = path.join(os.tmpdir(), zipName);
  const zipWriteStream = fs.createWriteStream(zipPath);

  archive.pipe(zipWriteStream);

  for (const file of files) {
    restoreDate(file.filepath, file.filename);
    archive.file(file.filepath, { name: file.filename });
  }

  await archive.finalize();
  await new Promise((res) => zipWriteStream.on("close", res));

  return { zipPath, zipName };
}

async function restoreDate(file) {
  const dateMatch = file.filename.match(/(\d{4})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})/);
  const restoredDate = dateMatch ? new Date(Date.UTC(dateMatch[1], dateMatch[2] - 1, dateMatch[3], dateMatch[4], dateMatch[5], dateMatch[6])) : new Date();
  fs.utimesSync(file.filepath, restoredDate, restoredDate);
}

module.exports = upload;
