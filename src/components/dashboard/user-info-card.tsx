import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, AlertTriangle } from "lucide-react";

interface UserInfoCardProps {
  userId: string;
}

export function UserInfoCard({ userId }: UserInfoCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">User ID</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="break-all rounded-md border bg-muted/50 p-2 font-mono text-xs">
          {userId}
        </p>
        <div className="flex items-start space-x-2 rounded-md border border-orange-500/20 bg-orange-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
          <div className="text-xs text-orange-600 dark:text-orange-400">
            <p className="font-medium">Security Warning</p>
            <p className="mt-1">
              Do not share your User ID – it gives full access to your catalogs
              and API keys.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
