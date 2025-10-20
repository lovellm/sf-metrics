import { FastifyRequest } from "fastify";
import { once } from "node:events";
import logger from "../logging/logger.js";

/** when the given request is closed (for any reason including finished or aborted), abort the aborter */
export async function abortOnClose<T>(
  request: FastifyRequest,
  aborter: AbortController,
  returnValue?: T,
): Promise<T | undefined> {
  try {
    await once(request.raw.socket, "close");
    // abort the signal
    aborter.abort();
  } catch (err) {
    logger.warn("abortOnClose threw");
    // do nothing
  }

  return returnValue;
}
