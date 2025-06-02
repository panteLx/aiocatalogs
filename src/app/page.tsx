import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="container relative flex flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="space-y-4 text-center">
          <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-[5rem]">
            AIoCatalogs
          </h1>
          <p className="text-lg text-white/80">
            Choose how you want to get started
          </p>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <Link
            href="/auth/new"
            className="no-underline transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full border-0 bg-white/10 shadow-lg transition-colors hover:bg-white/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-2xl font-bold text-white">
                  Create New User
                  <span className="text-lg text-white/60">→</span>
                </CardTitle>
                <CardDescription className="text-lg text-white/90">
                  Generate a new unique user ID and start fresh with a new
                  configuration
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link
            href="/auth/existing"
            className="no-underline transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full border-0 bg-white/10 shadow-lg transition-colors hover:bg-white/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-2xl font-bold text-white">
                  Use Existing ID
                  <span className="text-lg text-white/60">→</span>
                </CardTitle>
                <CardDescription className="text-lg text-white/90">
                  Already have a user ID? Enter it here to continue with your
                  existing configuration
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
