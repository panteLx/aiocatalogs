"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  AlertTriangle,
  Search,
  ArrowLeft,
  Package,
  Sparkles,
} from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative mt-16 flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-20">
      <div className="container relative flex flex-col items-center justify-center gap-8 text-center">
        {/* 404 Number with Gradient Effect */}
        <div className="relative">
          <h1 className="bg-gradient-to-r from-foreground via-primary to-foreground/60 bg-clip-text text-8xl font-extrabold tracking-tight text-transparent sm:text-9xl lg:text-[12rem]">
            404
          </h1>
          <div className="absolute -right-4 -top-8 sm:-right-8 sm:-top-12 lg:-right-16 lg:-top-16">
            <Badge
              variant="secondary"
              className="transform rounded-full border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-red-500/10 px-3 py-1 text-sm font-bold tracking-wide text-orange-500/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:text-orange-500 hover:shadow-xl sm:px-4 sm:py-2 sm:text-base"
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              Lost
            </Badge>
          </div>
        </div>

        {/* Error Message Card */}
        <Card className="mx-auto w-full max-w-2xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20">
              <Package className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold text-transparent">
              Page Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground">
              The page you're looking for seems to have wandered off into the
              digital void. Don't worry, even the best catalogs sometimes have
              missing entries!
            </p>

            {/* Suggestions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Here's what you can do:
              </h3>
              <div className="grid gap-3 text-left">
                <div className="flex items-center space-x-3 rounded-md border border-border/50 bg-background/30 p-3">
                  <Search className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Check the URL for any typos or errors
                  </span>
                </div>
                <div className="flex items-center space-x-3 rounded-md border border-border/50 bg-background/30 p-3">
                  <Home className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Return to the homepage and try navigating again
                  </span>
                </div>
                <div className="flex items-center space-x-3 rounded-md border border-border/50 bg-background/30 p-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Explore your catalog dashboard if you have an account
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="flex-1 sm:flex-none">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            {/* Fun Quote */}
            <div className="border-t border-border/50 pt-4">
              <p className="text-xs italic text-muted-foreground">
                "Not all who wander are lost... but this page definitely is."
                <span className="ml-2 text-primary">- AIOCatalogs Team</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
