import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Bell,
  ShieldAlert,
  RefreshCw,
  Zap,
  ShieldCheck,
  Info,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Activity,
  History,
  AlertTriangle,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { FraudDetectionPanel } from "@/components/FraudDetectionPanel";

export default function Alerts() {
  const { isAuthenticated, user } = useAuth({
    redirectOnUnauthenticated: true,
  });

  const alertsQuery = trpc.alerts.getHistory.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  const checkThresholdsMutation = trpc.alerts.checkThresholds.useMutation({
    onSuccess: () => {
      toast.success("System scan completed");
      alertsQuery.refetch();
    }
  });
  
  const acknowledgeMutation = trpc.alerts.acknowledge.useMutation();

  const handleCheckThresholds = async () => {
    await checkThresholdsMutation.mutateAsync();
  };

  const handleAcknowledge = async (alertId: number) => {
    await acknowledgeMutation.mutateAsync({ alertId });
    await alertsQuery.refetch();
    toast.success("Alert acknowledged");
  };

  if (!isAuthenticated) return null;

  const alerts = alertsQuery.data || [];
  const triggeredAlerts = alerts.filter((a: any) => a.status === "triggered");
  const acknowledgedAlerts = alerts.filter(
    (a: any) => a.status === "acknowledged"
  );

  const getSeverityStyles = (severity: string | null) => {
    switch (severity) {
      case "critical":
        return {
          color: "text-red-700",
          itemColor: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-100 dark:border-red-900/40",
          iconBg: "bg-red-100 text-red-600"
        };
      case "high":
        return {
          color: "text-orange-700",
          itemColor: "text-orange-600",
          bg: "bg-orange-50",
          border: "border-orange-100 dark:border-orange-900/40",
          iconBg: "bg-orange-100 text-orange-600"
        };
      case "medium":
        return {
          color: "text-amber-700",
          itemColor: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-100 dark:border-amber-900/40",
          iconBg: "bg-amber-100 text-amber-600"
        };
      case "low":
        return {
          color: "text-blue-700",
          itemColor: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-100 dark:border-blue-900/40",
          iconBg: "bg-blue-100 text-blue-600"
        };
      default:
        return {
          color: "text-gray-700",
          itemColor: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-100 dark:border-gray-800",
          iconBg: "bg-gray-100 text-gray-600"
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Security Center"
          subtitle="Monitor active incidents and transaction alerts across the network."
          category="Admin"
          actions={
            <Button
              onClick={handleCheckThresholds}
              disabled={checkThresholdsMutation.isPending}
              className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm"
            >
              {checkThresholdsMutation.isPending ? (
                <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="mr-2 h-3.5 w-3.5" />
              )}
              Run System Check
            </Button>
          }
        />

        <FraudDetectionPanel />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Active Incidents", val: triggeredAlerts.length, color: "text-red-700", bg: "bg-red-50" },
            { label: "High Priority", val: triggeredAlerts.filter((a: any) => a.severity === "critical" || a.severity === "high").length, color: "text-orange-700", bg: "bg-orange-50" },
            { label: "Response Rate", val: `${alerts.length ? Math.round((acknowledgedAlerts.length / alerts.length) * 100) : 100}%`, color: "text-blue-700", bg: "bg-blue-50" },
            { label: "Total Logs", val: alerts.length, color: "text-gray-700", bg: "bg-gray-50" },
          ].map((stat, i) => (
            <Card key={i} className={`border border-gray-200 dark:border-slate-800 shadow-sm`}>
               <CardContent className="pt-5 pb-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">{stat.label}</p>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.val}</div>
               </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-7">
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600" /> Active Incidents
              </h2>
              <Badge variant="outline" className="border-red-200 text-red-700 font-semibold text-[10px] px-2.5 py-0.5">
                {triggeredAlerts.length} OPEN
              </Badge>
            </div>

            {triggeredAlerts.length > 0 ? (
              <div className="space-y-3">
                {triggeredAlerts.map((alert: any) => {
                  const styles = getSeverityStyles(alert.severity);
                  return (
                    <Card key={alert.id} className={`border ${styles.border} shadow-sm transition-all overflow-hidden`}>
                      <CardContent className="p-5 flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg}`}>
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{alert.title}</p>
                            <p className="text-xs text-gray-500 leading-relaxed mt-1">{alert.message}</p>
                            <div className="flex items-center gap-2 mt-3 text-[10px] font-medium text-gray-400">
                              <span>{new Date(alert.triggeredAt).toLocaleString()}</span>
                              <span className="text-gray-300">•</span>
                              <span className={`uppercase ${styles.itemColor}`}>{alert.severity} Severity</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 rounded-md border-gray-200 text-xs font-medium hover:bg-gray-50"
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          {acknowledgeMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Resolve"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-xl">
                <ShieldCheck className="h-10 w-10 text-emerald-100 mx-auto mb-4" />
                <h3 className="text-sm font-bold text-gray-900">System Healthy</h3>
                <p className="text-xs text-gray-400 mt-1">No active incidents found in your region.</p>
              </div>
            )}

            {/* Resolved Feed */}
            {acknowledgedAlerts.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                  <History className="h-3.5 w-3.5" /> Recent History
                </h3>
                <div className="space-y-2">
                  {acknowledgedAlerts.slice(0, 5).map((alert: any) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 opacity-60" />
                        <div>
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-300">{alert.title}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{alert.message}</p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-gray-400 font-medium">
                        {new Date(alert.triggeredAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="border border-gray-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-base">Monitoring Rules</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {[
                  { label: "Float Levels", icon: TrendingDown, desc: "Triggers when gateway float is < 20% of required min." },
                  { label: "Delta Mismatch", icon: AlertTriangle, desc: "Triggers for reconciliation gaps > $10.00." },
                  { label: "Inactivity", icon: Clock, desc: "Triggers if agent node sync fails for > 15 mins." },
                ].map((rule, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <rule.icon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{rule.label}</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="p-6 bg-gray-900 rounded-xl text-white">
              <div className="space-y-4">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Audit History</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-2">
                    Security logs are preserved for 12 months for regulatory and internal audit purposes.
                  </p>
                </div>
                <Button variant="outline" className="w-full h-9 rounded-lg bg-transparent border-gray-700 text-white hover:bg-white/5 text-xs font-semibold">
                  View Full Event Log
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
