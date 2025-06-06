"use client";

import { useParams } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { useUserValidation } from "@/hooks/validation/use-user-validation";

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
      <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center pt-16">
        <div className="relative z-10 flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  // Show dashboard if user is valid
  if (isValid && userId) {
    return (
      <main className="relative min-h-screen flex-1 pt-16">
        <div className="container relative z-10 mx-auto px-4 py-8">
          <DashboardContent userId={userId} />
        </div>
      </main>
    );
  }

  // This shouldn't render as redirects happen in the hook,
  // but show a minimal loader for the brief moment before redirect
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center pt-16">
      <div className="relative z-10 flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    </main>
  );
}
