import { LatestPost } from "~/app/_components/post";
import { RecentPosts } from "~/app/_components/RecentPosts";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  // Initialize data on the server - this ensures consistent hydration
  await Promise.allSettled([
    api.post.getLatest.prefetch(),
    api.post.getRecentPosts.prefetch({ limit: 5 })
  ]);

  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="mb-10 text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
            Blog <span className="text-[hsl(280,100%,70%)]">Posts</span>
          </h1>

          <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row">
            {/* Left column - Create post form */}
            <div className="flex w-full justify-center md:w-1/2">
              <div className="w-full max-w-md">
                <div className="rounded-lg bg-white/5 p-6 shadow-lg">
                  <h2 className="mb-6 text-center text-2xl font-bold">
                    Create New Post
                  </h2>
                  <LatestPost />
                </div>
              </div>
            </div>

            {/* Right column - Recent posts */}
            <div className="w-full md:w-1/2">
              <div className="rounded-lg bg-white/5 p-6 shadow-lg">
                <h2 className="mb-6 text-center text-2xl font-bold">
                  Recent Posts
                </h2>
                <RecentPosts />
              </div>
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
