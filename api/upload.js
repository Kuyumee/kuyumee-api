async function upload(request, reply) {
  // Import modules
  const os = require("os");
  const path = require("path");
  const fs = require("fs-extra");
  const archiver = require("archiver");
  const bucket = require("../helpers/bucket.js");
  const axios = require("axios");

  const tempDir = fs.mkdtemp();

  const zipName = `${Date.now()}.zip`;
  const zipPath = path.join(tempDir, zipName);
  const zipWriteStream = fs.createWriteStream(zipPath);

  const archive = archiver("zip", {
    zlib: { level: 0 },
  });

  archive.pipe(zipWriteStream);

  for (const file of request.files) {
    const date = file.originalname.match(/(\d{4})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})/);
    const fileDate = date ? new Date(Date.UTC(date[1], date[2] - 1, date[3], date[4], date[5], date[6])) : new Date();

    fs.utimesSync(file.path, fileDate, fileDate);

    archive.file(file.path, { name: file.originalname });
  }

  archive.finalize();

  zipWriteStream.close();

  const url = await bucket.upload(zipPath, zipName);

  reply.send("OK");

  axios(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    data: {
      content: `${request.ip} uploaded ${request.files.length} files to ${url}`,
    },
  });

  fs.rmdir(tempDir);
}

module.exports = upload;
