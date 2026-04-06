export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const readEnv = (value: string | undefined) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

const authPortalUrl = readEnv(import.meta.env.VITE_AUTH_PORTAL_URL);
const authClientId = readEnv(import.meta.env.VITE_AUTH_CLIENT_ID);

export function getAuthConfigError() {
  const missingKeys = [
    authPortalUrl ? null : "VITE_AUTH_PORTAL_URL",
    authClientId ? null : "VITE_AUTH_CLIENT_ID",
  ].filter((value): value is string => value !== null);

  if (missingKeys.length === 0) {
    return null;
  }

  return `Authentication is not configured. Set ${missingKeys.join(" and ")} in your .env or .env.local file.`;
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  if (!authPortalUrl || !authClientId || typeof window === "undefined") {
    return null;
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL("/app-auth", authPortalUrl);
    url.searchParams.set("appId", authClientId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error("[Auth] Failed to construct login URL", error);
    return null;
  }
};
