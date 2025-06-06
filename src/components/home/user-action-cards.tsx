"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserPlus, LogIn, ArrowRight, Users, Sparkles } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

export function UserActionCards() {
  return (
    <div className="w-full max-w-2xl rounded-lg border border-border/50 bg-card shadow-lg transition-transform duration-500 hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/10">
      <SignInButton mode="modal">
        <Card className="group relative h-full cursor-pointer overflow-hidden border-2 border-transparent bg-gradient-to-br from-card via-card to-card/90 transition-all duration-500 hover:scale-[1.01] hover:border-primary/15 hover:shadow-xl hover:shadow-primary/10">
          {/* Animated background gradient */}
          <div className="from-primary/2 to-primary/3 absolute inset-0 bg-gradient-to-br via-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Animated border glow */}
          <div className="from-primary/8 via-primary/12 to-primary/8 absolute -inset-px -z-10 rounded-lg bg-gradient-to-r opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100" />

          {/* Floating sparkles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Sparkles
              className="absolute right-6 top-4 h-4 w-4 animate-pulse text-primary/20"
              style={{ animationDelay: "0s", animationDuration: "2s" }}
            />
            <Sparkles
              className="absolute left-8 top-12 h-4 w-4 animate-pulse text-primary/15"
              style={{ animationDelay: "0.7s", animationDuration: "3s" }}
            />
            <Sparkles
              className="absolute bottom-8 right-12 h-4 w-4 animate-pulse text-primary/15"
              style={{ animationDelay: "1.2s", animationDuration: "2.5s" }}
            />
            <Sparkles
              className="absolute bottom-16 left-6 h-4 w-4 animate-pulse text-primary/15"
              style={{ animationDelay: "1.8s", animationDuration: "2.8s" }}
            />
          </div>

          <CardHeader className="relative space-y-6 p-8 text-center">
            {/* Icons section */}
            <div className="flex items-center justify-center space-x-4 duration-700 animate-in fade-in-0 slide-in-from-top-4">
              <div className="relative">
                <div className="bg-primary/3 group-hover:bg-primary/8 rounded-full border border-primary/15 p-3 transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <UserPlus className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                {/* Pulsing ring effect */}
                <div className="group-hover:border-primary/8 absolute inset-0 rounded-full border border-primary/15 opacity-0 transition-all duration-500 group-hover:scale-150 group-hover:opacity-100" />
              </div>

              <div className="text-xl font-medium text-muted-foreground transition-all duration-300 group-hover:text-primary/60">
                or
              </div>

              <div className="relative">
                <div className="bg-primary/3 group-hover:bg-primary/8 rounded-full border border-primary/15 p-3 transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <LogIn className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                {/* Pulsing ring effect */}
                <div className="group-hover:border-primary/8 absolute inset-0 rounded-full border border-primary/15 opacity-0 transition-all duration-500 group-hover:scale-150 group-hover:opacity-100" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4 delay-150 duration-700 animate-in fade-in-0 slide-in-from-bottom-4">
              <CardTitle className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-3xl font-bold text-transparent transition-all duration-300 group-hover:from-primary/80 group-hover:to-primary/60">
                Get Started
              </CardTitle>
              <CardDescription className="text-base leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/90">
                <span className="mb-2 block">
                  <strong className="text-primary/80 transition-colors duration-300 group-hover:text-primary/70">
                    Sign in
                  </strong>{" "}
                  to your existing account or{" "}
                  <strong className="text-primary/80 transition-colors duration-300 group-hover:text-primary/70">
                    create a new one
                  </strong>{" "}
                  to start
                </span>
                building and managing your unified catalog configurations.
              </CardDescription>
            </div>

            {/* Call to action */}
            <div className="flex items-center justify-center pt-4 delay-300 duration-700 animate-in fade-in-0 slide-in-from-bottom-4">
              <div className="bg-primary/3 group-hover:bg-primary/6 relative flex items-center space-x-2 rounded-full px-4 py-2 text-muted-foreground transition-all duration-300 group-hover:text-primary/80 group-hover:shadow-lg group-hover:shadow-primary/10">
                <Users className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-sm font-medium">Sign In / Sign Up</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />

                {/* Animated shine effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover:animate-[shine_1s_ease-in-out] group-hover:opacity-100" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </SignInButton>
    </div>
  );
}
