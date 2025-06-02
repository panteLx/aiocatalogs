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
        "w-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl",
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? (loadingText ?? "Loading...") : children}
    </ShadcnButton>
  );
}
