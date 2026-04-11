import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";

// 1. Validate Critical Environment Variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  console.log("Starting server construction...");
  const app = express();
  const server = createServer(app);

  console.log("Configuring middleware...");
  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  console.log("Adding request logger...");
  // Basic Request Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (res.statusCode >= 400) {
        console.error(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  registerOAuthRoutes(app);

  console.log("Registering tRPC...");
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ path, error }) => {
        console.error(`[tRPC Error] at ${path}:`, error.message);
      },
    })
  );

  console.log("Setting up frontend (NODE_ENV=" + process.env.NODE_ENV + ")...");
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Global Error]:", err);
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });

  // Graceful Shutdown
  const shutdown = () => {
    console.log("Shutting down server...");
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch(err => {
  console.error("[Fatal Startup Error]:", err);
  process.exit(1);
});
