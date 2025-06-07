interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  size = "md",
  className = "",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <main
      className={`relative flex min-h-screen flex-1 flex-col items-center justify-center pt-16 ${className}`}
    >
      <div className="container relative flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="relative z-10 flex items-center justify-center py-12">
          <div
            className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-primary`}
          />
        </div>
      </div>
    </main>
  );
}
