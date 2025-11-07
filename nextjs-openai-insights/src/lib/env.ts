const DEFAULT_PRODUCTION_URL = "https://aisalesnow.netlify.app";

export function getFunctionsBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, "");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && appUrl.trim().length > 0) {
    return appUrl.replace(/\/$/, "");
  }

  if (process.env.NETLIFY === "true" || process.env.NETLIFY_DEV === "true") {
    return "";
  }

  if (process.env.NODE_ENV === "production") {
    return "";
  }

  return DEFAULT_PRODUCTION_URL;
}

export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, "");
  }

  if (process.env.NETLIFY === "true" || process.env.NODE_ENV === "production") {
    return "";
  }

  return DEFAULT_PRODUCTION_URL;
}

