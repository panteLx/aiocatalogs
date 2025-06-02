"use client";

import { useParams } from "next/navigation";
import { AuthLayout } from "@/app/auth/_components/auth-layout";
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
      <AuthLayout title="Dashboard" description="">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    );
  }

  // Show dashboard if user is valid
  if (isValid && userId) {
    return (
      <AuthLayout title="Dashboard" description="">
        <DashboardContent userId={userId} />
      </AuthLayout>
    );
  }

  // This shouldn't render as redirects happen in the hook,
  // but show a minimal loader for the brief moment before redirect
  return (
    <AuthLayout title="Dashboard" description="">
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    </AuthLayout>
  );
}
