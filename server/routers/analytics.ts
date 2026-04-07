import { publicProcedure, router } from "../_core/trpc";
import { getAnalyticsService } from "../services/analyticsService";
import { z } from "zod";

const analyticsService = getAnalyticsService();

export const analyticsRouter = router({
  /**
   * Get transaction trends for specified number of days
   */
  getTransactionTrends: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await analyticsService.getTransactionTrends(input.days);
    }),

  /**
   * Get provider performance metrics
   */
  getProviderMetrics: publicProcedure.query(async () => {
    return await analyticsService.getProviderMetrics();
  }),

  /**
   * Get employee performance metrics
   */
  getEmployeePerformance: publicProcedure.query(async () => {
    return await analyticsService.getEmployeePerformance();
  }),

  /**
   * Get daily financial summary
   */
  getDailyFinancialSummary: publicProcedure
    .input(z.object({ date: z.date().optional() }))
    .query(async ({ input }) => {
      return await analyticsService.getDailyFinancialSummary(input.date);
    }),

  /**
   * Get provider comparison data
   */
  getProviderComparison: publicProcedure.query(async () => {
    return await analyticsService.getProviderComparison();
  }),

  /**
   * Get transaction volume by provider
   */
  getTransactionVolumeByProvider: publicProcedure.query(async () => {
    return await analyticsService.getTransactionVolumeByProvider();
  }),

  /**
   * Get transaction status distribution
   */
  getTransactionStatusDistribution: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await analyticsService.getTransactionStatusDistribution(input.days);
    }),

  /**
   * Get hourly transaction pattern
   */
  getHourlyTransactionPattern: publicProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async ({ input }) => {
      return await analyticsService.getHourlyTransactionPattern(input.days);
    }),
});
