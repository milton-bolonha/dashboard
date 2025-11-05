import { NextResponse } from "next/server";
import { withMongoConnection } from "@/lib/db";

const healthStateKey = Symbol.for("dashboard.mongoHealthState");
const healthState = (global[healthStateKey] ??= {
  failureCount: 0,
  circuitOpenUntil: 0,
  lastError: null,
});

const FAILURE_THRESHOLD = parseInt(
  process.env.MONGODB_HEALTH_FAILURE_THRESHOLD ?? "3",
  10
);
const HEALTH_CIRCUIT_TIMEOUT_MS = parseInt(
  process.env.MONGODB_HEALTH_TIMEOUT_MS ?? "30000",
  10
);

export async function GET() {
  if (
    healthState.circuitOpenUntil &&
    Date.now() < healthState.circuitOpenUntil
  ) {
    const retryAfterSeconds = Math.ceil(
      (healthState.circuitOpenUntil - Date.now()) / 1000
    );

    return NextResponse.json(
      {
        status: "degraded",
        reason: "circuit-open",
        retryAfter: new Date(healthState.circuitOpenUntil).toISOString(),
        lastError: healthState.lastError,
      },
      {
        status: 503,
        headers: {
          "Retry-After": `${retryAfterSeconds}`,
        },
      }
    );
  }

  const startedAt = Date.now();

  try {
    const pingResult = await withMongoConnection(
      async ({ db }) => {
        return db.admin().ping();
      },
      {
        label: "healthcheck:ping",
        stage: "healthcheck",
        retries: 2,
        metadata: {
          endpoint: "/api/health/mongodb",
        },
      }
    );

    healthState.failureCount = 0;
    healthState.circuitOpenUntil = 0;
    healthState.lastError = null;

    return NextResponse.json(
      {
        status: "ok",
        durationMs: Date.now() - startedAt,
        result: pingResult?.ok ?? pingResult,
      },
      { status: 200 }
    );
  } catch (error) {
    healthState.failureCount += 1;
    healthState.lastError = error?.message;

    if (healthState.failureCount >= FAILURE_THRESHOLD) {
      healthState.circuitOpenUntil = Date.now() + HEALTH_CIRCUIT_TIMEOUT_MS;
    }

    return NextResponse.json(
      {
        status: "error",
        message: error?.message,
        failureCount: healthState.failureCount,
        circuitOpenUntil:
          healthState.circuitOpenUntil &&
          healthState.circuitOpenUntil > Date.now()
            ? new Date(healthState.circuitOpenUntil).toISOString()
            : null,
      },
      { status: 503 }
    );
  }
}
