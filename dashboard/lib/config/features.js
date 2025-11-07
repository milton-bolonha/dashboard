const RAW_COOKIE_MODE = process.env.NEXT_PUBLIC_COOKIE_MODE ?? "true";

export const cookieModeEnabled = /^true$/i.test(RAW_COOKIE_MODE);

export function assertCookieModeEnabled() {
  if (!cookieModeEnabled) {
    throw new Error("Cookie workspace mode is not enabled");
  }
}

