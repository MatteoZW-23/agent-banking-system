import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { reconciliationEngine } from "../services/reconciliation";

export const reconciliationRouter = router({
  reconcileProvider: protectedProcedure
    .input(z.object({ providerId: z.number(), date: z.date() }))
    .mutation(async ({ input }) => {
      return await reconciliationEngine.reconcileProvider(
        input.providerId,
        input.date
      );
    }),

  reconcileAll: protectedProcedure
    .input(z.object({ date: z.date() }))
    .mutation(async ({ input }) => {
      return await reconciliationEngine.reconcileAll(input.date);
    }),
});
