async function upload(req, res) {
  console.log("Setting up");

  const os = require("os");
  const path = require("path");
  const fs = require("fs-extra");
  const archiver = require("archiver");
  const bucket = require("../helpers/bucket.js");
  const axios = require("axios");

  console.log("Uploading");

  const zipName = `${Date.now()}.zip`;
  const zipPath = path.join(os.tmpdir(), zipName);
  const zipWriteStream = fs.createWriteStream(zipPath);

  const archive = archiver("zip", {
    zlib: { level: 0 },
  });

  console.log("Piping");

  archive.pipe(zipWriteStream);

  for (const file of req.files) {
    console.log("Adding file", file.originalname);
    const date = file.originalname.match(/(\d{4})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})/);
    const fileDate = date ? new Date(Date.UTC(date[1], date[2] - 1, date[3], date[4], date[5], date[6])) : new Date();
    fs.utimesSync(file.path, fileDate, fileDate);

    archive.file(file.path, { name: file.originalname });
  }

  console.log("Finalizing");

  archive.finalize();

  zipWriteStream.on("close", async () => {
    console.log("Uploading zip");
    const url = await bucket.upload(zipPath, zipName);
    res.sendStatus(200);
    console.log("Uploaded zip");
    axios(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      data: {
        content: `${req.ip} uploaded ${req.files.length} files to ${url}`,
      },
    });
    console.log("Removing files");
    for (const file of req.files) {
      fs.removeSync(file.path);
    }
    fs.removeSync(zipPath);
  });
}

module.exports = upload;
