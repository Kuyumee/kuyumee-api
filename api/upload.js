async function upload(request, reply) {
  const os = require("os");
  const path = require("path");
  const fs = require("fs-extra");
  const archiver = require("archiver");
  const axios = require("axios");
  const bucket = require("../helpers/bucket.js");

  const zipName = `upload-${Date.now()}.zip`;
  const zipPath = path.join(os.tmpdir(), zipName);
  const zipWriteStream = fs.createWriteStream(zipPath);

  const archive = archiver("zip", {
    zlib: { level: 0 },
  });

  archive.pipe(zipWriteStream);

  const files = await request.saveRequestFiles();

  console.log("Saved files");

  for (const file of files) {
    const dateMatch = file.filename.match(/(\d{4})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})/);
    const restoredDate = dateMatch ? new Date(Date.UTC(dateMatch[1], dateMatch[2] - 1, dateMatch[3], dateMatch[4], dateMatch[5], dateMatch[6])) : new Date();
    fs.utimesSync(file.filepath, restoredDate, restoredDate);

    archive.file(file.filepath, { name: file.filename });
  }

  await archive.finalize();
  await new Promise((res) => zipWriteStream.on("close", res));

  const url = await bucket.upload(zipPath, zipName);

  console.log(request);

  await axios(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    data: {
      content: `${request.ip} uploaded ${files.length} files to ${url}`,
    },
  });

  reply.send("OK");
}

module.exports = upload;
