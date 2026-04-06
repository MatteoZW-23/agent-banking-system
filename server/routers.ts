import { router, protectedProcedure } from "./_core/trpc";
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
  getLatestBalanceSnapshot
} from "./db";
import { reconciliationEngine } from "./services/reconciliation";
import { transactionAnalysisService } from "./services/transactionAnalysis";
import { alertService } from "./services/alertService";
import { commissionService } from "./services/commissionService";
import { csvImportService } from "./services/csvImport";
import { TransactionOrchestrator } from "./services/transactionOrchestrator";
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

  // Nodes & Workforce Monitoring
  nodes: router({
    listBranches: protectedProcedure.query(async () => {
      return await getAllBranches();
    }),
    listEmployees: protectedProcedure.query(async () => {
      return await getAllEmployees();
    }),
    getEmployeeLines: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await getEmployeeRegistrations(input.employeeId);
      }),
    createCheckIn: protectedProcedure
      .input(z.object({ 
        employeeId: z.number(), 
        branchId: z.number().optional(),
        openingCash: z.number().optional(),
        openingLineBalances: z.any().optional(),
        notes: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        return await createCheckIn(input);
      }),
    checkout: protectedProcedure
      .input(z.object({ 
        checkInId: z.number(),
        closingCash: z.number().optional(),
        closingLineBalances: z.any().optional(),
        notes: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { checkInId, ...rest } = input;
        return await checkoutEmployee(checkInId, rest);
      }),
    getLatestCheckIn: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await getLatestCheckIn(input.employeeId);
      }),

    // Float Requests (Worker Side)
    requestFloat: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        providerId: z.number(),
        amount: z.number(),
        workerNotes: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        return await createFloatRequest(input);
      }),
    
    myFloatRequests: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await getEmployeeFloatRequests(input.employeeId);
      }),

    // Admin Side Float Management
    listFloatRequests: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        return await getAllFloatRequests(input.status);
      }),
    
    processRequest: protectedProcedure
       .input(z.object({
          id: z.number(),
          status: z.enum(["approved", "declined", "transferred"]),
          adminNotes: z.string().optional(),
          transactionReference: z.string().optional()
       }))
       .mutation(async ({ input }) => {
          const { id, ...rest } = input;
          return await processFloatRequest(id, rest);
       }),

    // Mid-Shift Balance Updates
    updateBalances: protectedProcedure
       .input(z.object({
          checkInId: z.number(),
          employeeId: z.number(),
          cashAmount: z.number().optional(),
          floatBalances: z.any().optional(),
          updateReason: z.string().optional()
       }))
       .mutation(async ({ input }) => {
          return await createBalanceSnapshot(input);
       }),
    
    getLatestSnapshot: protectedProcedure
       .input(z.object({ employeeId: z.number() }))
       .query(async ({ input }) => {
          return await getLatestBalanceSnapshot(input.employeeId);
       })
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
      .input(z.number())
      .mutation(async ({ input }) => {
        return await transactionAnalysisService.analyzeTransaction(input);
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

  // Alerts & Notifications
  alerts: router({
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getAlertHistory(input.limit, input.offset);
      }),

    checkThresholds: protectedProcedure.mutation(async () => {
      return await alertService.checkAllThresholds();
    }),

    acknowledge: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        return await alertService.acknowledgeAlert(input.alertId);
      }),
  }),

  // Commissions
  commissions: router({
    getReport: protectedProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }))
      .query(async ({ input }) => {
        return await commissionService.generateReport(input.startDate, input.endDate);
      }),
  }),

  // CSV Import
  csvImport: router({
    importTransactions: protectedProcedure
      .input(z.object({ providerId: z.number(), csvContent: z.string() }))
      .mutation(async ({ input }) => {
        return await csvImportService.importTransactions(input.providerId, input.csvContent);
      }),

    validateCSV: protectedProcedure
      .input(z.object({ providerId: z.number(), csvContent: z.string() }))
      .query(async ({ input }) => {
        return await csvImportService.validateFormat(input.providerId, input.csvContent);
      }),

    getTemplate: protectedProcedure
      .input(z.object({ providerId: z.number() }))
      .query(async ({ input }) => {
        return await csvImportService.getTemplate(input.providerId);
      }),
  }),
  
  // Reports
  reports: router({
    dailySummary: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        // This would be a more complex aggregation in a real app
        const txs = await getTransactionsByDateRange(
          new Date(input.date.setHours(0, 0, 0, 0)),
          new Date(input.date.setHours(23, 59, 59, 999))
        );
        
        return {
          transactionCount: txs.length,
          totalAmount: txs.reduce((sum, t) => sum + parseFloat((t.amount as any) || "0"), 0),
          totalFees: txs.reduce((sum, t) => sum + parseFloat((t.fee as any) || "0"), 0),
          completedCount: txs.filter(t => t.status === 'completed').length,
          failedCount: txs.filter(t => t.status === 'failed').length,
        };
      }),
      
    providerBreakdown: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        const providers = await getAllProviders();
        const results = [];
        
        for (const p of providers) {
          const txs = await getTransactionsByProvider(p.id);
          // Simplified for brevity
          results.push({
            provider: p.name,
            transactionCount: txs.length,
            totalAmount: txs.reduce((sum, t) => sum + parseFloat((t.amount as any) || "0"), 0),
            completedCount: txs.filter(t => t.status === 'completed').length,
            failedCount: txs.filter(t => t.status === 'failed').length,
          });
        }
        
        return results;
      }),
  }),
});

export type AppRouter = typeof appRouter;
