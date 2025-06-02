import { AuthLayout } from "@/app/auth/_components/auth-layout";
import { ExistingUserForm } from "@/app/auth/_components/existing-user-form";

export default function ExistingUserPage() {
  return (
    <AuthLayout
      title="Use Existing ID"
      description="Enter your user ID to continue"
    >
      <ExistingUserForm />
    </AuthLayout>
  );
}
