import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { apiKeys, catalogs } from "@/server/db/schema";
import packageJson from "../../../../package.json";
import { isMDBListManifestUrl } from "@/lib/mdblist-utils";

// Helper function to update MDBList manifest URLs with RPDB API key
function updateMDBListManifestUrlWithRPDB(
  manifestUrl: string,
  rpdbApiKey: string,
): string {
  // Expected format: https://1fe84bc728af-stremio-mdblist.baby-beamup.club/116/<mdblist_apikey>/manifest.json
  // Target format: https://1fe84bc728af-stremio-mdblist.baby-beamup.club/116/<mdblist_apikey>/<rpdb_apikey>/manifest.json

  // First, always remove any existing RPDB keys to prevent duplication
  const cleanUrl = removeMDBListManifestUrlRPDB(manifestUrl);

  const urlParts = cleanUrl.split("/");
  const manifestIndex = urlParts.findIndex((part) => part === "manifest.json");

  if (manifestIndex === -1) return manifestUrl;

  // Add RPDB key before manifest.json
  urlParts.splice(manifestIndex, 0, rpdbApiKey);

  return urlParts.join("/");
}

// Helper function to remove RPDB API key from MDBList manifest URL
function removeMDBListManifestUrlRPDB(manifestUrl: string): string {
  // Remove RPDB key from format: https://1fe84bc728af-stremio-mdblist.baby-beamup.club/116/<mdblist_apikey>/<rpdb_apikey>/manifest.json
  // To format: https://1fe84bc728af-stremio-mdblist.baby-beamup.club/116/<mdblist_apikey>/manifest.json
  // Also handles multiple RPDB keys that might have been accidentally added

  const urlParts = manifestUrl.split("/");
  const manifestIndex = urlParts.findIndex((part) => part === "manifest.json");

  if (manifestIndex === -1) return manifestUrl;

  // Expected URL structure: [protocol, "", host, listId, mdblistKey, manifest.json]
  const expectedParts = 6;

  // If we have more than expected parts, remove all extra parts before manifest.json
  // This handles cases where RPDB keys were added multiple times
  while (urlParts.length > expectedParts && manifestIndex > 4) {
    urlParts.splice(manifestIndex - 1, 1);
    // Update manifestIndex since we removed a part
    const newManifestIndex = urlParts.findIndex(
      (part) => part === "manifest.json",
    );
    if (newManifestIndex === -1) break;
  }

  return urlParts.join("/");
}

// Helper function to update all MDBList catalog manifest URLs for a user
export async function updateUserMDBListCatalogUrlsWithRPDB(
  database: Awaited<ReturnType<typeof db>>,
  userId: string,
  rpdbApiKey: string | null,
): Promise<number> {
  // Get all catalogs for this user that have MDBList manifest URLs
  const userCatalogs = await database
    .select()
    .from(catalogs)
    .where(eq(catalogs.userId, userId));

  let updatedCount = 0;

  for (const catalog of userCatalogs) {
    if (isMDBListManifestUrl(catalog.manifestUrl)) {
      const newManifestUrl =
        catalog.rpdbEnabled && rpdbApiKey
          ? updateMDBListManifestUrlWithRPDB(catalog.manifestUrl, rpdbApiKey)
          : removeMDBListManifestUrlRPDB(catalog.manifestUrl);

      // Only update if the URL actually changed
      if (newManifestUrl !== catalog.manifestUrl) {
        await database
          .update(catalogs)
          .set({
            manifestUrl: newManifestUrl,
            updatedAt: sql`(unixepoch())`,
          })
          .where(eq(catalogs.id, catalog.id));

        updatedCount++;
      }
    }
  }

  return updatedCount;
}

// RPDB API validation function
async function validateRPDBApiKey(apiKey: string): Promise<void> {
  // Test RPDB API endpoint - using a simple API call to validate the key
  const response = await fetch(
    `https://api.ratingposterdb.com/${apiKey}/isValid`,
    {
      headers: {
        "User-Agent": `${packageJson.name}/${packageJson.version}`,
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

// Helper function to update a single catalog's manifest URL with RPDB
export async function updateSingleCatalogManifestUrlWithRPDB(
  database: Awaited<ReturnType<typeof db>>,
  catalogId: number,
  rpdbApiKey: string | null,
  rpdbEnabled: boolean,
): Promise<boolean> {
  // Get the specific catalog
  const catalog = await database
    .select()
    .from(catalogs)
    .where(eq(catalogs.id, catalogId))
    .limit(1);

  if (catalog.length === 0 || !isMDBListManifestUrl(catalog[0]!.manifestUrl)) {
    return false;
  }

  const catalogData = catalog[0]!;
  let newManifestUrl: string;

  // Only add RPDB key if catalog has RPDB enabled AND we have an API key
  if (rpdbEnabled && rpdbApiKey) {
    // Add or update RPDB key in the URL
    newManifestUrl = updateMDBListManifestUrlWithRPDB(
      catalogData.manifestUrl,
      rpdbApiKey,
    );
  } else {
    // Remove RPDB key from the URL (either RPDB disabled or no API key)
    newManifestUrl = removeMDBListManifestUrlRPDB(catalogData.manifestUrl);
  }

  // Only update if the URL actually changed
  if (newManifestUrl !== catalogData.manifestUrl) {
    await database
      .update(catalogs)
      .set({
        manifestUrl: newManifestUrl,
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(catalogs.id, catalogId));

    return true;
  }

  return false;
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

        // Update manifest URLs for catalogs with RPDB enabled
        const updatedCount = await updateUserMDBListCatalogUrlsWithRPDB(
          database,
          input.userId,
          input.apiKey,
        );

        return {
          success: true,
          message: "RPDB API key saved successfully",
          isNewKey,
          updatedManifestUrls: updatedCount,
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

  // Update manifest URLs for catalogs with RPDB enabled
  updateManifestUrls: publicProcedure
    .input(z.object({ userId: z.string().min(1, "User ID is required") }))
    .mutation(async ({ input }) => {
      try {
        const database = await db();

        // Get the user's RPDB API key
        const apiKeyResult = await database
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

        const rpdbApiKey =
          apiKeyResult.length > 0 ? apiKeyResult[0]!.keyValue : null;

        // Update manifest URLs for catalogs with RPDB enabled
        const updatedCount = await updateUserMDBListCatalogUrlsWithRPDB(
          database,
          input.userId,
          rpdbApiKey,
        );

        return {
          success: true,
          message: `Updated ${updatedCount} catalog manifest URLs`,
          updatedCount,
          hasRpdbKey: !!rpdbApiKey,
        };
      } catch (error) {
        handleRPDBError(error, "Failed to update manifest URLs");
      }
    }),
});
