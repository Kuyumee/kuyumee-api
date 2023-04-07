const { default: axios } = require("axios");

async function upload(req, res) {
  const os = require("os");
  const path = require("path");
  const fs = require("fs-extra");
  const archiver = require("archiver");
  const bucket = require("../helpers/bucket.js");

  const filename = `${Date.now()}.zip`;
  const filepath = path.join(os.tmpdir(), filename);
  const output = fs.createWriteStream(filepath);

  output.on("close", async () => {
    const url = await bucket.upload(filepath, filename);
    res.send("Files uploaded successfully");
    axios(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      data: {
        content: `Uploaded ${req.files.length} files to ${url}`,
      },
    });
    for (const file of req.files) {
      fs.removeSync(file.path);
    }
  });

  const archive = archiver("zip", {
    zlib: { level: 0 },
  });

  archive.pipe(output);

  for (const file of req.files) {
    const date = file.originalname.match(/(\d{4})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})/);
    const fileDate = date ? new Date(Date.UTC(date[1], date[2] - 1, date[3], date[4], date[5], date[6])) : new Date();
    fs.utimesSync(file.path, fileDate, fileDate);

    archive.file(file.path, { name: file.originalname });
  }

  archive.finalize();
}

module.exports = upload;
