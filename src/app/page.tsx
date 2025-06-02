import Link from "next/link";

import { LatestPost } from "@/app/_components/post";
import { ToastButton } from "@/app/_components/toast-button";
import { api, HydrateClient } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        {/* Hintergrund-Pattern für mehr Tiefe */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="container relative flex flex-col items-center justify-center gap-14 px-4 py-16">
          <div className="space-y-4 text-center">
            <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-[5rem]">
              Create{" "}
              <span className="bg-gradient-to-r from-[hsl(280,100%,70%)] to-[hsl(280,100%,60%)] bg-clip-text text-transparent">
                T3
              </span>{" "}
              App
            </h1>
            <p className="text-lg text-white/60">
              Build full-stack, typesafe web applications with ease
            </p>
          </div>

          <div className="flex gap-4">
            <Button className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white transition hover:bg-white/20">
              Click me
            </Button>
            <ToastButton />
          </div>

          <Separator className="w-1/2 bg-white/10" />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
            <Link
              href="https://create.t3.gg/en/usage/first-steps"
              target="_blank"
              className="no-underline transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full border-0 bg-white/10 shadow-lg transition-colors hover:bg-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-2xl font-bold text-white">
                    First Steps
                    <span className="text-lg text-white/60">→</span>
                  </CardTitle>
                  <CardDescription className="text-lg text-white/90">
                    Just the basics - Everything you need to know to set up your
                    database and authentication.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link
              href="https://create.t3.gg/en/introduction"
              target="_blank"
              className="no-underline transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full border-0 bg-white/10 shadow-lg transition-colors hover:bg-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-2xl font-bold text-white">
                    Documentation
                    <span className="text-lg text-white/60">→</span>
                  </CardTitle>
                  <CardDescription className="text-lg text-white/90">
                    Learn more about Create T3 App, the libraries it uses, and
                    how to deploy it.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          <Card className="border-0 bg-white/5 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-center text-2xl text-white">
                {hello ? hello.greeting : "Loading tRPC query..."}
              </p>
            </CardContent>
          </Card>

          <LatestPost />
        </div>
      </main>
    </HydrateClient>
  );
}
