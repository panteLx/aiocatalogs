"use client";

import { Changelog } from "@/components/changelog/changelog";
import { HeroSection } from "@/components/home/hero-section";
import { UserActionCards } from "@/components/home/user-action-card";
import { changelogConfig } from "@/lib/config/changelog-config";
import { SignedOut } from "@clerk/nextjs";
import { LoadingState } from "@/components/ui/loading-state";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isLoaded } = useUser();

  // Show loading state while authentication is being checked
  if (!isLoaded) {
    return <LoadingState />;
  }

  // The HeroSection now handles both authenticated and unauthenticated states
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
