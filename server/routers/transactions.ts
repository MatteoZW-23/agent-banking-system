import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getTransactionsByProvider,
  getTransactionsByDateRange,
  getFlaggedTransactions,
} from "../db";
import { transactionAnalysisService } from "../services/transactionAnalysis";

export const transactionsRouter = router({
  listByProvider: protectedProcedure
    .input(
      z.object({
        providerId: z.number(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return await getTransactionsByProvider(
        input.providerId,
        input.limit,
        input.offset
      );
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
});
