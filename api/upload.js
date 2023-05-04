async function upload(request, reply) {
  console.log("Saving files");
  let files;
  try {
    files = req.files();
  } catch (e) {
    console.log("An error occurred while saving files. Cleaning up");
    request = null;
    reply = null;
    return;
  }

  console.log("Loading modules");
  const os = require("os");
  const path = require("path");
  const fs = require("fs-extra");
  const archiver = require("archiver");
  const axios = require("axios");
  const bucket = require("../helpers/bucket.js");

  console.log("Creating zip");
  const archive = archiver("zip", {
    zlib: { level: 0 },
  });

  const zipName = `upload-${Date.now()}.zip`;
  const zipPath = path.join(os.tmpdir(), zipName);
  const zipWriteStream = fs.createWriteStream(zipPath);

  archive.pipe(zipWriteStream);

  console.log("Adding files to zip");
  for (const file of files) {
    const dateMatch = file.filename.match(/(\d{4})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})/);
    const restoredDate = dateMatch ? new Date(Date.UTC(dateMatch[1], dateMatch[2] - 1, dateMatch[3], dateMatch[4], dateMatch[5], dateMatch[6])) : new Date();
    fs.utimesSync(file.filepath, restoredDate, restoredDate);

    archive.file(file.filepath, { name: file.filename });
  }

  console.log("Finalizing zip");
  await archive.finalize();
  await new Promise((res) => zipWriteStream.on("close", res));

  console.log("Uploading zip");
  const url = await bucket.upload(zipPath, zipName);

  fs.removeSync(zipPath);

  await axios(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    data: {
      content: `${request.headers["x-forwarded-for"]} uploaded ${files.length} files to ${url}`,
    },
  });

  reply.send("OK");
}

module.exports = upload;
