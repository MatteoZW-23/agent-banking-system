import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

let envLoaded = false;

function resolveMode(nodeEnv: string | undefined) {
  return nodeEnv === "production" ? "production" : "development";
}

export function loadEnvFiles(cwd: string = process.cwd()) {
  if (envLoaded) {
    return;
  }

  const mode = resolveMode(process.env.NODE_ENV);
  const envFiles = [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"];

  for (const envFile of envFiles) {
    const envPath = path.resolve(cwd, envFile);
    if (!fs.existsSync(envPath)) {
      continue;
    }

    config({ path: envPath, override: false, quiet: true });
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = mode;
  }

  envLoaded = true;
}

loadEnvFiles();
