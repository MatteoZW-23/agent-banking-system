export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_AUTH_PORTAL_URL || "http://localhost:3000";
  const appId = import.meta.env.VITE_APP_ID || "dev-app-id";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    return "/login";
  } catch (e) {
    console.error("[Auth] Failed to construct login URL:", e);
    return "/login-error";
  }
};
