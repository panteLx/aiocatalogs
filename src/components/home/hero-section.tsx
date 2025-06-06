"use client";

import { Badge } from "@/components/ui/badge";
import packageJson from "../../../package.json";

export function HeroSection() {
  return (
    <div className="space-y-6 text-center">
      <div className="relative inline-block">
        <h1 className="bg-gradient-to-r from-foreground via-primary to-foreground/60 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent sm:text-[6rem] lg:text-[8rem]">
          AIOCatalogs
        </h1>
        {/* Version Badge - positioned at top right of the logo */}
        <div className="absolute -right-2 -top-5 sm:-right-6 sm:-top-3 lg:-right-10 lg:-top-5">
          <Badge
            variant="secondary"
            className="transform rounded-full border-primary/30 bg-gradient-to-r from-primary/20 to-foreground/10 px-1.5 py-0.5 text-xs font-bold tracking-wide text-primary/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:text-primary hover:shadow-xl sm:px-2.5 sm:py-1 sm:text-sm lg:px-4 lg:py-2 lg:text-base"
          >
            v{packageJson.version}
          </Badge>
        </div>
      </div>
      <p className="mx-auto max-w-2xl text-center text-xl text-muted-foreground">
        Start with your supercharged catalog experience now!
      </p>
    </div>
  );
}
