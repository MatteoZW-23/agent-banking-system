import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Bell } from "lucide-react";

export default function Alerts() {
  const { isAuthenticated, user } = useAuth({ redirectOnUnauthenticated: true });

  const alertsQuery = trpc.alerts.getHistory.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  const checkThresholdsMutation = trpc.alerts.checkThresholds.useMutation();
  const acknowledgeMutation = trpc.alerts.acknowledge.useMutation();

  const handleCheckThresholds = async () => {
    await checkThresholdsMutation.mutateAsync();
  };

  const handleAcknowledge = async (alertId: number) => {
    await acknowledgeMutation.mutateAsync({ alertId });
    await alertsQuery.refetch();
  };

  if (!isAuthenticated) {
    return null;
  }

  const alerts = alertsQuery.data || [];
  const triggeredAlerts = alerts.filter((a) => a.status === "triggered");
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged");

  const getSeverityColor = (severity: string | null) => {
    if (!severity) return "bg-gray-100 text-gray-800 border-gray-300";
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityIcon = (severity: string | null) => {
    if (!severity) return <Clock className="h-5 w-5" />;
    switch (severity) {
      case "critical":
      case "high":
        return <AlertCircle className="h-5 w-5" />;
      case "medium":
      case "low":
        return <Bell className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Manage system alerts and critical notifications
          </p>
        </div>

        {/* Alert Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{triggeredAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{acknowledgedAlerts.length}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {alerts.filter((a) => a.severity === "critical" && a.status === "triggered").length}
              </div>
              <p className="text-xs text-muted-foreground">Immediate action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCheckThresholds}
              disabled={checkThresholdsMutation.isPending}
            >
              {checkThresholdsMutation.isPending ? "Checking..." : "Check Thresholds Now"}
            </Button>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>
              {triggeredAlerts.length} alert{triggeredAlerts.length !== 1 ? "s" : ""} requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {triggeredAlerts.length > 0 ? (
              <div className="space-y-3">
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <p className="font-semibold">{alert.title}</p>
                          <p className="text-sm mt-1">{alert.message}</p>
                          <p className="text-xs mt-2 opacity-75">
                            {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledgeMutation.isPending}
                      >
                        {acknowledgeMutation.isPending ? "..." : "Acknowledge"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                ✓ No active alerts. System is healthy.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Acknowledged Alerts */}
        {acknowledgedAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Acknowledged Alerts</CardTitle>
              <CardDescription>Alerts being addressed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {acknowledgedAlerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <CheckCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Acknowledged by {alert.acknowledgedBy ? "Admin" : "System"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Acknowledged</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alert Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Configuration</CardTitle>
            <CardDescription>Current alert thresholds and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Discrepancy Alert</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Triggered when transaction discrepancy exceeds $10 or 5%
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Low Float Alert</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Triggered when provider float falls below configured minimum threshold
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Suspicious Transaction Alert</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Triggered when LLM analysis flags transaction with risk score &gt; 0.7
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Failed Reconciliation Alert</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Triggered when reconciliation status is "investigating" or has major discrepancies
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
