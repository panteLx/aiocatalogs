import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/*
 * Using process.env instead of getRequestContext().env because this validation is shared between next and drizzle-kit config
 */

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    LOCAL_DB_PATH: z.string().optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
    CLOUDFLARE_D1_DATABASE_ID: z.string().optional(),
    CLOUDFLARE_TOKEN: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Clerk Authentication
    CLERK_SECRET_KEY: z.string().optional(),
    // GitHub Repository Configuration for Changelog
    GITHUB_REPO_OWNER: z.string().default("your-github-username"),
    GITHUB_REPO_NAME: z.string().default("aiocatalogs"),
    GITHUB_TOKEN: z.string().optional(), // Optional GitHub token for higher rate limits
    MDBLIST_MANIFEST_URL: z
      .string()
      .default("https://1fe84bc728af-stremio-mdblist.baby-beamup.club"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_GITHUB_INCLUDE_PRERELEASE: z.string().default("false"),
    NEXT_PUBLIC_GITHUB_SHOW_VIEW_ON_GITHUB_BUTTON: z.string().default("true"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    LOCAL_DB_PATH: process.env.LOCAL_DB_PATH,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_D1_DATABASE_ID: process.env.CLOUDFLARE_D1_DATABASE_ID,
    CLOUDFLARE_TOKEN: process.env.CLOUDFLARE_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
    GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    MDBLIST_MANIFEST_URL: process.env.MDBLIST_MANIFEST_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GITHUB_INCLUDE_PRERELEASE:
      process.env.NEXT_PUBLIC_GITHUB_INCLUDE_PRERELEASE,
    NEXT_PUBLIC_GITHUB_SHOW_VIEW_ON_GITHUB_BUTTON:
      process.env.NEXT_PUBLIC_GITHUB_SHOW_VIEW_ON_GITHUB_BUTTON,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
