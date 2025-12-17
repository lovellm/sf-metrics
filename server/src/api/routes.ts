import { FastifyInstance } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { DataResultSchema, QuerySchema } from "../types/dataApi.js";
import generateQuery, { GeneratedQuerySchema } from "../query/generateQuery.js";
import query from "./query.js";
import { SfContextHeadersSchema } from "../types/spscTypes.js";
import currentUser, { UserRequestSchema, UserResultSchema } from "./currentUser.js";
import sfProxyRoutes from "./sfProxyRoutes.js";
import ApiError from "../errors.js";

export default async function routes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // add a custom error handler to make sure we respond with the right statusCode
  fastify.setErrorHandler(function (error, request, reply) {
    if (error instanceof ApiError) {
      reply.status(error.statusCode).send(error.serialize());
    } else {
      throw error;
    }
  });

  server.post(
    "/generateQuery",
    {
      schema: {
        body: QuerySchema,
        response: {
          200: GeneratedQuerySchema,
        },
        headers: SfContextHeadersSchema,
      },
    },
    async (request) => {
      return generateQuery(request.body, { checkTableAccess: true });
    },
  );

  server.post(
    "/query",
    {
      schema: {
        body: QuerySchema,
        response: {
          200: DataResultSchema,
        },
        headers: SfContextHeadersSchema,
      },
    },
    async (request) => {
      return query(request, request.body, {
        checkTableAccess: true,
        asCaller: request.body?.asUser,
      });
    },
  );

  server.post(
    "/user",
    {
      schema: {
        body: UserRequestSchema,
        response: {
          200: UserResultSchema,
        },
      },
    },
    async (request) => {
      return currentUser(request, request.body?.roles);
    },
  );

  server.get(
    "/user",
    {
      schema: {
        response: {
          200: UserResultSchema,
        },
      },
    },
    async (request) => {
      return currentUser(request);
    },
  );

  sfProxyRoutes(fastify);
}
