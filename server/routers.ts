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
} from "./db";
import { reconciliationEngine } from "./services/reconciliation";
import { transactionAnalysisService } from "./services/transactionAnalysis";
import { alertService } from "./services/alertService";
import { commissionService } from "./services/commissionService";
import { csvImportService } from "./services/csvImport";
import { liquidityOrchestrator } from "./services/liquidity";
import { guardianService } from "./services/guardian";
import { systemRouter } from "./_core/systemRouter";
import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { floatRequests } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Supervisor: admin + supervisor can access
const supervisorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.user as any)?.role;
  if (role !== "admin" && role !== "supervisor") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Supervisor or Admin access required." });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ── AUTH ──────────────────────────────────────────────────────────────
  auth: router({
    me: protectedProcedure.query(({ ctx }) => ctx.user),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
          role: z.enum(["admin", "agent", "supervisor"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const allEmployees = await getAllEmployees();
        const matched = allEmployees.find(
          (e) => e.email?.toLowerCase() === input.email.toLowerCase()
        );

        const isAdmin = input.email === "admin@agent.co.zw" && input.password === "admin123";
        const isDefaultSupervisor = input.email === "takudzwa@agent.co.zw" && input.password === "supervisor123";
        const isAgent = !!matched && input.password === "agent123" && matched.role === "agent";
        const isSupervisor =
          (!!matched && input.password === "supervisor123" && matched.role === "supervisor") || isDefaultSupervisor;

        if (!isAdmin && !isAgent && !isSupervisor) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Wrong email or password.",
          });
        }

        // Make sure the portal matches actual credentials
        if (input.role === "admin" && !isAdmin)
          throw new TRPCError({ code: "FORBIDDEN", message: "These are not Admin credentials." });
        if (input.role === "agent" && !isAgent)
          throw new TRPCError({ code: "FORBIDDEN", message: "These are not Agent credentials." });
        if (input.role === "supervisor" && !isSupervisor)
          throw new TRPCError({ code: "FORBIDDEN", message: "These are not Supervisor credentials." });

        ctx.res.cookie("dev_role", input.role, { path: "/", maxAge: 3600000 });
        return { success: true, role: input.role };
      }),

    logout: protectedProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie("dev_role", { path: "/" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // ── AI & GUARDIAN ──────────────────────────────────────────────────
  ai: router({
    chat: protectedProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string() })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are the AgentTrack AI Ethical Shield. Help detect fraud, smurfing, and collusion in agent banking. Be professional and direct.",
              },
              ...input.messages,
            ],
          });
          return response.choices[0]?.message?.content || "No response available.";
        } catch {
          return "AI assistant is temporarily unavailable.";
        }
      }),

    radar: supervisorProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await guardianService.getLiquidityForecast(input.employeeId);
      }),
  }),

  // ── NODES (Workforce) ──────────────────────────────────────────────
  nodes: router({
    listBranches: protectedProcedure.query(async () => await getAllBranches()),

    listProviders: protectedProcedure.query(async () => await getAllProviders()),

    listEmployees: supervisorProcedure.query(async () => await getAllEmployees()),

    createEmployee: supervisorProcedure
      .input(
        z.object({
          uniqueCode: z.string().optional(),
          name: z.string(),
          email: z.string().email().optional().or(z.literal("")),
          phone: z.string().optional(),
          location: z.string().optional(),
          branchId: z.number(),
          role: z.enum(["agent", "supervisor", "manager"]).default("agent"),
        })
      )
      .mutation(async ({ input }) => {
        const employee = await createEmployee(input);
        console.log(`[ONBOARDING] New employee: ${input.name} (${input.uniqueCode})`);
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
      .query(async ({ input }) => await getEmployeeRegistrations(input.employeeId)),

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
      .mutation(async ({ input }) => await createCheckIn(input)),

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
      .query(async ({ input }) => await getLatestCheckIn(input.employeeId)),

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
      .mutation(async ({ input }) => await createFloatRequest(input)),

    myFloatRequests: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => await getEmployeeFloatRequests(input.employeeId)),

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
      .mutation(async ({ input }) => await createBalanceSnapshot(input)),

    getLatestSnapshot: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => await getLatestBalanceSnapshot(input.employeeId)),
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

    flagged: supervisorProcedure
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
});

export type AppRouter = typeof appRouter;
