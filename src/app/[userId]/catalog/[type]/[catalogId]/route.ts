import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { catalogs, userConfigs } from "@/server/db/schema";

interface CatalogResponse {
  metas: MetaItem[];
}

interface MetaItem {
  id: string;
  type: string;
  name: string;
  poster?: string;
  background?: string;
  logo?: string;
  description?: string;
  releaseInfo?: string;
  imdbRating?: string;
  director?: string[];
  cast?: string[];
  genres?: string[];
  sourceAddon?: string;
  [key: string]: unknown;
}

interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  resources: string[];
  types: string[];
  catalogs: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  idPrefixes?: string[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

async function fetchCatalogData(
  endpoint: string,
  type: string,
  catalogId: string,
): Promise<CatalogResponse> {
  try {
    // Ensure the endpoint is correctly formatted
    const baseUrl = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
    const url = `${baseUrl}/catalog/${type}/${catalogId}.json`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch catalog data: ${response.statusText}`);
      return { metas: [] };
    }

    const data: { metas?: MetaItem[] } = await response.json();
    return data && Array.isArray(data.metas)
      ? { metas: data.metas }
      : { metas: [] };
  } catch (error) {
    console.error("Error fetching catalog data:", error);
    return { metas: [] };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; type: string; catalogId: string } },
) {
  try {
    const { userId, type, catalogId } = params;

    if (!userId || !type || !catalogId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    }

    const database = await db();

    // Verify user exists
    const user = await database
      .select({ id: userConfigs.id })
      .from(userConfigs)
      .where(eq(userConfigs.userId, userId))
      .get();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    }

    // Get all active catalogs for this user
    const activeCatalogs = await database
      .select()
      .from(catalogs)
      .where(and(eq(catalogs.userId, userId), eq(catalogs.status, "active")))
      .orderBy(catalogs.order);

    if (activeCatalogs.length === 0) {
      return NextResponse.json(
        { metas: [] },
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    }

    // Parse the catalog ID to find the source catalog and inner catalog ID
    // The catalogId format is like "com.mdblist.latest-tv-shows-latest-tv-shows-series"
    // We need to find which catalog manifest this belongs to and extract the inner catalog ID

    let foundCatalog: (typeof activeCatalogs)[0] | null = null;
    let innerCatalogId: string | null = null;

    for (const catalog of activeCatalogs) {
      const manifest = catalog.originalManifest as StremioManifest;

      // Check if this catalog ID starts with the manifest ID
      if (catalogId.startsWith(manifest.id)) {
        // Extract the inner catalog ID by removing the manifest ID prefix and separating dash
        const suffix = catalogId.substring(manifest.id.length);
        if (suffix.startsWith("-")) {
          const potentialInnerCatalogId = suffix.substring(1);

          // Check if this inner catalog exists in the manifest's catalogs for this type
          const matchingInnerCatalog = manifest.catalogs?.find(
            (cat) =>
              cat.type === type && potentialInnerCatalogId.includes(cat.id),
          );

          if (matchingInnerCatalog) {
            foundCatalog = catalog;
            innerCatalogId = matchingInnerCatalog.id;
            break;
          }
        }
      }
    }

    if (!foundCatalog || !innerCatalogId) {
      console.log(
        `No matching catalog found for catalogId: ${catalogId}, type: ${type}`,
      );
      return NextResponse.json(
        { metas: [] },
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    }

    // Extract endpoint from the manifest URL (remove /manifest.json if present)
    let endpoint = foundCatalog.manifestUrl;
    if (endpoint.endsWith("/manifest.json")) {
      endpoint = endpoint.substring(
        0,
        endpoint.length - "/manifest.json".length,
      );
    }
    if (!endpoint.endsWith("/")) {
      endpoint += "/";
    }

    // Fetch catalog data from the external addon
    const catalogData = await fetchCatalogData(endpoint, type, innerCatalogId);
    let metas = catalogData.metas || [];

    // Add source addon information to each meta item
    if (Array.isArray(metas)) {
      metas.forEach((item: MetaItem) => {
        item.sourceAddon = foundCatalog.name;
      });

      // Apply randomization if enabled for this catalog
      if (foundCatalog.randomized && metas.length > 1) {
        try {
          metas = shuffleArray(metas);
        } catch (error) {
          console.error("Error randomizing catalog items:", error);
        }
      }
    }

    return NextResponse.json(
      { metas },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  } catch (error) {
    console.error("Error handling catalog request:", error);
    return NextResponse.json(
      { metas: [] },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
