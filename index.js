require("dotenv").config();
const fastify = require("fastify")();

const multer = require("multer");
const os = require("os");

require("./helpers/db.js").init();
require("./helpers/bucket.js").init();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
});

const upload = multer({
  storage: storage,
});

fastify.register((fastify, options, done) => {
  fastify.register(require("@fastify/cors"), {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
  });

  fastify.setErrorHandler(async (error, request, reply) => {
    console.log(error);
    reply.status(500).send("Internal server error");
  });

  fastify.get("/", (request, reply) => {
    reply.send("OK");
  });

  fastify.get("/animetracker", async (request, reply) => {
    if (request.query.key !== process.env.KEY) return reply.code(403).send("Invalid key");
    await require("./api/animetracker.js")(request, reply);
  });

  fastify.post("/upload", { files: upload.array("files") }, async (request, reply) => {
    if (request?.files?.length) return reply.code(400).send("No files specified");
    await require("./api/upload.js")(request, reply);
  });

  done();
});

fastify.listen({ port: process.env.PORT });
