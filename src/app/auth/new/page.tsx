import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/server";

const createUser = async () => {
  "use server";

  const userId = Math.random().toString(36).substring(2, 15);
  await api.user.create({ userId });
  redirect(`/dashboard?userId=${userId}`);
};

export default function Page() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <Card className="pointer-events-auto relative z-10 w-full max-w-md border-0 bg-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            Create New User
          </CardTitle>
          <CardDescription className="text-lg text-white/80">
            Click the button below to generate a new user ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUser}>
            <button
              type="submit"
              className="w-full rounded-lg bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20"
            >
              Generate New User ID
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
