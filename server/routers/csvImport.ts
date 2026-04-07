import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { csvImportService } from "../services/csvImport";

export const csvImportRouter = router({
  importTransactions: protectedProcedure
    .input(z.object({ providerId: z.number(), csvContent: z.string() }))
    .mutation(async ({ input }) => {
      return await csvImportService.importTransactions(
        input.providerId,
        input.csvContent
      );
    }),

  validateCSV: protectedProcedure
    .input(z.object({ providerId: z.number(), csvContent: z.string() }))
    .query(async ({ input }) => {
      return await csvImportService.validateFormat(
        input.providerId,
        input.csvContent
      );
    }),

  getTemplate: protectedProcedure
    .input(z.object({ providerId: z.number() }))
    .query(async ({ input }) => {
      return await csvImportService.getTemplate(input.providerId);
    }),
});
