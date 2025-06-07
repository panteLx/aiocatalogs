import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const corsMiddleware = (request: NextRequest) => {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Continue with the request
  const response = NextResponse.next();

  // Add CORS headers to all responses
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  return response;
};

// const isProtectedRoute = createRouteMatcher(["/api(.*)", "/manifest(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Apply CORS middleware for API routes and manifest routes
  if (
    req.nextUrl.pathname.startsWith("/api/") ||
    req.nextUrl.pathname.includes("/manifest.json")
  ) {
    return corsMiddleware(req);
  }

  // Skip Clerk protection for catalog routes and manifest routes (needed for Stremio)
  if (
    req.nextUrl.pathname.includes("/manifest.json") ||
    req.nextUrl.pathname.match(/^\/[^\/]+\/catalog\//)
  ) {
    return NextResponse.next();
  }

  // Continue with default Clerk middleware for other routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
