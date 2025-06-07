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
        // Check if user already exists first
        const existingUser = await ctx.db
          .select({ id: userConfigs.id })
          .from(userConfigs)
          .where(eq(userConfigs.userId, input.userId))
          .get();

        if (existingUser) {
          // User already exists - this is actually fine, just return success
          console.log(
            `User ${input.userId} already exists - returning success`,
          );
          return { success: true, userId: input.userId, alreadyExists: true };
        }

        // Try to create the user
        await ctx.db.insert(userConfigs).values({
          userId: input.userId,
        });

        console.log(`Successfully created user ${input.userId}`);
        return { success: true, userId: input.userId, alreadyExists: false };
      } catch (error) {
        console.error(
          `Error in user.create for userId ${input.userId}:`,
          error,
        );

        // Check if it's a unique constraint violation (user was created by another request)
        if (error && typeof error === "object" && "message" in error) {
          const errorMessage = String(error.message).toLowerCase();
          if (
            errorMessage.includes("unique") ||
            errorMessage.includes("constraint")
          ) {
            // This means the user was created by another concurrent request
            console.log(
              `User ${input.userId} was created by concurrent request - returning success`,
            );
            return { success: true, userId: input.userId, alreadyExists: true };
          }
        }

        // If it's a TRPCError, preserve it
        if (error instanceof TRPCError) {
          throw error;
        }

        // For any other error, throw a generic server error
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
