const DEFAULT_NETLIFY_BASE_URL = "https://aisalesnow.netlify.app";

type HostKind = "netlify" | "vercel" | "custom";

const NETLIFY_HOST_PATTERN = /\.netlify\.app$/i;
const VERCEL_HOST_PATTERN = /\.vercel\.app$/i;

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

function debugLog(label: string, value: unknown): void {
  if (
    process.env.DEBUG_GENERATE_URLS !== "false" ||
    process.env.NODE_ENV !== "production"
  ) {
    try {
      console.log(`[env:url] ${label}:`, value);
    } catch {
      // ignore logging errors
    }
  }
}

function cleanUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function detectHostKind(url: string | undefined): HostKind {
  if (!url) return "custom";
  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname;
    if (NETLIFY_HOST_PATTERN.test(hostname)) return "netlify";
    if (VERCEL_HOST_PATTERN.test(hostname)) return "vercel";
    return "custom";
  } catch {
    return "custom";
  }
}

function resolveConfiguredBaseUrl(): string | undefined {
  const candidates = [
    process.env.NEXT_PUBLIC_GENERATE_BASE_URL,
    process.env.NEXT_PUBLIC_VERCEL_FUNCTIONS_BASE_URL,
    process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return cleanUrl(candidate.trim());
    }
  }

  return undefined;
}

export function getGenerateServiceUrl(): string {
  const explicitEndpoint = process.env.NEXT_PUBLIC_GENERATE_ENDPOINT;
  if (explicitEndpoint && explicitEndpoint.trim().length > 0) {
    debugLog("NEXT_PUBLIC_GENERATE_ENDPOINT", explicitEndpoint);
    return explicitEndpoint.trim();
  }

  const configuredBase = resolveConfiguredBaseUrl();
  if (configuredBase) {
    const hostKind = detectHostKind(configuredBase);
    debugLog("Configured base URL", { configuredBase, hostKind });
    if (hostKind === "netlify") {
      return `${configuredBase}/.netlify/functions/ai-generate`;
    }
    if (hostKind === "vercel") {
      return "/api/generate";
    }
    return `${configuredBase}/api/generate`;
  }

  if (isVercelEnvironment()) {
    debugLog("Environment detected", "vercel");
    return "/api/generate";
  }

  if (isNetlifyEnvironment()) {
    debugLog("Environment detected", "netlify");
    return "/.netlify/functions/ai-generate";
  }

  debugLog("Environment detected", "fallback-netlify-default");
  return `${DEFAULT_NETLIFY_BASE_URL}/.netlify/functions/ai-generate`;
}

export function getNetlifyFunctionUrl(functionName: string): string {
  const configuredBase = resolveConfiguredBaseUrl();
  if (configuredBase) {
    const hostKind = detectHostKind(configuredBase);
    debugLog("Netlify function resolution", {
      configuredBase,
      hostKind,
      functionName,
    });
    if (hostKind === "netlify") {
      return `${configuredBase}/.netlify/functions/${functionName}`;
    }
    if (hostKind === "vercel") {
      return `/api/${functionName}`;
    }
    return `${configuredBase}/api/${functionName}`;
  }

  if (isNetlifyEnvironment()) {
    debugLog("Netlify function environment", "netlify");
    return `/.netlify/functions/${functionName}`;
  }

  if (isVercelEnvironment()) {
    debugLog("Netlify function environment", "vercel");
    return `/api/${functionName}`;
  }

  debugLog("Netlify function environment", "fallback-netlify-default");
  return `${DEFAULT_NETLIFY_BASE_URL}/.netlify/functions/${functionName}`;
}
