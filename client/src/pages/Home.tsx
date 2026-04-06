import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { AlertCircle, TrendingUp, DollarSign, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch dashboard data
  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const floatQuery = trpc.floats.getTotalBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const alertsQuery = trpc.alerts.getHistory.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );

  const dailySummaryQuery = trpc.reports.dailySummary.useQuery(
    { date: selectedDate },
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.name || "User"}. Here's your agent banking overview.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Float</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${floatQuery.data ? parseFloat(floatQuery.data).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">Across all providers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{providersQuery.data?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Connected and active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailySummaryQuery.data?.transactionCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${dailySummaryQuery.data?.totalAmount.toFixed(2) || "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alertsQuery.data?.filter((a) => a.status === "triggered").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest system alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {alertsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            ) : alertsQuery.data && alertsQuery.data.length > 0 ? (
              <div className="space-y-4">
                {alertsQuery.data.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        alert.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : alert.severity === "high"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent alerts</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common operations and tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline">Run Reconciliation</Button>
            <Button variant="outline">View Transactions</Button>
            <Button variant="outline">Check Float Balances</Button>
            <Button variant="outline">Generate Report</Button>
            <Button variant="outline">Analyze Transactions</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
