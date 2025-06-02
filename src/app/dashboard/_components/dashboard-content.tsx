interface DashboardContentProps {
  userId: string;
}

export function DashboardContent({ userId }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm text-white/60">Your User ID</p>
        <p className="mt-1 break-all font-mono text-lg text-white">{userId}</p>
      </div>

      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm text-white/60">Status</p>
        <p className="mt-1 text-green-400">Active</p>
      </div>

      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm text-white/60">Welcome Message</p>
        <p className="mt-1 text-white">
          Your account is ready to use. You can now access all available
          features.
        </p>
      </div>
    </div>
  );
}
