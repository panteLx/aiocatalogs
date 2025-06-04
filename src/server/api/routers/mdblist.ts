import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { apiKeys } from "@/server/db/schema";

// MDBList API types - Updated for new flat array response format
const MDBListItem = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(), // Can be null in the API response
  items: z.number(),
  likes: z.number().nullable().default(0), // Can be null in the API response
  created: z.string().optional(),
  modified: z.string().optional(),
  mediatype: z.string().optional(),
  user_id: z.number(),
  user_name: z.string(),
  private: z.boolean().optional(),
  dynamic: z.boolean().optional(),
  privacy: z.string().optional(), // For userlist compatibility
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
  items: number; // Optional, can be used for user lists
}

export const mdblistRouter = createTRPCRouter({
  // Validate API key
  validateApiKey: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1, "API key is required"),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Test API key with a simple request to MDBList
        const response = await fetch(
          `https://api.mdblist.com/user?apikey=${input.apiKey}`,
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
              message: "Invalid API key",
            });
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `API validation failed: ${response.status} ${response.statusText}`,
          });
        }

        const data = await response.json();

        // Basic validation that we got expected data structure
        if (!data || typeof data !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid response from MDBList API",
          });
        }

        return {
          valid: true,
          message: "API key is valid",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate API key",
          cause: error,
        });
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
        let apiKey = input.apiKey;

        // If no API key provided but userId is available, try to get it from database
        if (!apiKey && input.userId) {
          const database = await db();
          const savedApiKey = await database
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

          if (savedApiKey.length > 0) {
            apiKey = savedApiKey[0]!.keyValue;
          }
        }

        if (!apiKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "API key is required",
          });
        }
        const response = await fetch(
          `https://api.mdblist.com/lists/top?apikey=${apiKey}&limit=${input.limit}&skip=${input.offset}`,
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
              message: "Invalid API key",
            });
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Failed to fetch toplists: ${response.status} ${response.statusText}`,
          });
        }

        const data = await response.json();
        const parsedData = MDBListApiResponse.parse(data);

        // Convert to our catalog format - parsedData is now directly an array
        const catalogs: MDBListCatalog[] = parsedData.map((list) => ({
          id: list.id,
          name: list.name,
          description: list.description ?? "No description available",
          manifestUrl: `stremio://1fe84bc728af-stremio-mdblist.baby-beamup.club/${list.id}/${apiKey}/manifest.json`,
          types: list.mediatype ? [list.mediatype] : ["movie", "series"], // Use list.mediatype or default to both
          likes: list.likes ?? 0,
          source: "MDBList",
          listType: "toplist",
          username: list.user_name,
          listSlug: list.slug,
          items: list.items,
        }));

        return {
          catalogs,
          total: parsedData.length, // Use array length since we don't have total_results anymore
          hasMore: false, // Since we get all results in one call, there's no pagination
        };
      } catch (error) {
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
          message: "Failed to fetch toplists",
          cause: error,
        });
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
        let apiKey = input.apiKey;

        // If no API key provided but userId is available, try to get it from database
        if (!apiKey && input.userId) {
          const database = await db();
          const savedApiKey = await database
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

          if (savedApiKey.length > 0) {
            apiKey = savedApiKey[0]!.keyValue;
          }
        }

        if (!apiKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "API key is required",
          });
        }

        // Use the lists search endpoint
        const response = await fetch(
          `https://api.mdblist.com/lists/search?query=${encodeURIComponent(input.query)}&apikey=${apiKey}`,
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
              message: "Invalid API key",
            });
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Search failed: ${response.status} ${response.statusText}`,
          });
        }

        const data = await response.json();
        const parsedData = MDBListApiResponse.parse(data);

        // Convert to our catalog format
        const catalogs: MDBListCatalog[] = parsedData.map((list) => ({
          id: list.id,
          name: list.name,
          description: list.description ?? "No description available",
          manifestUrl: `stremio://1fe84bc728af-stremio-mdblist.baby-beamup.club/${list.id}/${apiKey}/manifest.json`,
          types: list.mediatype ? [list.mediatype] : ["movie", "series"], // Use list.mediatype or default to both
          likes: list.likes ?? 0,
          source: "MDBList",
          listType: "userlist", // Search results are typically user lists
          username: list.user_name,
          listSlug: list.slug,
          items: list.items,
        }));

        // Sort by likes
        catalogs.sort((a, b) => b.likes - a.likes);

        // Apply client-side pagination since the API doesn't support limit/offset for search
        const startIndex = input.offset;
        const endIndex = startIndex + input.limit;
        const paginatedCatalogs = catalogs.slice(startIndex, endIndex);

        return {
          catalogs: paginatedCatalogs,
          total: catalogs.length,
          hasMore: endIndex < catalogs.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid response format from MDBList API during search: ${error.message}`,
            cause: error,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search lists",
          cause: error,
        });
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
        // First validate the API key
        const response = await fetch(
          `https://api.mdblist.com/user?apikey=${input.apiKey}`,
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
              message: "Invalid API key",
            });
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `API validation failed: ${response.status} ${response.statusText}`,
          });
        }

        // Save or update the API key in database
        const database = await db();

        // First check if an API key already exists for this user
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

        return {
          success: true,
          message: "API key saved successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save API key",
          cause: error,
        });
      }
    }),

  // Get saved API key from database
  getApiKey: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID is required"),
      }),
    )
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

        if (apiKey.length === 0) {
          return {
            hasApiKey: false,
            apiKey: null,
          };
        }

        return {
          hasApiKey: true,
          apiKey: apiKey[0]!.keyValue,
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
