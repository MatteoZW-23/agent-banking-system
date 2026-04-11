import { router, protectedProcedure, publicProcedure, adminProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getDb,
  getAllProviders,
  getProviderById,
  getTransactionsByProvider,
  getTransactionsByDateRange,
  getProviderFloats,
  getTotalFloatBalance,
  getAlertHistory,
  getFlaggedTransactions,
  getAllBranches,
  getAllEmployees,
  getEmployeeRegistrations,
  createCheckIn,
  checkoutEmployee,
  getLatestCheckIn,
  createFloatRequest,
  getAllFloatRequests,
  getEmployeeFloatRequests,
  processFloatRequest,
  createBalanceSnapshot,
  getLatestBalanceSnapshot,
  createEmployee,
  updateEmployee,
  registerAgentLine,
  deleteAgentLine,
  getCommissionStructures,
  getUserByEmail,
  getUserByOpenId,
  getEmployeeByEmail,
  setUserPassword,
  getEmployeeByCode,
} from "./db";
import { reconciliationEngine } from "./services/reconciliation";
import { transactionAnalysisService } from "./services/transactionAnalysis";
import { supabaseAuthService } from "./services/supabaseAuth";
import { alertService } from "./services/alertService";
import { commissionService } from "./services/commissionService";
import { csvImportService } from "./services/csvImport";
import { liquidityOrchestrator } from "./services/liquidity";
import { guardianService } from "./services/guardian";
import { systemRouter } from "./_core/systemRouter";
import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { floatRequests, users, branches } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { upsertUser } from "./db";
import { ENV } from "./_core/env";

const supervisorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.user as any)?.role;
  if (role !== "admin" && role !== "supervisor" && role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Management access required." });
  }
  return next({ ctx });
});

import { mfaRouter } from "./routers/mfa";

export const appRouter = router({
  system: systemRouter,
  mfa: mfaRouter,

  // ── AUTH ──────────────────────────────────────────────────────────────
  auth: router({
    me: protectedProcedure.query(({ ctx }) => {
      console.log(`[Auth] me query called for user: ${ctx.user?.email} (${ctx.user?.role})`);
      return ctx.user;
    }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().min(1, "Email is required"),
          password: z.string().min(1, "Password is required"),
          role: z.enum(["admin", "agent", "supervisor", "manager"]),
          mfaToken: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        console.log("[LOGIN ATTEMPT]", { email: input.email, role: input.role });
        const normalizedInputEmail = input.email.trim().toLowerCase();
        const hasMasterLoginConfigured = Boolean(
          ENV.masterLoginEmail && ENV.masterLoginPassword
        );
        const isMasterCredentials =
          hasMasterLoginConfigured &&
          normalizedInputEmail === ENV.masterLoginEmail &&
          input.password === ENV.masterLoginPassword;

        let matched = null;
        try {
          const allEmployees = await getAllEmployees();
          matched = allEmployees.find(
            (e) => e.email?.toLowerCase() === normalizedInputEmail
          );
        } catch (err) {
          console.warn("[Auth] Employees table unreachable, proceeding with master check");
        }

        // MFA CHECK
        let userRec = null;
        try {
          userRec = await getUserByEmail(normalizedInputEmail);
          
          // Fallback: If no user found by email, check if input was a Staff ID
          if (!userRec) {
            const employee = await getEmployeeByCode(input.email.toUpperCase());
            if (employee && employee.email) {
              userRec = await getUserByEmail(employee.email);
            } else if (employee) {
              // Handle case where employee has placeholder email (staffid@agent.co.zw)
              userRec = await getUserByEmail(`${employee.uniqueCode.toLowerCase()}@agent.co.zw`);
            }
          }
        } catch (err) {
          console.warn("[Auth] Users table unreachable");
          if (isMasterCredentials) {
            userRec = {
              openId: `master-${input.role}-${ENV.masterLoginEmail}`,
              role: input.role,
              email: normalizedInputEmail,
              name: ENV.masterLoginName,
              mfaEnabled: false
            } as any;
          }
        }

        let resolvedRole: "admin" | "agent" | "supervisor" | "manager" = input.role;
        let openId = "";
        let displayName = "";
        let mustChangePassword = false;

        if (isMasterCredentials) {
          resolvedRole = input.role;
          openId = `master-${resolvedRole}-${ENV.masterLoginEmail}`;
          displayName = ENV.masterLoginName;
          mustChangePassword = false;
        } else {
          // Check DB password first if it exists
          const isDbPasswordValid = Boolean(
            userRec?.password && userRec.password === input.password
          );

          const isAdmin = userRec?.role === "admin" && isDbPasswordValid;
          const isAgent = userRec?.role === "agent" && isDbPasswordValid;
          const isSupervisor = userRec?.role === "supervisor" && isDbPasswordValid;
          const isManager = userRec?.role === "manager" && isDbPasswordValid;

          if (!isAdmin && !isAgent && !isSupervisor && !isManager && !isDbPasswordValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Wrong email or password.",
            });
          }

          // Make sure the portal matches actual credentials
          if (input.role === "admin" && !isAdmin) {
            throw new TRPCError({ code: "FORBIDDEN", message: "These are not Admin credentials." });
          }
          if (input.role === "agent" && !isAgent) {
            throw new TRPCError({ code: "FORBIDDEN", message: "These are not Agent credentials." });
          }
          if (input.role === "supervisor" && !isSupervisor) {
            throw new TRPCError({ code: "FORBIDDEN", message: "These are not Supervisor credentials." });
          }
          if (input.role === "manager" && !isManager) {
            throw new TRPCError({ code: "FORBIDDEN", message: "These are not Manager credentials." });
          }

          resolvedRole =
            (userRec?.role as "admin" | "agent" | "supervisor" | "manager" | undefined) ??
            input.role;

          if (userRec?.mfaEnabled) {
            if (!input.mfaToken) {
              return { success: false, mfaRequired: true };
            }

            const { mfaService } = await import("./services/mfaService");
            const isValid = await mfaService.verifyToken(userRec.mfaSecret!, input.mfaToken);
            if (!isValid) {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid multifactor authentication code."
              });
            }
          }

          openId =
            userRec?.openId ||
            (isAdmin ? (ENV.ownerOpenId || "admin-id") : `usr-${resolvedRole}-${normalizedInputEmail}`);
          displayName =
            userRec?.name || (isAdmin ? "Administrator" : (matched?.name || normalizedInputEmail.split("@")[0]));
          mustChangePassword = userRec?.mustChangePassword ?? false;
        }

        try {
          await upsertUser({
            openId,
            name: displayName,
            email: normalizedInputEmail,
            role: resolvedRole,
            lastSignedIn: new Date(),
          });
        } catch (err) {
          console.warn("[Auth] Failed to upsert user, continuing session anyway");
        }

        const sessionToken = await sdk.createSessionToken(openId, {
          name: displayName,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        ctx.res.cookie("portal_role", input.role, { path: "/", maxAge: 3600000 });

        return {
          success: true,
          role: resolvedRole,
          mustChangePassword
        };
      }),

    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        let user = await getUserByEmail(input.email);
        const employee = await getEmployeeByEmail(input.email);
        const isAdminEmail = input.email.toLowerCase() === "admin@agent.co.zw";

        if (!user && !employee && !isAdminEmail) {
          // Security: don't reveal if user exists, but we return success message
          return { success: true };
        }

        const openId = user?.openId ||
          (isAdminEmail ? (ENV.ownerOpenId || "admin-id") :
            (employee ? `usr-${employee.role}-${employee.uniqueCode}` : `forgot-${input.email}`));

        if (!user) {
          await upsertUser({
            openId,
            name: isAdminEmail ? "Administrator" : (employee?.name || input.email.split("@")[0]),
            email: input.email,
            role: isAdminEmail ? "admin" : ((employee?.role as any) || "agent"),
          });
          user = await getUserByOpenId(openId);
        }

        // Generate a simple reset code for internal tracking
        const resetCode = employee?.uniqueCode || openId;

        // Trigger Supabase Realtime Password Reset Email
        const emailSent = await supabaseAuthService.sendResetEmail(input.email);

        if (emailSent) {
          console.log(`[AUTH] Supabase sent password reset email to ${input.email}`);
        } else {
          console.log(`[AUTH] Local fallback: reset code for ${input.email} is ${resetCode}`);
        }

        return { success: true, resetCode };
      }),

    setupPassword: publicProcedure
      .input(z.object({ code: z.string(), password: z.string().min(6) }))
      .mutation(async ({ input }) => {
        const allEmployees = await getAllEmployees();
        const matched = allEmployees.find(e => e.uniqueCode === input.code);

        let email = "";
        if (matched) {
          email = matched.email!;
        } else {
          // If code is not employee code, check if it's an openId
          const user = await getUserByOpenId(input.code);
          if (user) {
            email = user.email!;
          } else {
            // Second fallback: check if code itself is an email
            if (input.code.includes("@")) {
              email = input.code;
            }
          }
        }

        if (!email) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid reset code." });
        }

        await setUserPassword(email, input.password);
        return { success: true };
      }),

    logout: protectedProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie("portal_role", { path: "/" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    agreeToTerms: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        await db.update(users)
          .set({
            agreedToTerms: true,
            termsAgreedAt: new Date()
          })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),
  }),

  // ── NODES (Workforce) ──────────────────────────────────────────────
  nodes: router({
    getMyEmployeeInfo: protectedProcedure.query(async ({ ctx }) => {
      const email = ctx.user?.email || "";
      if (!email) return null;
      return await getEmployeeByEmail(email);
    }),

    listBranches: protectedProcedure.query(async () => await getAllBranches()),

    listProviders: protectedProcedure.query(async () => await getAllProviders()),

    listEmployees: supervisorProcedure.query(async () => await getAllEmployees()),

    createEmployee: supervisorProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email().optional().or(z.literal("")),
          phone: z.string().optional(),
          location: z.string().optional(),
          branchId: z.number(),
          role: z.enum(["agent", "supervisor", "manager"]).default("agent"),
          startingCapital: z.number().optional().default(0),
        })
      )
      .mutation(async ({ input }) => {
        const employee = await createEmployee(input);
        console.log(`[ONBOARDING] New employee registered: ${input.name} (${employee?.uniqueCode})`);
        return employee;
      }),

    updateEmployee: supervisorProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["active", "inactive", "suspended"]),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateEmployee(id, data);
      }),

    registerLine: supervisorProcedure
      .input(
        z.object({
          employeeId: z.number(),
          providerId: z.number(),
          agentCode: z.string(),
          merchantId: z.string().optional(),
          floatAccount: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => await registerAgentLine(input)),

    deleteLine: supervisorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => await deleteAgentLine(input.id)),

    getEmployeeLines: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input, ctx }) => {
        const employee = await getEmployeeByEmail(ctx.user.email!);
        if (employee?.id !== input.employeeId && ctx.user.role === "agent") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await getEmployeeRegistrations(input.employeeId);
      }),

    createCheckIn: protectedProcedure
      .input(
        z.object({
          employeeId: z.number(),
          branchId: z.number().optional(),
          openingCash: z.number().optional(),
          openingLineBalances: z.any().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const employee = await getEmployeeByEmail(ctx.user.email!);
        if (employee?.id !== input.employeeId && ctx.user.role === "agent") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await createCheckIn(input);
      }),

    checkout: protectedProcedure
      .input(
        z.object({
          checkInId: z.number(),
          closingCash: z.number().optional(),
          closingLineBalances: z.any().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { checkInId, ...rest } = input;
        return await checkoutEmployee(checkInId, rest);
      }),

    getLatestCheckIn: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input, ctx }) => {
        const employee = await getEmployeeByEmail(ctx.user.email!);
        if (employee?.id !== input.employeeId && ctx.user.role === "agent") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await getLatestCheckIn(input.employeeId);
      }),

    // Float Requests — agent submits, supervisor/admin approves
    requestFloat: protectedProcedure
      .input(
        z.object({
          employeeId: z.number(),
          providerId: z.number(),
          amount: z.number().positive(),
          workerNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const employee = await getEmployeeByEmail(ctx.user.email!);
        if (employee?.id !== input.employeeId && ctx.user.role === "agent") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await createFloatRequest(input);
      }),

    myFloatRequests: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input, ctx }) => {
        const employee = await getEmployeeByEmail(ctx.user.email!);
        if (employee?.id !== input.employeeId && ctx.user.role === "agent") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await getEmployeeFloatRequests(input.employeeId);
      }),

    listFloatRequests: supervisorProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => await getAllFloatRequests(input.status)),

    processRequest: supervisorProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["approved", "declined", "transferred"]),
          adminNotes: z.string().optional(),
          transactionReference: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const result = await processFloatRequest(id, rest);

        // Auto-settlement when approved
        if (input.status === "approved") {
          const db = await getDb();
          if (db) {
            const req = await db.select().from(floatRequests).where(eq(floatRequests.id, id)).limit(1);
            if (req.length > 0) {
              await liquidityOrchestrator.runAutoSettlement(req[0].employeeId);
            }
          }
        }

        return result;
      }),

    updateBalances: protectedProcedure
      .input(
        z.object({
          checkInId: z.number(),
          employeeId: z.number(),
          cashAmount: z.number().optional(),
          floatBalances: z.any().optional(),
          updateReason: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const employee = await getEmployeeByEmail(ctx.user.email!);
        if (employee?.id !== input.employeeId && ctx.user.role === "agent") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await createBalanceSnapshot(input);
      }),

    getLatestSnapshot: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input, ctx }) => {
        const employee = await getEmployeeByEmail(ctx.user.email!);
        if (employee?.id !== input.employeeId && ctx.user.role === "agent") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await getLatestBalanceSnapshot(input.employeeId);
      }),

    listBranches: protectedProcedure
      .query(async () => {
        const db = await getDb();
        return db ? await db.select().from(branches) : [];
      }),
  }),

  // ── LIQUIDITY ──────────────────────────────────────────────────────
  liquidity: router({
    getPosition: supervisorProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => await liquidityOrchestrator.getAgentPosition(input.employeeId)),

    triggerSettlement: supervisorProcedure
      .input(z.object({ employeeId: z.number(), threshold: z.number().optional() }))
      .mutation(async ({ input }) =>
        await liquidityOrchestrator.runAutoSettlement(input.employeeId, input.threshold)
      ),
  }),

  // ── PROVIDERS ─────────────────────────────────────────────────────
  providers: router({
    list: protectedProcedure.query(async () => await getAllProviders()),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => await getProviderById(input.id)),

    health: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const provider = await getProviderById(input.id);
        if (!provider) return { status: "not_found", healthy: false };
        return { status: "ok", healthy: true, lastSync: provider.lastSyncAt };
      }),
  }),

  // ── TRANSACTIONS ──────────────────────────────────────────────────
  transactions: router({
    listByProvider: protectedProcedure
      .input(
        z.object({
          providerId: z.number(),
          limit: z.number().default(100),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) =>
        await getTransactionsByProvider(input.providerId, input.limit, input.offset)
      ),

    listByDateRange: protectedProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }))
      .query(async ({ input }) =>
        await getTransactionsByDateRange(input.startDate, input.endDate)
      ),

    flaggedTransactions: supervisorProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async () => await getFlaggedTransactions("flagged")),

    analyzeTransaction: supervisorProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const guardResult = await guardianService.performActiveGuard(input);
        const llmResult = await transactionAnalysisService.analyzeTransaction(input);
        return { guardResult, llmResult };
      }),
  }),

  // ── RECONCILIATION ────────────────────────────────────────────────
  reconciliation: router({
    reconcileProvider: supervisorProcedure
      .input(z.object({ providerId: z.number(), date: z.date() }))
      .mutation(async ({ input }) =>
        await reconciliationEngine.reconcileProvider(input.providerId, input.date)
      ),

    reconcileAll: supervisorProcedure
      .input(z.object({ date: z.date() }))
      .mutation(async ({ input }) => await reconciliationEngine.reconcileAll(input.date)),
  }),

  // ── FLOATS ────────────────────────────────────────────────────────
  floats: router({
    getByProvider: supervisorProcedure
      .input(z.object({ providerId: z.number() }))
      .query(async ({ input }) => await getProviderFloats(input.providerId)),

    getTotalBalance: supervisorProcedure.query(async () => await getTotalFloatBalance()),
  }),

  // ── ALERTS ────────────────────────────────────────────────────────
  alerts: router({
    getHistory: supervisorProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => await getAlertHistory(input.limit, input.offset)),

    checkThresholds: supervisorProcedure
      .mutation(async () => await alertService.checkAllThresholds()),

    acknowledge: supervisorProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input, ctx }) =>
        await alertService.acknowledgeAlert(input.alertId, ctx.user.id)
      ),
  }),

  // ── COMMISSIONS ───────────────────────────────────────────────────
  commissions: router({
    getReport: adminProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }))
      .query(async ({ input }) =>
        await commissionService.getCommissionReport(input.startDate, input.endDate)
      ),

    getEmployeeReport: supervisorProcedure
      .input(z.object({ employeeCode: z.string(), startDate: z.date(), endDate: z.date() }))
      .query(async ({ input }) =>
        await commissionService.calculateEmployeeCommission(
          input.employeeCode,
          input.startDate,
          input.endDate
        )
      ),

    convert: protectedProcedure
      .input(
        z.object({
          employeeId: z.number(),
          amount: z.number().positive(),
          target: z.enum(["cash", "float"]),
          providerId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) =>
        await commissionService.convertCommissionToCapital(
          input.employeeId,
          input.amount,
          input.target,
          input.providerId
        )
      ),

    getSupervisorPayout: supervisorProcedure.query(async ({ ctx }) => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const report = await commissionService.getCommissionReport(start, end);
      return {
        dailyPool: parseFloat((report as any).totalCommission || "0") * 0.05,
        currency: "USD",
        status: "Accumulating"
      };
    }),
  }),

  // ── CSV IMPORT ────────────────────────────────────────────────────
  csvImport: router({
    importTransactions: adminProcedure
      .input(z.object({ providerId: z.number(), csvContent: z.string() }))
      .mutation(async ({ input }) =>
        await csvImportService.importTransactions(input.providerId, input.csvContent)
      ),

    validateCSV: adminProcedure
      .input(z.object({ providerId: z.number(), csvContent: z.string() }))
      .query(async ({ input }) =>
        await csvImportService.validateFormat(input.providerId, input.csvContent)
      ),

    getTemplate: protectedProcedure
      .input(z.object({ providerId: z.number() }))
      .query(async ({ input }) => await csvImportService.getTemplate(input.providerId)),
  }),

  // ── REPORTS ───────────────────────────────────────────────────────
  reports: router({
    dailySummary: supervisorProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        const start = new Date(input.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(input.date);
        end.setHours(23, 59, 59, 999);
        const txs = await getTransactionsByDateRange(start, end);

        return {
          transactionCount: txs.length,
          totalAmount: txs.reduce((sum, t) => sum + parseFloat((t.amount as any) || "0"), 0),
          totalFees: txs.reduce((sum, t) => sum + parseFloat((t.fee as any) || "0"), 0),
          completedCount: txs.filter((t) => t.status === "completed").length,
          failedCount: txs.filter((t) => t.status === "failed").length,
        };
      }),

    providerBreakdown: supervisorProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        const providers = await getAllProviders();
        const results = [];
        for (const p of providers) {
          const txs = await getTransactionsByProvider(p.id);
          results.push({
            provider: p.name,
            transactionCount: txs.length,
            totalAmount: txs.reduce((sum, t) => sum + parseFloat((t.amount as any) || "0"), 0),
            completedCount: txs.filter((t) => t.status === "completed").length,
            failedCount: txs.filter((t) => t.status === "failed").length,
          });
        }
        return results;
      }),
  }),

  // ── COMMISSION STRUCTURES ─────────────────────────────────────────
  commissionStructures: router({
    getByProvider: protectedProcedure
      .input(z.object({ providerId: z.number() }))
      .query(async ({ input }) => await getCommissionStructures(input.providerId)),
  }),

  // -- AI ASSISTANT --
  ai: router({
    chat: protectedProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        let systemContext = "You are the Operations Intelligence Engine, a professional corporate banking support system.";
        try {
          const { 
            getAllBranches, getAllEmployees, getAlertHistory, getTotalFloatBalance 
          } = await import("./db");
          
          const [branches, employees, alerts, floatBalance] = await Promise.all([
            getAllBranches(),
            getAllEmployees(),
            getAlertHistory(5, 0),
            getTotalFloatBalance()
          ]);

          systemContext = `
[SYSTEM: SOVEREIGN FINANCE NETWORK]
- Status: OPERATIONAL
- Nodes: ${branches.length} | Staff: ${employees.length} | Alerts: ${alerts.length}
- Liquidity: ${floatBalance?.[0]?.total ? `${parseFloat(floatBalance[0].total as string).toLocaleString()}` : "Calculating..."}

[ROLE: SOVEREIGN ASSISTANT]
You are a professional Security Operations Intel engine. Use the data above for analytical responses to ${ctx.user?.name || "User"} (${ctx.user?.role || "Staff"}). Focus on system performance and signal.
          `.trim();
        } catch (err) {
          console.warn("[AI] Context injection failed:", err);
        }

        const response = await invokeLLM({
          messages: [{ role: "system", content: systemContext }, ...input.messages.filter(m => m.role !== "system")] as any,
        });

        const content = response.choices[0]?.message?.content;
        if (Array.isArray(content)) {
          return content.map(part => ('text' in part ? (part as any).text : "")).join("\n");
        }
        return content || "No response received";
      }),
  }),
});

export type AppRouter = typeof appRouter;
