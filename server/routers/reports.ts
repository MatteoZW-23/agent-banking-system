import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getTransactionsByDateRange,
  getAllProviders,
  getTransactionsByProvider,
} from "../db";

export const reportsRouter = router({
  dailySummary: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ input }) => {
      const txs = await getTransactionsByDateRange(
        new Date(input.date.setHours(0, 0, 0, 0)),
        new Date(input.date.setHours(23, 59, 59, 999))
      );

      return {
        transactionCount: txs.length,
        totalAmount: txs.reduce(
          (sum, t) => sum + parseFloat((t.amount as any) || "0"),
          0
        ),
        totalFees: txs.reduce(
          (sum, t) => sum + parseFloat((t.fee as any) || "0"),
          0
        ),
        completedCount: txs.filter(t => t.status === "completed").length,
        failedCount: txs.filter(t => t.status === "failed").length,
      };
    }),

  providerBreakdown: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ input }) => {
      const providers = await getAllProviders();
      const results = [];

      for (const p of providers) {
        const txs = await getTransactionsByProvider(p.id);
        results.push({
          provider: p.name,
          transactionCount: txs.length,
          totalAmount: txs.reduce(
            (sum, t) => sum + parseFloat((t.amount as any) || "0"),
            0
          ),
          completedCount: txs.filter(t => t.status === "completed").length,
          failedCount: txs.filter(t => t.status === "failed").length,
        });
      }

      return results;
    }),
});
