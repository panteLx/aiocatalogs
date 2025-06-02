import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AuthButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function AuthButton({
  isLoading = false,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <ShadcnButton
      disabled={isLoading || disabled}
      className={cn(
        "w-full border-0 bg-white/10 text-white hover:bg-white/20",
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? (loadingText ?? "Loading...") : children}
    </ShadcnButton>
  );
}
