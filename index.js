require("dotenv").config();
const fastify = require("fastify");
const path = require("path");
const multer = require("multer");
const os = require("os");

// Initialize the database and bucket helpers
require("./helpers/db.js").init();
require("./helpers/bucket.js").init();

const app = fastify();

// Create a storage object for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
});

// Create a multer object
const upload = multer({
  storage: storage,
});

// Add CORS headers
app.addCors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
  headers: ["X-Requested-With", "content-type"],
  credentials: true,
});

// Define the routes
app.get("/", (req, res) => {
  res.end("OK");
});

app.get("/animetracker", async (req, res) => {
  try {
    if (req.query.key !== process.env.KEY) return res.sendStatus(403);
    await require("./api/animetracker.js")(req, res);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    if (!req?.files?.length) return res.status(400).send("No files specified");
    await require("./api/upload.js")(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading files");
  }
});

app.get("/download", async (req, res) => {
  try {
    if (!req.query.f) return res.status(400).send("No file specified");
    res.sendFile(path.join(__dirname, `/uploads/${req.query.f}`));
  } catch (error) {
    console.error(error);
    res.status(500).send("Error downloading files");
  }
});

// Listen on the specified port
app.listen(process.env.PORT);
