import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Get the current user's authentication information
 * This function can be used in Server Components and Server Actions
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  return { userId };
}

/**
 * Protect a server component or page by redirecting unauthenticated users
 */
export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return { userId };
}

/**
 * Get user authentication state for conditional rendering
 */
export async function getAuthState() {
  const { userId } = await auth();
  return {
    isAuthenticated: !!userId,
    userId,
  };
}
