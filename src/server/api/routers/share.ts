import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { catalogs, sharedCatalogs, userConfigs } from "@/server/db/schema";

export const shareRouter = createTRPCRouter({
  // Create a shareable link for selected catalogs
  create: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID required"),
        catalogIds: z.array(z.number()).min(1, "At least one catalog required"),
        name: z.string().min(1, "Share name required"),
        description: z.string().default(""),
        expiresInDays: z.number().min(1).max(365).optional(),
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

        // Verify all catalogs belong to this user
        const userCatalogs = await ctx.db
          .select({ id: catalogs.id })
          .from(catalogs)
          .where(
            and(
              eq(catalogs.userId, input.userId),
              inArray(catalogs.id, input.catalogIds),
            ),
          );

        if (userCatalogs.length !== input.catalogIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some catalogs don't belong to this user",
          });
        }

        // Generate unique share ID
        const shareId = nanoid(12);

        // Calculate expiration date if provided
        let expiresAt: Date | null = null;
        if (input.expiresInDays) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
        }

        // Create shared catalog entry
        const [sharedCatalog] = await ctx.db
          .insert(sharedCatalogs)
          .values({
            shareId,
            sharedByUserId: input.userId,
            catalogIds: input.catalogIds,
            name: input.name,
            description: input.description,
            expiresAt: expiresAt,
          })
          .returning();

        return {
          success: true,
          shareId,
          shareUrl:
            typeof window !== "undefined"
              ? `${window.location.origin}/share/${shareId}`
              : `/share/${shareId}`,
          sharedCatalog,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create share",
          cause: error,
        });
      }
    }),

  // Get shared catalog information by share ID
  get: publicProcedure
    .input(
      z.object({
        shareId: z.string().min(1, "Share ID required"),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const sharedCatalog = await ctx.db
          .select()
          .from(sharedCatalogs)
          .where(eq(sharedCatalogs.shareId, input.shareId))
          .get();

        if (!sharedCatalog) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shared catalog not found",
          });
        }

        // Check if share is active
        if (!sharedCatalog.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This share is no longer active",
          });
        }

        // Check if share has expired
        if (
          sharedCatalog.expiresAt &&
          sharedCatalog.expiresAt.getTime() < Date.now()
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This share has expired",
          });
        }

        // Get the actual catalog data (but remove sensitive information)
        const catalogIds = sharedCatalog.catalogIds as number[];
        const sharedCatalogDetails = await ctx.db
          .select({
            id: catalogs.id,
            manifestUrl: catalogs.manifestUrl,
            name: catalogs.name,
            description: catalogs.description,
            originalManifest: catalogs.originalManifest,
            status: catalogs.status,
            randomized: catalogs.randomized,
          })
          .from(catalogs)
          .where(inArray(catalogs.id, catalogIds));

        return {
          shareInfo: {
            shareId: sharedCatalog.shareId,
            name: sharedCatalog.name,
            description: sharedCatalog.description,
            createdAt: sharedCatalog.createdAt,
            expiresAt: sharedCatalog.expiresAt,
          },
          catalogs: sharedCatalogDetails,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch shared catalog",
          cause: error,
        });
      }
    }),

  // Import shared catalogs to user's collection
  import: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID required"),
        shareId: z.string().min(1, "Share ID required"),
        selectedCatalogIds: z.array(z.number()).optional(), // Allow importing only selected catalogs
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

        // Get shared catalog info
        const sharedCatalog = await ctx.db
          .select()
          .from(sharedCatalogs)
          .where(eq(sharedCatalogs.shareId, input.shareId))
          .get();

        if (!sharedCatalog) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shared catalog not found",
          });
        }

        // Check if share is active and not expired
        if (!sharedCatalog.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This share is no longer active",
          });
        }

        if (
          sharedCatalog.expiresAt &&
          sharedCatalog.expiresAt.getTime() < Date.now()
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This share has expired",
          });
        }

        // Determine which catalogs to import
        const catalogIds = sharedCatalog.catalogIds as number[];
        const catalogsToImport = input.selectedCatalogIds
          ? catalogIds.filter((id) => input.selectedCatalogIds!.includes(id))
          : catalogIds;

        if (catalogsToImport.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No catalogs selected for import",
          });
        }

        // Get catalog details
        const catalogDetails = await ctx.db
          .select()
          .from(catalogs)
          .where(inArray(catalogs.id, catalogsToImport));

        // Check for existing catalogs with same manifest URLs
        const existingCatalogs = await ctx.db
          .select({ manifestUrl: catalogs.manifestUrl })
          .from(catalogs)
          .where(
            and(
              eq(catalogs.userId, input.userId),
              inArray(
                catalogs.manifestUrl,
                catalogDetails.map((c) => c.manifestUrl),
              ),
            ),
          );

        const existingUrls = new Set(
          existingCatalogs.map((c) => c.manifestUrl),
        );

        // Filter out catalogs that already exist
        const newCatalogs = catalogDetails.filter(
          (catalog) => !existingUrls.has(catalog.manifestUrl),
        );

        if (newCatalogs.length === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "All selected catalogs are already in your collection",
          });
        }

        // Get the current max order for this user
        const maxOrderResult = await ctx.db
          .select({ maxOrder: catalogs.order })
          .from(catalogs)
          .where(eq(catalogs.userId, input.userId))
          .orderBy(eq(catalogs.order, catalogs.order)) // DESC
          .limit(1)
          .get();

        let nextOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

        // Import catalogs
        const importedCatalogs = [];
        for (const catalog of newCatalogs) {
          const [importedCatalog] = await ctx.db
            .insert(catalogs)
            .values({
              userId: input.userId,
              manifestUrl: catalog.manifestUrl,
              name: catalog.name,
              description: catalog.description,
              originalManifest: catalog.originalManifest,
              status: "active", // Default to active
              randomized: false, // Reset randomization
              order: nextOrder++,
            })
            .returning();

          importedCatalogs.push(importedCatalog);
        }

        return {
          success: true,
          importedCount: importedCatalogs.length,
          skippedCount: catalogDetails.length - importedCatalogs.length,
          importedCatalogs,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to import catalogs",
          cause: error,
        });
      }
    }),

  // List shares created by a user
  listByUser: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID required"),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userShares = await ctx.db
          .select()
          .from(sharedCatalogs)
          .where(eq(sharedCatalogs.sharedByUserId, input.userId));

        return userShares;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user shares",
          cause: error,
        });
      }
    }),

  // Delete/deactivate a share
  delete: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID required"),
        shareId: z.string().min(1, "Share ID required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the share belongs to the user
        const share = await ctx.db
          .select({ id: sharedCatalogs.id })
          .from(sharedCatalogs)
          .where(
            and(
              eq(sharedCatalogs.shareId, input.shareId),
              eq(sharedCatalogs.sharedByUserId, input.userId),
            ),
          )
          .get();

        if (!share) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Share not found or unauthorized",
          });
        }

        // Deactivate the share instead of deleting it
        await ctx.db
          .update(sharedCatalogs)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(sharedCatalogs.shareId, input.shareId));

        return {
          success: true,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete share",
          cause: error,
        });
      }
    }),
});
