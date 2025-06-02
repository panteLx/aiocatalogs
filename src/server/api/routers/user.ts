import { z } from "zod";
import { eq } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { userConfigs } from "@/server/db/schema";

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(userConfigs).values({
        userId: input.userId,
      });
      return { success: true };
    }),

  exists: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db
        .select({ id: userConfigs.id })
        .from(userConfigs)
        .where(eq(userConfigs.userId, input.userId))
        .get();
      return !!user;
    }),
});
