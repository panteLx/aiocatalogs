"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  useEffect(() => {
    if (userId) {
      router.replace(`/${userId}`);
    }
  }, [router, userId]);

  return null;
}
