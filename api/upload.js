async function upload(req, res) {
  const os = require("os");
  const path = require("path");
  const fs = require("fs-extra");
  const archiver = require("archiver");
  const bucket = require("../helpers/bucket.js");
  const axios = require("axios");

  const zipName = `${Date.now()}.zip`;
  const zipPath = path.join(os.tmpdir(), zipName);
  const zipWriteStream = fs.createWriteStream(zipPath);

  const archive = archiver("zip", {
    zlib: { level: 0 },
  });

  archive.pipe(zipWriteStream);

  for (const file of req.files) {
    const date = file.originalname.match(/(\d{4})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})/);
    const fileDate = date ? new Date(Date.UTC(date[1], date[2] - 1, date[3], date[4], date[5], date[6])) : new Date();
    fs.utimesSync(file.path, fileDate, fileDate);

    archive.file(file.path, { name: file.originalname });
  }

  archive.finalize();

  zipWriteStream.on("close", async () => {
    const url = await bucket.upload(zipPath, zipName);
    res.sendStatus(200);
    axios(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      data: {
        content: `Uploaded ${req.files.length} files to ${url}`,
      },
    });
    for (const file of req.files) {
      fs.removeSync(file.path);
    }
    fs.removeSync(zipPath);
  });
}

module.exports = upload;
