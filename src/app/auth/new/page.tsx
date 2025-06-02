import { AuthLayout } from "@/app/auth/_components/auth-layout";
import { NewUserForm } from "@/app/auth/_components/new-user-form";

export default function NewUserPage() {
  return (
    <AuthLayout
      title="Create New User"
      description="Click the button below to generate a new user ID"
    >
      <NewUserForm />
    </AuthLayout>
  );
}
