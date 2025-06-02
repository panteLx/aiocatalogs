import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { userConfigs } from "@/server/db/schema";

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ userId: z.string().min(1, "User ID cannot be empty") }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user already exists
        const existingUser = await ctx.db
          .select({ id: userConfigs.id })
          .from(userConfigs)
          .where(eq(userConfigs.userId, input.userId))
          .get();

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User ID already exists",
          });
        }

        await ctx.db.insert(userConfigs).values({
          userId: input.userId,
        });

        return { success: true, userId: input.userId };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
          cause: error,
        });
      }
    }),

  exists: publicProcedure
    .input(z.object({ userId: z.string().min(1, "User ID cannot be empty") }))
    .query(async ({ ctx, input }) => {
      try {
        const user = await ctx.db
          .select({ id: userConfigs.id })
          .from(userConfigs)
          .where(eq(userConfigs.userId, input.userId))
          .get();

        return !!user;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check user existence",
          cause: error,
        });
      }
    }),
});
