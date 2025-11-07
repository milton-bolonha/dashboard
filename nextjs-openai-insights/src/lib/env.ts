export function getFunctionsBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, "");
  }

  // In Netlify production, the relative path works.
  if (process.env.NETLIFY === "true") {
    return "";
  }

  // During `netlify dev`, functions are available under the same origin.
  if (process.env.NETLIFY_DEV === "true") {
    return "";
  }

  // Local Next.js dev: developers should run `netlify dev`, but fall back to localhost:8888.
  return "http://localhost:8888";
}

