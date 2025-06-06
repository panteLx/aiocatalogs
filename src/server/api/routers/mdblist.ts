import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { apiKeys, catalogs } from "@/server/db/schema";
import packageJson from "../../../../package.json";
import { env } from "@/env";
import {
  isMDBListManifestUrl,
  replaceMDBListApiKey,
} from "@/lib/utils/mdblist-utils";

// MDBList API types - Updated for new flat array response format
const MDBListItem = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  items: z.number(),
  likes: z.number().nullable().default(0),
  created: z.string().optional(),
  modified: z.string().optional(),
  mediatype: z.string().optional(),
  user_id: z.number(),
  user_name: z.string(),
  private: z.boolean().optional(),
  dynamic: z.boolean().optional(),
  privacy: z.string().optional(),
});

const MDBListApiResponse = z.array(MDBListItem);

interface MDBListCatalog {
  id: number;
  name: string;
  description: string;
  manifestUrl: string;
  types: string[];
  likes: number;
  source: string;
  listType: "toplist" | "userlist";
  username: string;
  listSlug?: string;
  items: number;
}

// Common constants and utilities
const MDBLIST_BASE_URL = "https://api.mdblist.com";
const USER_AGENT = `${packageJson.name}/${packageJson.version}`;
const MANIFEST_BASE_URL = env.MDBLIST_MANIFEST_URL;

// Helper function to update all MDBList catalog manifest URLs for a user
async function updateUserMDBListCatalogUrls(
  database: Awaited<ReturnType<typeof db>>,
  userId: string,
  newApiKey: string,
): Promise<number> {
  // Get all catalogs for this user that have MDBList manifest URLs
  const userCatalogs = await database
    .select()
    .from(catalogs)
    .where(eq(catalogs.userId, userId));

  let updatedCount = 0;

  for (const catalog of userCatalogs) {
    if (isMDBListManifestUrl(catalog.manifestUrl)) {
      const newManifestUrl = replaceMDBListApiKey(
        catalog.manifestUrl,
        newApiKey,
      );

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

// Helper functions
async function getApiKeyForUser(
  userId?: string,
  providedApiKey?: string,
): Promise<string> {
  if (providedApiKey) return providedApiKey;

  if (!userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "API key is required",
    });
  }

  const database = await db();
  const savedApiKey = await database
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.service, "mdblist"),
        eq(apiKeys.keyName, "api_key"),
        eq(apiKeys.isActive, true),
      ),
    )
    .limit(1);

  if (savedApiKey.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "API key is required",
    });
  }

  return savedApiKey[0]!.keyValue;
}

async function validateMDBListApiKey(apiKey: string): Promise<void> {
  const response = await fetch(`${MDBLIST_BASE_URL}/user?apikey=${apiKey}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `API validation failed: ${response.status} ${response.statusText}`,
    });
  }

  const data = await response.json();
  if (!data || typeof data !== "object") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid response from MDBList API",
    });
  }
}

async function fetchMDBListData(
  url: string,
): Promise<z.infer<typeof MDBListApiResponse>> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Request failed: ${response.status} ${response.statusText}`,
    });
  }

  const data = await response.json();
  return MDBListApiResponse.parse(data);
}

// Function to transform MDBList data to catalog format
async function transformToMDBListCatalog(
  list: z.infer<typeof MDBListItem>,
  apiKey: string,
  listType: "toplist" | "userlist",
): Promise<MDBListCatalog> {
  const manifestUrl = `${MANIFEST_BASE_URL}/${list.id}/${apiKey}/manifest.json`;

  return {
    id: list.id,
    name: list.name,
    description: list.description ?? "No description available",
    manifestUrl,
    types: list.mediatype ? [list.mediatype] : ["movie", "series"],
    likes: list.likes ?? 0,
    source: "MDBList",
    listType,
    username: list.user_name,
    listSlug: list.slug,
    items: list.items,
  };
}

function handleMDBListError(error: unknown, defaultMessage: string): never {
  if (error instanceof TRPCError) {
    throw error;
  }
  if (error instanceof z.ZodError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid response format from MDBList API: ${error.message}`,
      cause: error,
    });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: defaultMessage,
    cause: error,
  });
}

export const mdblistRouter = createTRPCRouter({
  // Validate API key
  validateApiKey: publicProcedure
    .input(z.object({ apiKey: z.string().min(1, "API key is required") }))
    .query(async ({ input }) => {
      try {
        await validateMDBListApiKey(input.apiKey);
        return { valid: true, message: "API key is valid" };
      } catch (error) {
        handleMDBListError(error, "Failed to validate API key");
      }
    }),

  // Get MDBList toplists for browsing
  getTopLists: publicProcedure
    .input(
      z.object({
        apiKey: z.string().optional(),
        userId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const apiKey = await getApiKeyForUser(input.userId, input.apiKey);
        const url = `${MDBLIST_BASE_URL}/lists/top?apikey=${apiKey}&limit=${input.limit}&skip=${input.offset}`;
        const parsedData = await fetchMDBListData(url);

        // Transform data to catalog format
        const catalogs = await Promise.all(
          parsedData.map((list) =>
            transformToMDBListCatalog(list, apiKey, "toplist"),
          ),
        );

        return {
          catalogs,
          total: parsedData.length,
          hasMore: false,
        };
      } catch (error) {
        handleMDBListError(error, "Failed to fetch toplists");
      }
    }),

  // Search MDBList catalogs
  searchLists: publicProcedure
    .input(
      z.object({
        apiKey: z.string().optional(),
        userId: z.string().optional(),
        query: z.string().min(1, "Search query is required"),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const apiKey = await getApiKeyForUser(input.userId, input.apiKey);
        const url = `${MDBLIST_BASE_URL}/lists/search?query=${encodeURIComponent(input.query)}&apikey=${apiKey}`;
        const parsedData = await fetchMDBListData(url);

        // Transform data to catalog format
        const catalogs = await Promise.all(
          parsedData.map((list) =>
            transformToMDBListCatalog(list, apiKey, "userlist"),
          ),
        );

        const sortedCatalogs = catalogs.sort((a, b) => b.likes - a.likes);

        // Apply client-side pagination
        const startIndex = input.offset;
        const endIndex = startIndex + input.limit;
        const paginatedCatalogs = sortedCatalogs.slice(startIndex, endIndex);

        return {
          catalogs: paginatedCatalogs,
          total: sortedCatalogs.length,
          hasMore: endIndex < sortedCatalogs.length,
        };
      } catch (error) {
        handleMDBListError(error, "Failed to search lists");
      }
    }),

  // Save API key to database
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
        await validateMDBListApiKey(input.apiKey);

        const database = await db();
        const existingKey = await database
          .select()
          .from(apiKeys)
          .where(
            and(
              eq(apiKeys.userId, input.userId),
              eq(apiKeys.service, "mdblist"),
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
            service: "mdblist",
            keyName: "api_key",
            keyValue: input.apiKey,
            isActive: true,
          });
        }

        // Update manifest URLs for existing catalogs
        const updatedCount = await updateUserMDBListCatalogUrls(
          database,
          input.userId,
          input.apiKey,
        );

        return {
          success: true,
          message: "API key saved successfully",
          isNewKey,
          updatedManifestUrls: updatedCount,
        };
      } catch (error) {
        handleMDBListError(error, "Failed to save API key");
      }
    }),

  // Get saved API key from database
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
              eq(apiKeys.service, "mdblist"),
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
          message: "Failed to retrieve API key",
          cause: error,
        });
      }
    }),
});
