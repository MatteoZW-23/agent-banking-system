import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const cookieHeader = opts.req.headers.cookie;
      let devRoleOverride = (opts.req as any).cookies?.dev_role;
      
      if (!devRoleOverride && cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, c) => {
          const [k, v] = c.trim().split('=');
          acc[k] = v;
          return acc;
        }, {} as Record<string, string>);
        devRoleOverride = cookies['dev_role'];
      }
      
      if (!devRoleOverride) {
        devRoleOverride = process.env.DEV_ROLE;
      }

      const role = devRoleOverride === "agent" ? "agent" : devRoleOverride === "supervisor" ? "supervisor" : "admin";
      const isAgent = role === "agent";
      const isSupervisor = role === "supervisor";
      
      user = {
        id: 1,
        openId: "dev-owner-id",
        name: isAgent ? "Dev Agent" : isSupervisor ? "Dev Supervisor" : "Dev Admin",
        email: isAgent ? "agent@agent.co.zw" : isSupervisor ? "takudzwa@agent.co.zw" : "admin@agent.co.zw",
        role: role as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "mock",
      };
    } else {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
