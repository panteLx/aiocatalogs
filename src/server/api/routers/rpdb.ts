import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { apiKeys } from "@/server/db/schema";

// RPDB API validation function
async function validateRPDBApiKey(apiKey: string): Promise<void> {
  // Test RPDB API endpoint - using a simple API call to validate the key
  const response = await fetch(
    `https://api.ratingposterdb.com/${apiKey}/isValid`,
    {
      headers: {
        "User-Agent": "aiocatalogs-v2/1.0",
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid RPDB API key",
      });
    }
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `RPDB API validation failed: ${response.status} ${response.statusText}`,
    });
  }

  const data = await response.json();
  if (!data || typeof data !== "object") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid response from RPDB API",
    });
  }
}

// Error handler for RPDB operations
function handleRPDBError(error: unknown, defaultMessage: string): never {
  if (error instanceof TRPCError) {
    throw error;
  }

  console.error("RPDB API Error:", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: defaultMessage,
    cause: error,
  });
}

export const rpdbRouter = createTRPCRouter({
  // Validate RPDB API key
  validateApiKey: publicProcedure
    .input(z.object({ apiKey: z.string().min(1, "API key is required") }))
    .mutation(async ({ input }) => {
      try {
        await validateRPDBApiKey(input.apiKey);
        return { valid: true, message: "API key is valid" };
      } catch (error) {
        handleRPDBError(error, "Failed to validate RPDB API key");
      }
    }),

  // Save RPDB API key to database
  saveApiKey: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID is required"),
        apiKey: z.string().min(1, "API key is required"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Validate the API key first
        await validateRPDBApiKey(input.apiKey);

        const database = await db();
        const existingKey = await database
          .select()
          .from(apiKeys)
          .where(
            and(
              eq(apiKeys.userId, input.userId),
              eq(apiKeys.service, "rpdb"),
              eq(apiKeys.keyName, "api_key"),
            ),
          )
          .limit(1);

        const isNewKey = existingKey.length === 0;

        if (existingKey.length > 0) {
          // Update existing key
          await database
            .update(apiKeys)
            .set({
              keyValue: input.apiKey,
              isActive: true,
              updatedAt: sql`(unixepoch())`,
            })
            .where(eq(apiKeys.id, existingKey[0]!.id));
        } else {
          // Insert new key
          await database.insert(apiKeys).values({
            userId: input.userId,
            service: "rpdb",
            keyName: "api_key",
            keyValue: input.apiKey,
            isActive: true,
          });
        }

        return {
          success: true,
          message: "RPDB API key saved successfully",
          isNewKey,
        };
      } catch (error) {
        handleRPDBError(error, "Failed to save RPDB API key");
      }
    }),

  // Get saved RPDB API key from database
  getApiKey: publicProcedure
    .input(z.object({ userId: z.string().min(1, "User ID is required") }))
    .query(async ({ input }) => {
      try {
        const database = await db();
        const apiKey = await database
          .select()
          .from(apiKeys)
          .where(
            and(
              eq(apiKeys.userId, input.userId),
              eq(apiKeys.service, "rpdb"),
              eq(apiKeys.keyName, "api_key"),
              eq(apiKeys.isActive, true),
            ),
          )
          .limit(1);

        return {
          hasApiKey: apiKey.length > 0,
          apiKey: apiKey.length > 0 ? apiKey[0]!.keyValue : null,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve RPDB API key",
          cause: error,
        });
      }
    }),
});
