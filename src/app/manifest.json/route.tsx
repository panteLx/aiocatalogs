import { NextResponse } from "next/server";
import packageJson from "../../../package.json";

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

export async function GET(): Promise<NextResponse> {
  // Create user not found catalog manifest
  const unifiedManifest: StremioManifest = {
    id: `${packageJson.name}-default`,
    version: packageJson.version,
    name: `AIOCatalogs`,
    description: packageJson.description,
    logo: "https://cdn.ssx.si/u/LSXKCT.png",
    background: "https://i.imgur.com/QPPXf5T.jpeg",
    resources: ["catalog"],
    types: ["movie", "series"],
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
