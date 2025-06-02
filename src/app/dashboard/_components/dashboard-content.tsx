import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle, Sparkles } from "lucide-react";

interface DashboardContentProps {
  userId: string;
}

export function DashboardContent({ userId }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2 text-center">
        <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold text-transparent">
          Welcome to your Dashboard
        </h1>
        <p className="text-muted-foreground">
          Your account is active and ready to use
        </p>
      </div>

      {/* User ID Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">User Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <CardDescription>Your User ID</CardDescription>
            <p className="break-all rounded-md border bg-muted/50 p-3 font-mono text-sm">
              {userId}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Account Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge
              variant="default"
              className="border-green-500/20 bg-green-500/10 text-green-500"
            >
              Active
            </Badge>
            <span className="text-sm text-muted-foreground">
              All systems operational
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Available Features</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Your account is ready to use. You can now access all available
              features.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Full catalog access</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Real-time updates</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Premium support</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Advanced analytics</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
