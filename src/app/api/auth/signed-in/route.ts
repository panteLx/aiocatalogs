import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function GET() {
  const { userId } = await auth();

  if (userId) {
    // Redirect to the user's dashboard
    redirect(`/${userId}`);
  } else {
    // If no user, redirect to home
    redirect("/");
  }
}
