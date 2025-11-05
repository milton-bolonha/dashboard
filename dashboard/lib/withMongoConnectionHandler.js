import { NextResponse } from "next/server";
import { withMongoConnection } from "@/lib/db";

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

const DEFAULT_OPTIONS = {
  label: "withMongoConnectionHandler",
  stage: "api",
  retries: 2,
  status: 503,
  message: "Database temporarily unavailable",
};

export function withMongoConnectionHandler(handler, options = {}) {
  if (typeof handler !== "function") {
    throw new TypeError(
      "withMongoConnectionHandler requires a function handler"
    );
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  return async function wrappedHandler(req, ...rest) {
    try {
      await withMongoConnection(async () => {}, {
        label: mergedOptions.label,
        stage: mergedOptions.stage,
        retries: mergedOptions.retries,
      });

      return await handler(req, ...rest);
    } catch (error) {
      if (isHttpResponse(error)) {
        throw error;
      }

      const statusCode =
        error?.code === "MONGODB_CIRCUIT_OPEN"
          ? mergedOptions.status
          : mergedOptions.status;

      return NextResponse.json(
        {
          error: mergedOptions.message,
          details: sanitizeErrorDetails(error),
        },
        { status: statusCode }
      );
    }
  };
}
