import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { type D1Database } from "@cloudflare/workers-types";

// Define Cloudflare bindings interface
interface Env {
  D1: {
    DATABASE: D1Database;
  };
}

// Extend NextRequest to include Cloudflare bindings
interface CloudflareRequest extends NextRequest {
  cloudflare?: Env;
}

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  // Access Cloudflare environment variables including D1 database
  const typedReq = req as CloudflareRequest;
  const cloudflareEnv = typedReq.cloudflare?.D1?.DATABASE ? {
    DB: typedReq.cloudflare.D1.DATABASE
  } : undefined;

  return createTRPCContext({
    headers: req.headers,
    env: cloudflareEnv,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
