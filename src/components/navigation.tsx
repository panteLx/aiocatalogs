"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Menu, X } from "lucide-react";
import packageJson from "../../package.json";

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleHomeHover = () => {
    // Prefetch the home route for instant navigation
    router.prefetch("/");
  };

  // Only show home link if not on home page
  const shouldShowHome = pathname !== "/";

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md",
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="gradient-text text-2xl font-bold">AIO</div>
            <Badge
              variant="secondary"
              className="rounded-full border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-2 py-1 text-xs font-medium tracking-wide text-blue-400 shadow-sm transition-shadow duration-200 hover:cursor-default hover:shadow-md"
            >
              v{packageJson.version}
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-6 md:flex">
            {shouldShowHome && (
              <Link
                href="/"
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onMouseEnter={handleHomeHover}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="animate-fade-in border-t border-border py-4 md:hidden">
            <div className="flex flex-col space-y-2">
              {shouldShowHome && (
                <Link
                  href="/"
                  className="flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={handleHomeHover}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
