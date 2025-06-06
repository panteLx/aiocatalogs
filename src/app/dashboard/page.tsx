"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { PageLayout } from "@/components/layout/page-layout";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  useEffect(() => {
    // Redirect to new userId-based route
    if (userId) {
      router.replace(`/${userId}`);
    } else {
      // If no userId, redirect to auth page
      router.replace("/");
    }
  }, [userId, router]);

  // Show minimal loading state during redirect
  return (
    <PageLayout title="Redirecting..." description="">
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary opacity-50"></div>
      </div>
    </PageLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <PageLayout title="Loading..." description="">
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary opacity-50"></div>
          </div>
        </PageLayout>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
