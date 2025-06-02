import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/server";

export default function ExistingUserPage() {
  async function checkUser(formData: FormData) {
    "use server";

    const userId = formData.get("userId") as string;
    const exists = await api.user.exists({ userId });

    if (!exists) {
      // TODO: Show error message
      return;
    }

    redirect(`/dashboard?userId=${userId}`);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <Card className="pointer-events-auto relative z-10 w-full max-w-md border-0 bg-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            Use Existing ID
          </CardTitle>
          <CardDescription className="text-lg text-white/80">
            Enter your user ID to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={checkUser} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-white">
                User ID
              </Label>
              <Input
                id="userId"
                name="userId"
                placeholder="Enter your user ID"
                required
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20"
            >
              Continue
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
