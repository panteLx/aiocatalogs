import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, Heart, Star } from "lucide-react";

export function FeaturedCards() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Discord Server */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/70">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
                <MessageCircle className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">Join our Discord</h3>
                <p className="text-xs text-muted-foreground">
                  Get support & updates
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open("https://discord.gg/Ma4SnagqwE", "_blank")
                }
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Buy Me a Coffee */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/70">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                <Heart className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">Support the Project</h3>
                <p className="text-xs text-muted-foreground">
                  Buy me a coffee ☕
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open("https://buymeacoffee.com/pantel", "_blank")
                }
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Easynews++ Addon */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/70">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                <Star className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">Easynews++ Addon</h3>
                <p className="text-xs text-muted-foreground">
                  Highly customizable Easynews addon
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open("https://en.pantelx.com", "_blank")}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
