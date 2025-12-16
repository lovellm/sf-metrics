export enum ErrorCodes {
  UNKNOWN = "UNKNOWN",
  AUTH = "NOT_AUTHENTICATED",
  ACCESS = "NO_ACCESS",
  BAD_REQUEST = "BAD_REQUEST",
  BAD_CONFIG = "BAD_CONFIG",
  QUERY = "QUERY",
}
type ErrorCodeParam = ErrorCodes | string;

export interface SerializedError {
  message?: string;
  errorCode?: string;
  name?: string;
  query?: string | string[];
  statusCode?: number;
}

/** Base API error. Defaults to a 500 with 'UNKNOWN' code */
export default class ApiError extends Error {
  /** Error code for this error */
  errorCode: string;
  /** HTTP Status Code that should be returned */
  statusCode: number;
  /** Queries that were generated, if they were made before error */
  query?: string | string[];

  constructor(message?: string, statusCode?: number, errorCode?: ErrorCodeParam) {
    super(message);
    this.errorCode = errorCode || ErrorCodes.UNKNOWN;
    this.statusCode = statusCode || 500;
  }

  serialize(): SerializedError {
    return {
      message: this.message,
      errorCode: this.errorCode,
      name: this.name,
      query: this.query || undefined,
      statusCode: this.statusCode,
    };
  }
}

/** Create an ApiError that results in a 401 with a AUTH error.
 */
export class AuthError extends ApiError {
  constructor(message?: string, errorCode?: ErrorCodeParam) {
    super(message, 401, errorCode || ErrorCodes.AUTH);
  }
}

/** Create an ApiError that results in a 403 with a ACCESS error.
 */
export class AccessError extends ApiError {
  constructor(message?: string, errorCode?: ErrorCodeParam) {
    super(message, 403, errorCode || ErrorCodes.ACCESS);
  }
}

/** Create an ApiError that results in a 400 with a BAD_SPEC error.
 */
export class RequestError extends ApiError {
  constructor(message?: string, errorCode?: ErrorCodeParam) {
    super(message, 400, errorCode || ErrorCodes.BAD_REQUEST);
  }
}

/** Create an ApiError that results in a 500 with a BAD_CONFIG error.
 */
export class ConfigError extends ApiError {
  constructor(message?: string, errorCode?: ErrorCodeParam) {
    super(message, 500, errorCode || ErrorCodes.BAD_CONFIG);
  }
}

/** If query given, adds it to the error. Rethrows the error as an ApiError if it is not already
 * @param e Original error from catch block
 * @param query If truthy, add this to the error's query field
 * @throws It will always throw an instance of ApiError
 */
export function rethrowWithQuery(e: unknown, query?: string) {
  if (e instanceof ApiError) {
    e.query = query ? query : undefined;
    throw e;
  } else {
    const err = e as Error;
    const error = new ApiError(err.message);
    error.query = query ? query : undefined;
    throw error;
  }
}
