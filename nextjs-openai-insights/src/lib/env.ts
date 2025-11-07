const DEFAULT_NETLIFY_BASE_URL = "https://aisalesnow.netlify.app";

function isNetlifyEnvironment(): boolean {
  return (
    process.env.NETLIFY === "true" ||
    process.env.NETLIFY_DEV === "true" ||
    process.env.NEXT_RUNTIME === "edge"
  );
}

function isVercelEnvironment(): boolean {
  return (
    process.env.VERCEL === "1" ||
    typeof process.env.NEXT_PUBLIC_VERCEL_ENV !== "undefined" ||
    typeof process.env.VERCEL_URL === "string"
  );
}

function resolveNetlifyBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, "");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && appUrl.trim().length > 0) {
    return appUrl.replace(/\/$/, "");
  }

  if (isNetlifyEnvironment()) {
    return "";
  }

  return DEFAULT_NETLIFY_BASE_URL;
}

function resolveVercelBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_VERCEL_FUNCTIONS_BASE_URL,
    process.env.NEXT_PUBLIC_VERCEL_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.replace(/\/$/, "");
    }
  }

  return "";
}

export function getFunctionsBaseUrl(): string {
  return resolveNetlifyBaseUrl();
}

export function getGenerateServiceUrl(): string {
  const explicitEndpoint = process.env.NEXT_PUBLIC_GENERATE_ENDPOINT;
  if (explicitEndpoint && explicitEndpoint.trim().length > 0) {
    return explicitEndpoint.trim();
  }

  const netlifyBase = resolveNetlifyBaseUrl();
  if (netlifyBase && netlifyBase.includes(".netlify")) {
    return `${netlifyBase}/.netlify/functions/ai-generate`;
  }

  if (isVercelEnvironment()) {
    const vercelBase = resolveVercelBaseUrl();
    if (vercelBase.length > 0) {
      return `${vercelBase}/api/generate`;
    }
    return "/api/generate";
  }
  if (netlifyBase.length > 0) {
    return `${netlifyBase}/.netlify/functions/ai-generate`;
  }

  return "/api/generate";
}

export function getNetlifyFunctionUrl(functionName: string): string {
  const base = resolveNetlifyBaseUrl();
  if (base.length === 0) {
    if (isNetlifyEnvironment()) {
      return `/.netlify/functions/${functionName}`;
    }
    return `${DEFAULT_NETLIFY_BASE_URL}/.netlify/functions/${functionName}`;
  }
  return `${base}/.netlify/functions/${functionName}`;
}

