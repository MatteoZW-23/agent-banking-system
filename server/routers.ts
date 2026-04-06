import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb, getAllProviders, getProviderById, getTransactionsByProvider, getTransactionsByDateRange, getProviderFloats, getTotalFloatBalance, getAlertHistory, getFlaggedTransactions } from "./db";
import { reconciliationEngine } from "./services/reconciliation";
import { transactionAnalysisService } from "./services/transactionAnalysis";
import { alertService } from "./services/alertService";
import { commissionService } from "./services/commissionService";
import { csvImportService } from "./services/csvImport";
import { systemRouter } from "./_core/systemRouter";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: protectedProcedure.query((opts) => opts.ctx.user),
    logout: protectedProcedure.mutation(({ ctx }) => {
      const { getSessionCookieOptions } = require("./_core/cookies");
      const { COOKIE_NAME } = require("../shared/const");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Provider management
  providers: router({
    list: protectedProcedure.query(async () => {
      return await getAllProviders();
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getProviderById(input.id);
    }),

    health: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const provider = await getProviderById(input.id);
      if (!provider) {
        return { status: "not_found", healthy: false };
      }
      // In a real implementation, this would call the provider's health check
      return { status: "ok", healthy: true, lastSync: provider.lastSyncAt };
    }),
  }),

  // Transaction management
  transactions: router({
    listByProvider: protectedProcedure
      .input(z.object({ providerId: z.number(), limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getTransactionsByProvider(input.providerId, input.limit, input.offset);
      }),

    listByDateRange: protectedProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }))
      .query(async ({ input }) => {
        return await getTransactionsByDateRange(input.startDate, input.endDate);
      }),

    flaggedTransactions: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getFlaggedTransactions("flagged");
      }),

    analyzeTransaction: protectedProcedure
      .input(z.object({ transactionId: z.number() }))
      .mutation(async ({ input }) => {
        return await transactionAnalysisService.analyzeTransaction(input.transactionId);
      }),
  }),

  // Reconciliation
  reconciliation: router({
    reconcileProvider: protectedProcedure
      .input(z.object({ providerId: z.number(), date: z.date() }))
      .mutation(async ({ input }) => {
        return await reconciliationEngine.reconcileProvider(input.providerId, input.date);
      }),

    reconcileAll: protectedProcedure
      .input(z.object({ date: z.date() }))
      .mutation(async ({ input }) => {
        return await reconciliationEngine.reconcileAll(input.date);
      }),
  }),

  // Float management
  floats: router({
    getByProvider: protectedProcedure
      .input(z.object({ providerId: z.number() }))
      .query(async ({ input }) => {
        return await getProviderFloats(input.providerId);
      }),

    getTotalBalance: protectedProcedure.query(async () => {
      return await getTotalFloatBalance();
    }),
  }),

  // Commission calculations
  commissions: router({
    calculateEmployee: protectedProcedure
      .input(z.object({ employeeCode: z.string(), startDate: z.date(), endDate: z.date() }))
      .query(async ({ input }) => {
        return await commissionService.calculateEmployeeCommission(
          input.employeeCode,
          input.startDate,
          input.endDate
        );
      }),

    getReport: protectedProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }))
      .query(async ({ input }) => {
        return await commissionService.getCommissionReport(input.startDate, input.endDate);
      }),
  }),

  // Alerts
  alerts: router({
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getAlertHistory(input.limit, input.offset);
      }),

    acknowledge: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await alertService.acknowledgeAlert(input.alertId, ctx.user.id);
        return { success: true };
      }),

    checkThresholds: protectedProcedure.mutation(async () => {
      await alertService.checkFloatThresholds();
      await alertService.checkSuspiciousPatterns();
      return { success: true };
    }),
  }),

  // Reports
  reports: router({
    dailySummary: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const { transactions } = await import("../drizzle/schema");
        const { eq, and, gte, lte } = await import("drizzle-orm");

        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(input.date);
        endOfDay.setHours(23, 59, 59, 999);

        const txns = await db
          .select()
          .from(transactions)
          .where(
            and(
              gte(transactions.transactionTime, startOfDay),
              lte(transactions.transactionTime, endOfDay)
            )
          );

        const totalAmount = txns.reduce((sum, t) => {
          const amount = t.amount
            ? (typeof t.amount === "string" ? parseFloat(t.amount) : (t.amount as number))
            : 0;
          return sum + amount;
        }, 0);

        const totalFees = txns.reduce((sum, t) => {
          const fee = t.fee
            ? (typeof t.fee === "string" ? parseFloat(t.fee) : (t.fee as number))
            : 0;
          return sum + fee;
        }, 0);

        return {
          date: input.date.toISOString().split("T")[0],
          transactionCount: txns.length,
          totalAmount,
          totalFees,
          completedCount: txns.filter((t) => t.status === "completed").length,
          failedCount: txns.filter((t) => t.status === "failed").length,
        };
      }),

    agentPnL: protectedProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }))
      .query(async ({ input }) => {
        const commissionReport = await commissionService.getCommissionReport(input.startDate, input.endDate);
        return commissionReport;
      }),

    providerBreakdown: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const { transactions, providers } = await import("../drizzle/schema");
        const { eq, and, gte, lte } = await import("drizzle-orm");

        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(input.date);
        endOfDay.setHours(23, 59, 59, 999);

        const allProviders = await getAllProviders();
        const breakdown = [];

        for (const provider of allProviders) {
          const txns = await db
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.providerId, provider.id),
                gte(transactions.transactionTime, startOfDay),
                lte(transactions.transactionTime, endOfDay)
              )
            );

          const totalAmount = txns.reduce((sum, t) => {
            const amount = typeof t.amount === "string" ? parseFloat(t.amount) : (t.amount as number);
            return sum + amount;
          }, 0);

          breakdown.push({
            provider: provider.name,
            transactionCount: txns.length,
            totalAmount,
            completedCount: txns.filter((t) => t.status === "completed").length,
            failedCount: txns.filter((t) => t.status === "failed").length,
          });
        }

        return breakdown;
      }),
  }),

  // CSV Import
  csvImport: router({
    importTransactions: protectedProcedure
      .input(z.object({ providerId: z.number(), csvContent: z.string() }))
      .mutation(async ({ input }) => {
        return await csvImportService.importCSV(input.providerId, input.csvContent);
      }),

    validateCSV: protectedProcedure
      .input(z.object({ providerId: z.number(), csvContent: z.string() }))
      .query(async ({ input }) => {
        return csvImportService.validateCSVFormat(input.csvContent);
      }),

    getTemplate: protectedProcedure
      .input(z.object({ providerId: z.number() }))
      .query(async ({ input }) => {
        const provider = await getProviderById(input.providerId);
        if (!provider) throw new Error("Provider not found");
        return csvImportService.generateCSVTemplate(provider.name);
      }),
  }),
});

export type AppRouter = typeof appRouter;
