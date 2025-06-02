import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserPlus, LogIn, ArrowRight, Shield } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background pt-16">
      {/* Modern animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-secondary/20 blur-3xl delay-1000"></div>
        <div className="absolute left-1/2 top-3/4 h-64 w-64 animate-pulse rounded-full bg-accent/20 blur-3xl delay-500"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container relative flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="space-y-6 text-center">
          <h1 className="bg-gradient-to-r from-foreground via-primary to-foreground/60 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent sm:text-[6rem] lg:text-[8rem]">
            AIOCatalogs
          </h1>
          <p className="max-w-2xl text-xl text-muted-foreground">
            Choose how you want to get started with your supercharged catalog
            experience
          </p>
        </div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
          <Link href="/auth/new" className="group no-underline">
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-card/70 hover:shadow-2xl">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-full border border-primary/20 bg-primary/10 p-3">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">
                    Create New User
                  </CardTitle>
                  <CardDescription className="text-base">
                    Generate a new unique user ID and start fresh with a new
                    configuration
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/auth/existing" className="group no-underline">
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-card/70 hover:shadow-2xl">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-full border border-secondary/20 bg-secondary/10 p-3">
                    <LogIn className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">
                    Use Existing ID
                  </CardTitle>
                  <CardDescription className="text-base">
                    Already have a user ID? Enter it to access your existing
                    configuration
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Additional info section */}
        <div className="mt-12 space-y-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure • Fast • Modern</span>
          </div>
        </div>
      </div>
    </main>
  );
}
