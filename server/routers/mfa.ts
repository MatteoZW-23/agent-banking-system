import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { mfaService } from "../services/mfaService";
import { updateUser } from "../db";
import { TRPCError } from "@trpc/server";

export const mfaRouter = router({
  /**
   * Core Step 1: Initialize MFA setup
   * Generates a secret and returns the otpauth URI for QR generation
   */
  setup: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (user.mfaEnabled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "MFA is already enabled for this account."
      });
    }

    const secret = mfaService.generateSecret();
    const uri = mfaService.getOtpauthUri(secret, user.email || "agent");

    // We don't save the secret yet; we'll save it only when verified
    return { secret, uri };
  }),

  /**
   * Core Step 2: Verify and Enable MFA
   * Validates a token against the provided secret and persists to DB
   */
  enable: protectedProcedure
    .input(z.object({
      secret: z.string(),
      token: z.string().length(6)
    }))
    .mutation(async ({ input, ctx }) => {
      const isValid = await mfaService.verifyToken(input.secret, input.token);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid verification code. Please try again."
        });
      }

      const backupCodes = mfaService.generateBackupCodes();
      
      await updateUser(ctx.user.openId, {
        mfaEnabled: true,
        mfaSecret: input.secret,
        mfaBackupCodes: backupCodes
      });

      return { success: true, backupCodes };
    }),

  /**
   * Disable MFA
   * Requires a valid token for security verification
   */
  disable: protectedProcedure
    .input(z.object({
      token: z.string().length(6)
    }))
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user.mfaEnabled || !user.mfaSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "MFA is not enabled."
        });
      }

      const isValid = await mfaService.verifyToken(user.mfaSecret, input.token);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Security verification failed. Invalid code."
        });
      }

      await updateUser(user.openId, {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null
      });

      return { success: true };
    }),
    
  /**
   * Check MFA status (for secondary challenge)
   */
  getStatus: protectedProcedure.query(({ ctx }) => {
    return {
      enabled: ctx.user.mfaEnabled,
    };
  })
});
