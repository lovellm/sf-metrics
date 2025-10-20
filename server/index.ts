import path from "node:path";
import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import logger from "./src/logging/logger.js";
import routes from "./src/api/routes.js";
import tableAccess from "./src/utils/tableAccess.js";
dotenv.config({ quiet: true });

const envPort = Number.parseInt(process.env.PORT || "");
const port = envPort > 0 ? envPort : 3000;

const init = async () => {
  const server = Fastify({
    // logger: { level: "warn" },
  });

  server.register(fastifyStatic, {
    root: path.resolve("./public"),
    prefix: "/",
    index: ["index.html", "default.html"],
    wildcard: false,
  });

  await server.register(swagger);
  await server.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });

  await tableAccess.initialize();

  server.get("/healthcheck", async () => new Date().toISOString());

  server.register(routes, { prefix: "api" });

  server.get("*", { schema: { hide: true } }, async (request, reply) => {
    const path = request.url;
    if (path.startsWith("/api")) {
      return reply.callNotFound();
    }
    if (path.startsWith("/documentation")) {
      return reply.callNotFound();
    }
    // to allow SPA paths to work
    return reply.sendFile("index.html");
  });

  // Run the server!
  try {
    await server.listen({ port: port });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
  logger.info(`server running on port ${port}`);
};

try {
  await init();
} catch (e) {
  console.error("init threw", e);
  process.exit(1);
}
