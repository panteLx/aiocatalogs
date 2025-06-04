import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { catalogs, userConfigs } from "@/server/db/schema";
import packageJson from "../../../../package.json";

interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo?: string;
  background?: string;
  resources: string[];
  types: string[];
  idPrefixes?: string[];
  behaviorHints?: {
    configurable?: boolean;
    configurationRequired?: boolean;
  };
  catalogs: Array<{
    type: string;
    id: string;
    name: string;
    genres?: string[];
    extra?: Array<{
      name: string;
      isRequired?: boolean;
      options?: string[];
      optionsLimit?: number;
    }>;
    extraSupported?: string[];
  }>;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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
      // Create user not found catalog manifest
      const unifiedManifest: StremioManifest = {
        id: `${packageJson.name}-${userId}-user-not-found`,
        version: packageJson.version,
        name: `AIOCatalogs - User Not Found`,
        description:
          "User not found. Please visit https://aio.pantelx.com to create an account. If you need help, join our Discord: https://discord.com/invite/Ma4SnagqwE",
        logo: "https://i.imgur.com/zi0Q5da.png",
        background: "https://i.imgur.com/QPPXf5T.jpeg",
        resources: [],
        types: [],
        idPrefixes: [],
        catalogs: [],
        behaviorHints: {
          configurable: true,
          configurationRequired: true,
        },
      };
      return NextResponse.json(unifiedManifest, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Get all active catalogs for this user
    const activeCatalogs = await database
      .select()
      .from(catalogs)
      .where(and(eq(catalogs.userId, userId), eq(catalogs.status, "active")))
      .orderBy(catalogs.order);

    if (activeCatalogs.length === 0) {
      // Create no active catalog manifest
      const unifiedManifest: StremioManifest = {
        id: `${packageJson.name}-${userId}-no-catalogs`,
        version: packageJson.version,
        name: `AIOCatalogs - No Active Catalogs`,
        description:
          "You have no active catalogs. Please visit https://aio.pantelx.com to add some or active them. If you need help, join our Discord: https://discord.com/invite/Ma4SnagqwE",
        logo: "https://i.imgur.com/zi0Q5da.png",
        background: "https://i.imgur.com/QPPXf5T.jpeg",
        resources: [],
        types: [],
        idPrefixes: [],
        catalogs: [],
        behaviorHints: {
          configurable: true,
          configurationRequired: true,
        },
      };

      return NextResponse.json(unifiedManifest, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Combine all catalogs into one unified manifest
    const combinedCatalogs: StremioManifest["catalogs"] = [];
    const allTypes = new Set<string>();
    const allIdPrefixes = new Set<string>();

    for (const catalog of activeCatalogs) {
      const manifest = catalog.originalManifest as StremioManifest;

      // Add types and idPrefixes to our sets
      manifest.types.forEach((type) => allTypes.add(type));
      manifest.idPrefixes?.forEach((prefix) => allIdPrefixes.add(prefix));

      // Process each catalog from the manifest
      if (manifest.catalogs) {
        for (const catalogDef of manifest.catalogs) {
          // Create a unique ID by prefixing with the original manifest ID
          const uniqueCatalogId = `${manifest.id}-${catalogDef.id}`;

          let catalogToAdd = {
            ...catalogDef,
            id: uniqueCatalogId,
            name: `${catalog.name}`,
          };

          // Apply randomization if enabled for this catalog
          if (catalog.randomized && catalogDef.genres) {
            catalogToAdd = {
              ...catalogToAdd,
              genres: shuffleArray(catalogDef.genres),
            };
          }

          combinedCatalogs.push(catalogToAdd);
        }
      }
    }

    // Create unified manifest
    const unifiedManifest: StremioManifest = {
      id: `${packageJson.name}-${userId}`,
      version: packageJson.version,
      name: "AIOCatalogs",
      description: packageJson.description,
      logo: "https://i.imgur.com/zi0Q5da.png",
      background: "https://i.imgur.com/QPPXf5T.jpeg",
      resources: ["catalog"],
      types: Array.from(allTypes),
      idPrefixes: Array.from(allIdPrefixes),
      catalogs: combinedCatalogs,
      behaviorHints: {
        configurable: true,
        configurationRequired: false,
      },
    };

    return NextResponse.json(unifiedManifest, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error generating manifest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
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
