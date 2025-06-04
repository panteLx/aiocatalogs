import { userRouter } from "@/server/api/routers/user";
import { changelogRouter } from "@/server/api/routers/changelog";
import { catalogRouter } from "@/server/api/routers/catalog";
import { shareRouter } from "@/server/api/routers/share";
import { mdblistRouter } from "@/server/api/routers/mdblist";
import { rpdbRouter } from "@/server/api/routers/rpdb";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  changelog: changelogRouter,
  catalog: catalogRouter,
  share: shareRouter,
  mdblist: mdblistRouter,
  rpdb: rpdbRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
