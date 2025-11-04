import { NextResponse } from "next/server";

const DEFAULT_STATUS = 503;
const DEFAULT_MESSAGE = "Database connection failed";

function isHttpResponse(error) {
  return error instanceof Response;
}

function sanitizeErrorDetails(error) {
  if (!error) return null;
  const { name, message, code } = error;
  return {
    name: name || "Error",
    message: message || "Unknown error",
    ...(code ? { code } : {}),
  };
}

export function withMongoErrorHandler(handler, options = {}) {
  const {
    logPrefix = "[MongoDB]",
    status = DEFAULT_STATUS,
    message = DEFAULT_MESSAGE,
  } = options;

  if (typeof handler !== "function") {
    throw new TypeError("withMongoErrorHandler requires a function handler");
  }

  return async function wrappedHandler(...args) {
    try {
      return await handler(...args);
    } catch (error) {
      if (isHttpResponse(error)) {
        throw error;
      }

      console.error(`${logPrefix} error:`, error);

      return NextResponse.json(
        {
          error: message,
          details: sanitizeErrorDetails(error),
        },
        { status }
      );
    }
  };
}
