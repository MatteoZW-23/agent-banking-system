import { router, protectedProcedure, adminProcedure, supervisorProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAllBranches,
  getAllEmployees,
  createEmployee,
  updateEmployee,
  registerAgentLine,
  deleteAgentLine,
  getEmployeeRegistrations,
  createCheckIn,
  checkoutEmployee,
  getLatestCheckIn,
  createFloatRequest,
  getEmployeeFloatRequests,
  getAllFloatRequests,
  processFloatRequest,
  createBalanceSnapshot,
  getLatestBalanceSnapshot,
} from "../db";

export const nodesRouter = router({
  listBranches: protectedProcedure.query(async () => {
    return await getAllBranches();
  }),
  listEmployees: supervisorProcedure.query(async () => {
    return await getAllEmployees();
  }),
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
      return await createEmployee(input);
    }),
  registerLine: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        providerId: z.number(),
        agentCode: z.string(),
        merchantId: z.string().optional(),
        floatAccount: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await registerAgentLine(input);
    }),
  getEmployeeLines: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
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
    .mutation(async ({ input }) => {
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
    .query(async ({ input }) => {
      return await getLatestCheckIn(input.employeeId);
    }),
  requestFloat: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        providerId: z.number(),
        amount: z.number(),
        workerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createFloatRequest(input);
    }),
  myFloatRequests: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await getEmployeeFloatRequests(input.employeeId);
    }),
  listFloatRequests: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ input }) => {
      return await getAllFloatRequests(input.status);
    }),
  processRequest: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["approved", "declined", "transferred"]),
        adminNotes: z.string().optional(),
        transactionReference: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, status, ...rest } = input;
      
      // PERMISSION WALL: Only Admin can transfer cold cash
      if (status === "transferred" && ctx.user.role !== "admin") {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "EXECUTIVE PERMISSION REQUIRED: Supervisors may only Verify/Decline requests." 
        });
      }

      // Supervisor 'Approval' is now essentially 'Verification'
      const finalStatus = (status === "approved" && ctx.user.role === "supervisor") 
        ? "verified" 
        : status;

      return await processFloatRequest(id, { ...rest, status: finalStatus });
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
    .mutation(async ({ input }) => {
      return await createBalanceSnapshot(input);
    }),
  getLatestSnapshot: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await getLatestBalanceSnapshot(input.employeeId);
    }),
});
