import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
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
  Activity
} from "lucide-react";

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

  if (!isAuthenticated) return null;

  const alerts = alertsQuery.data || [];
  const triggeredAlerts = alerts.filter((a: any) => a.status === "triggered");
  const acknowledgedAlerts = alerts.filter((a: any) => a.status === "acknowledged");

  const getSeverityStyles = (severity: string | null) => {
    if (!severity) return { color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/10" };
    switch (severity) {
      case "critical": return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
      case "high": return { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
      case "medium": return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
      case "low": return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      default: return { color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/10" };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Security Telemetry
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Real-time discrepancy detection and high-risk activity flagging.
            </p>
          </div>
          <Button 
             onClick={handleCheckThresholds}
             disabled={checkThresholdsMutation.isPending}
             className="h-11 rounded-xl premium-gradient text-white px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {checkThresholdsMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Execute Scrutiny Scan
          </Button>
        </div>

        {/* Alerts Scorecards */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Active Incidents", value: triggeredAlerts.length, color: "text-rose-600", bg: "bg-rose-50", desc: "Requiring attention" },
            { label: "High Risk Flags", value: triggeredAlerts.filter((a: any) => a.severity === 'critical').length, color: "text-orange-600", bg: "bg-orange-50", desc: "Priority investigation" },
            { label: "Acknowledge Rate", value: `${alerts.length ? Math.round((acknowledgedAlerts.length / alerts.length) * 100) : 0}%`, color: "text-blue-600", bg: "bg-blue-50", desc: "Response metric" },
            { label: "Total Logs", value: alerts.length, color: "text-slate-600", bg: "bg-slate-50", desc: "Audit trail depth" },
          ].map((stat, i) => (
             <Card key={i} className="border-none shadow-sm dark:bg-slate-900/50 hover-lift overflow-hidden">
                <CardHeader className="pb-2">
                   <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className={`text-4xl font-black ${stat.color}`}>{stat.value}</div>
                   <p className="text-xs font-medium text-slate-400 mt-1">{stat.desc}</p>
                </CardContent>
             </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-7">
          {/* Main Incidents Feed */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <ShieldAlert className="h-5 w-5 text-rose-500" /> Active Incidents
               </h2>
               <Badge className="bg-rose-500/10 text-rose-500 text-[10px] font-black tracking-widest border-none px-3 py-1">
                 {triggeredAlerts.length} OPEN
               </Badge>
            </div>

            {triggeredAlerts.length > 0 ? (
              <div className="space-y-4">
                {triggeredAlerts.map((alert: any) => {
                  const styles = getSeverityStyles(alert.severity);
                  return (
                    <div
                      key={alert.id}
                      className={`group p-6 bg-white dark:bg-slate-900 border ${styles.border} rounded-2xl hover:shadow-md transition-all duration-300 relative overflow-hidden`}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${styles.bg.replace('/10', '')}`} />
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex gap-5">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${styles.bg}`}>
                             <AlertCircle className={`h-6 w-6 ${styles.color}`} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{alert.title}</p>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-lg">{alert.message}</p>
                            <div className="flex items-center gap-3 pt-3">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                 {new Date(alert.triggeredAt).toLocaleString()}
                               </p>
                               <span className="text-slate-200 dark:text-slate-800">•</span>
                               <p className={`text-[10px] font-black uppercase tracking-widest ${styles.color}`}>
                                 {alert.severity} Severity
                               </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-4 rounded-xl border-slate-200 font-bold text-[10px] uppercase group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          {acknowledgeMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Acknowledge"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-24 text-center glass rounded-3xl border border-dashed border-slate-200 flex flex-col items-center">
                 <div className="h-16 w-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6">
                    <ShieldCheck className="h-8 w-8 text-emerald-500" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white">System Nominal</h3>
                 <p className="text-sm text-slate-400 max-w-xs mt-2 font-medium">All regional nodes report healthy status. No active incidents detected.</p>
              </div>
            )}

            {/* Acknowledged Feed */}
            {acknowledgedAlerts.length > 0 && (
               <div className="space-y-4 pt-10">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4" /> Acknowledged Sequence
                  </h3>
                  <div className="space-y-3">
                    {acknowledgedAlerts.slice(0, 5).map((alert: any) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl group transition-all hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                           <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 opacity-40" />
                           <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{alert.title}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{alert.message.substring(0, 60)}...</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Admin Actioned</p>
                           <p className="text-[10px] text-slate-300 font-medium mt-1">{new Date(alert.triggeredAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>

          {/* Security Protocols Sidebar */}
          <div className="lg:col-span-3 space-y-8">
            <Card className="border-none shadow-sm dark:bg-slate-900/50 overflow-hidden">
               <div className="h-1.5 premium-gradient w-full" />
               <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" /> Active Protocols
                  </CardTitle>
                  <CardDescription>Automated security monitoring threshold definitions</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                  {[
                    { label: "Discrepancy Trigger", icon: Activity, desc: "Fires when reconciliation delta exceeds $10 or 5.0%" },
                    { label: "Liquidity Floor", icon: TrendingDown, desc: "Fires when provider float hits 20% of mandated minimum" },
                    { label: "Risk Matrix Scoring", icon: ShieldAlert, desc: "Fires when anomaly engine risk score > 0.72" },
                    { label: "Sync Latency", icon: Clock, desc: "Fires when node sync exceeds 180s timeout" },
                  ].map((protocol, i) => (
                     <div key={i} className="flex gap-4 group cursor-pointer">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                           <protocol.icon className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-1">
                           <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{protocol.label}</p>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium">{protocol.desc}</p>
                        </div>
                     </div>
                  ))}
                  
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                     <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-primary flex items-center justify-between group">
                        Update Policy Matrix <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                     </Button>
                  </div>
               </CardContent>
            </Card>

            <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute -top-10 -right-10 opacity-5">
                  <ExternalLink className="h-48 w-48" />
               </div>
               <div className="relative z-10 space-y-5">
                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
                     <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Encrypted Audit Trail</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2 font-medium">
                       All acknowledgments and scan results are signed and stored in the immutable auditing cluster for regulatory compliance.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full h-11 rounded-xl bg-transparent border-slate-700 text-white hover:bg-slate-800 hover:border-slate-600 transition-all font-bold text-xs uppercase tracking-widest">
                     Export Full Event Log
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function History({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
