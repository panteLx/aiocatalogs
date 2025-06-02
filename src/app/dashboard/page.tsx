import { redirect } from "next/navigation";
import { api } from "@/trpc/server";
import { AuthLayout } from "@/app/auth/_components/auth-layout";
import { DashboardContent } from "@/app/dashboard/_components/dashboard-content";

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
  const exists = await api.user.exists({ userId });
  if (!exists) {
    redirect("/");
  }

  return (
    <AuthLayout title="Dashboard" description="Welcome to your dashboard">
      <DashboardContent userId={userId} />
    </AuthLayout>
  );
}
