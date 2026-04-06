import "./loadEnv";

export const ENV = {
  authClientId: process.env.VITE_AUTH_CLIENT_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  authServerUrl: process.env.AUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  serviceBaseUrl: process.env.SERVICE_BASE_URL ?? "",
  serviceApiKey: process.env.SERVICE_API_KEY ?? "",
};
