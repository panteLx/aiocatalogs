import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const userId = searchParams.userId;

  if (!userId) {
    redirect("/");
  }

  // Verify the user exists
  // Verify the user exists
  const exists = await api.user.exists({ userId });
  if (!exists) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <Card className="w-full max-w-md border-0 bg-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            Dashboard
          </CardTitle>
          <CardDescription className="text-lg text-white/80">
            Welcome to your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-white/5 p-4">
            <p className="text-sm text-white/60">Your User ID</p>
            <p className="mt-1 font-mono text-lg text-white">{userId}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
