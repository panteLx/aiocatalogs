import { z } from "zod";
import { eq, asc, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { catalogs, userConfigs } from "@/server/db/schema";
import { invalidateCacheOnCatalogChange } from "@/lib/utils/cache-utils";

// Zod schema for Stremio manifest validation
const catalogSchema = z.object({
  type: z.string(),
  id: z.string(),
  name: z.string(),
  genres: z.array(z.string()).optional(),
  extra: z.array(z.any()).optional(),
  extraSupported: z.array(z.string()).optional(),
});

const manifestSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string().optional(),
  resources: z.array(z.string()),
  types: z.array(z.string()),
  idPrefixes: z.array(z.string()).optional(),
  catalogs: z.array(catalogSchema).optional(),
});

export const catalogRouter = createTRPCRouter({
  // Fetch manifest from URL and validate it
  fetchManifest: publicProcedure
    .input(
      z.object({
        url: z.string().url("Invalid URL format"),
      }),
    )
    .query(async ({ input }) => {
      try {
        const response = await fetch(input.url);

        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Failed to fetch manifest: ${response.status} ${response.statusText}`,
          });
        }

        const data = await response.json();

        // Validate the manifest structure
        const validatedManifest = manifestSchema.parse(data);

        return {
          manifest: validatedManifest,
          isValid: true,
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid manifest structure",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch or validate manifest",
          cause: error,
        });
      }
    }),

  // Add a new catalog for a user
  add: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID required"),
        manifestUrl: z.string().url("Invalid URL format"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify user exists
        const user = await ctx.db
          .select({ id: userConfigs.id })
          .from(userConfigs)
          .where(eq(userConfigs.userId, input.userId))
          .get();

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Fetch and validate manifest
        const response = await fetch(input.manifestUrl);

        if (!response.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Failed to fetch manifest: ${response.status} ${response.statusText}`,
          });
        }

        const manifestData = await response.json();

        // Validate the manifest structure
        const validatedManifest = manifestSchema.parse(manifestData);

        // Check if this is actually a catalog addon (has catalog resources)
        if (!validatedManifest.resources.includes("catalog")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This addon doesn't provide catalog resources",
          });
        }

        // Check if catalog already exists for this user
        const existingCatalog = await ctx.db
          .select({ id: catalogs.id })
          .from(catalogs)
          .where(
            and(
              eq(catalogs.userId, input.userId),
              eq(catalogs.manifestUrl, input.manifestUrl),
            ),
          )
          .get();

        if (existingCatalog) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This catalog is already added",
          });
        }

        // Get the current max order for this user
        const maxOrderResult = await ctx.db
          .select({ maxOrder: catalogs.order })
          .from(catalogs)
          .where(eq(catalogs.userId, input.userId))
          .orderBy(desc(catalogs.order))
          .limit(1)
          .get();

        const nextOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

        // Insert new catalog
        const [newCatalog] = await ctx.db
          .insert(catalogs)
          .values({
            userId: input.userId,
            manifestUrl: input.manifestUrl,
            name: validatedManifest.name,
            description: validatedManifest.description,
            originalManifest: validatedManifest,
            order: nextOrder,
          })
          .returning();

        // Invalidate MDBList cache when a new catalog is added
        invalidateCacheOnCatalogChange();

        return {
          success: true,
          catalog: newCatalog,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid manifest structure",
            cause: error,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add catalog",
          cause: error,
        });
      }
    }),

  // Get all catalogs for a user
  list: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID required"),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userCatalogs = await ctx.db
          .select()
          .from(catalogs)
          .where(eq(catalogs.userId, input.userId))
          .orderBy(asc(catalogs.order));

        return userCatalogs;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch catalogs",
          cause: error,
        });
      }
    }),

  // Update catalog (name, status, randomized, rpdbEnabled)
  update: publicProcedure
    .input(
      z.object({
        catalogId: z.number(),
        userId: z.string().min(1, "User ID required"),
        name: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        randomized: z.boolean().optional(),
        rpdbEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the catalog belongs to the user
        const catalog = await ctx.db
          .select({ id: catalogs.id })
          .from(catalogs)
          .where(
            and(
              eq(catalogs.id, input.catalogId),
              eq(catalogs.userId, input.userId),
            ),
          )
          .get();

        if (!catalog) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Catalog not found or unauthorized",
          });
        }

        // Build update object
        const updateData: {
          updatedAt: Date;
          name?: string;
          status?: "active" | "inactive";
          randomized?: boolean;
          rpdbEnabled?: boolean;
        } = {
          updatedAt: new Date(),
        };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.randomized !== undefined)
          updateData.randomized = input.randomized;
        if (input.rpdbEnabled !== undefined)
          updateData.rpdbEnabled = input.rpdbEnabled;

        const [updatedCatalog] = await ctx.db
          .update(catalogs)
          .set(updateData)
          .where(eq(catalogs.id, input.catalogId))
          .returning();

        // If rpdbEnabled was changed, update only this catalog's manifest URL
        if (input.rpdbEnabled !== undefined) {
          // Import the helper functions
          const { updateSingleCatalogManifestUrlWithRPDB } = await import(
            "./rpdb"
          );

          // Get the user's RPDB API key
          const { apiKeys } = await import("@/server/db/schema");
          const rpdbApiKeyResult = await ctx.db
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
            rpdbApiKeyResult.length > 0 ? rpdbApiKeyResult[0]!.keyValue : null;

          // Update only this specific catalog's manifest URL
          await updateSingleCatalogManifestUrlWithRPDB(
            ctx.db,
            input.catalogId,
            rpdbApiKey,
            input.rpdbEnabled,
          );
        }

        // Invalidate MDBList cache when catalog is updated
        invalidateCacheOnCatalogChange();

        return {
          success: true,
          catalog: updatedCatalog,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update catalog",
          cause: error,
        });
      }
    }),

  // Update catalog order (for drag & drop)
  reorder: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID required"),
        catalogIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify all catalogs belong to the user
        const userCatalogs = await ctx.db
          .select({ id: catalogs.id })
          .from(catalogs)
          .where(eq(catalogs.userId, input.userId));

        const userCatalogIds = userCatalogs.map((c) => c.id);
        const invalidIds = input.catalogIds.filter(
          (id) => !userCatalogIds.includes(id),
        );

        if (invalidIds.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some catalogs don't belong to this user",
          });
        }

        // Update order for all catalogs
        await Promise.all(
          input.catalogIds.map((catalogId, index) =>
            ctx.db
              .update(catalogs)
              .set({ order: index, updatedAt: new Date() })
              .where(eq(catalogs.id, catalogId)),
          ),
        );

        // Invalidate MDBList cache when catalogs are reordered
        invalidateCacheOnCatalogChange();

        return {
          success: true,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reorder catalogs",
          cause: error,
        });
      }
    }),

  // Remove catalog
  remove: publicProcedure
    .input(
      z.object({
        catalogId: z.number(),
        userId: z.string().min(1, "User ID required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the catalog belongs to the user
        const catalog = await ctx.db
          .select({ id: catalogs.id })
          .from(catalogs)
          .where(
            and(
              eq(catalogs.id, input.catalogId),
              eq(catalogs.userId, input.userId),
            ),
          )
          .get();

        if (!catalog) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Catalog not found or unauthorized",
          });
        }

        await ctx.db.delete(catalogs).where(eq(catalogs.id, input.catalogId));

        // Invalidate MDBList cache when a catalog is removed
        invalidateCacheOnCatalogChange();

        return {
          success: true,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove catalog",
          cause: error,
        });
      }
    }),

  // Get active catalogs for manifest generation
  getActiveCatalogs: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID required"),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const activeCatalogs = await ctx.db
          .select()
          .from(catalogs)
          .where(
            and(
              eq(catalogs.userId, input.userId),
              eq(catalogs.status, "active"),
            ),
          )
          .orderBy(asc(catalogs.order));

        return activeCatalogs;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch active catalogs",
          cause: error,
        });
      }
    }),
});
