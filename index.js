// npm i dotenv fastify @fastify/cors @fastify/multipart @aws-sdk/client-s3 fs-extra nyaapi mongodb archiver axios
require("dotenv").config();
const fastify = require("fastify")({ logger: true });

require("./helpers/db.js").init();
require("./helpers/bucket.js").init();

fastify.register(require("@fastify/cors"), { origin: "*" });
fastify.register(require("@fastify/multipart"), { limits: { fileSize: 5000000000 } });

fastify.setErrorHandler(async (error, request, reply) => {
  console.log(error);
  reply.status(500).send("Internal Server Error");
});

fastify.get("/", (request, reply) => {
  reply.send("OK");
});

fastify.get("/animetracker", async (request, reply) => {
  if (request.query.key !== process.env.KEY) return reply.code(403).send("Invalid key");
  await require("./api/animetracker.js")(request, reply);
});

fastify.post("/upload", async (request, reply) => {
  await require("./api/upload.js")(request, reply);
});

fastify.listen({ host: process.env.HOST, port: process.env.PORT });
