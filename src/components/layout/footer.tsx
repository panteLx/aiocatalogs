"use client";

import { Heart, Github, MessageCircle } from "lucide-react";

export function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Developed by{" "}
            <span className="font-medium text-primary">panteL</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <button
              onClick={() =>
                window.open("https://buymeacoffee.com/pantel", "_blank")
              }
              className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-yellow-500"
            >
              <Heart className="h-4 w-4" />
              <span>Buy me a coffee</span>
            </button>
            <button
              onClick={() =>
                window.open("https://github.com/panteLx/aiocatalogs", "_blank")
              }
              className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </button>
            <button
              onClick={() =>
                window.open("https://discord.gg/Ma4SnagqwE", "_blank")
              }
              className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-indigo-500"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Discord</span>
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} AIOCatalogs - All rights
              reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
