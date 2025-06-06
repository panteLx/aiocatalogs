"use client";

import { Changelog } from "@/components/changelog/changelog";
import { HeroSection } from "@/components/home/hero-section";
import { UserActionCards } from "@/components/home/user-action-cards";
import { changelogConfig } from "@/lib/config/changelog-config";
import { SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // If user is authenticated, show a welcome message and link to their dashboard
  if (isLoaded && user) {
    return (
      <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center pt-16">
        <div className="container relative flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="space-y-6 text-center">
            <h1 className="gradient-text text-4xl font-bold sm:text-6xl">
              Welcome back, {user.firstName ?? user.username}!
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Ready to manage your AIO catalogs?
            </p>
            <Button
              size="lg"
              onClick={() => router.push(`/${user.id}`)}
              className="px-8 py-3 text-lg"
            >
              Go to your Dashboard
            </Button>
          </div>

          <Changelog
            includePrerelease={changelogConfig.display.includePrerelease}
          />
        </div>
      </main>
    );
  }

  // For unauthenticated users, show the original flow
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center pt-16">
      <div className="container relative flex flex-col items-center justify-center gap-12 px-4 py-16">
        <HeroSection />

        <SignedOut>
          <UserActionCards />
        </SignedOut>

        <Changelog
          includePrerelease={changelogConfig.display.includePrerelease}
        />
      </div>
    </main>
  );
}
