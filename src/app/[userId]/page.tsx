"use client";

import { useParams } from "next/navigation";
import { DashboardContent } from "@/app/dashboard/_components/dashboard-content";
import { useUserValidation } from "@/hooks/use-user-validation";

export default function UserPage() {
  const params = useParams();
  const userId = params.userId as string;

  const { isValidating, isValid, showLoader } = useUserValidation({
    userId,
    redirectOnInvalid: true,
    showToastOnError: true,
  });

  // Show loading state only if validation takes time
  if (isValidating && showLoader) {
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

        <div className="relative z-10 flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  // Show dashboard if user is valid
  if (isValid && userId) {
    return (
      <main className="relative min-h-screen bg-background pt-16">
        {/* Modern animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-secondary/20 blur-3xl delay-1000"></div>
          <div className="absolute left-1/2 top-3/4 h-64 w-64 animate-pulse rounded-full bg-accent/20 blur-3xl delay-500"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-8">
          <DashboardContent userId={userId} />
        </div>
      </main>
    );
  }

  // This shouldn't render as redirects happen in the hook,
  // but show a minimal loader for the brief moment before redirect
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

      <div className="relative z-10 flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    </main>
  );
}
