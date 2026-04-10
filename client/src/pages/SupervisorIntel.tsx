import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ShieldAlert, Activity, AlertTriangle, Zap, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";

export default function SupervisorIntel() {
  const alerts = trpc.alerts.getHistory.useQuery({ limit: 20 });

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Security & Alerts"
          subtitle="Monitor regional network health and active alerts."
          category="Supervisor"
        />

        <div className="grid lg:grid-cols-12 gap-6">
           <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                 <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                   <ShieldAlert className="h-4 w-4 text-red-500" /> Alert Feed
                 </h2>
                 <Badge className="bg-red-100 text-red-700 border-none font-medium text-xs">
                   Live
                 </Badge>
              </div>

              <div className="space-y-3">
                 {alerts.data?.map((alert: any) => (
                   <div key={alert.id} className="p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-300 transition-colors flex items-start gap-4">
                      <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                        alert.severity === "critical" ? "bg-red-500" : "bg-amber-500"
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-gray-400">#{alert.id.toString().padStart(5, '0')}</span>
                            <span className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleString()}</span>
                         </div>
                         <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{alert.title}</h3>
                         <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                           {alert.message}
                         </p>
                      </div>

                      <Badge variant="outline" className={`shrink-0 font-medium text-xs ${
                        alert.severity === "critical" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {alert.severity}
                      </Badge>
                   </div>
                 ))}
                 {(!alerts.data || alerts.data.length === 0) && (
                    <div className="p-16 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                       <ShieldCheck className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                       <p className="text-sm text-gray-400">No alerts found</p>
                    </div>
                 )}
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="p-6 bg-gray-900 rounded-xl text-white">
                 <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-5">System Health</h3>
                 <div className="space-y-4">
                    {[
                      { label: "Risk Level", val: "Low", color: "text-emerald-400" },
                      { label: "Availability", val: "98%", color: "text-blue-400" },
                      { label: "Coverage", val: "Regional", color: "text-white" },
                    ].map(vital => (
                      <div key={vital.label} className="flex items-center justify-between border-b border-gray-700 pb-3">
                         <span className="text-xs text-gray-500">{vital.label}</span>
                         <span className={`text-sm font-semibold ${vital.color}`}>{vital.val}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
                 <CardHeader>
                    <div className="flex items-center gap-2">
                       <Activity className="h-4 w-4 text-blue-600" />
                       <CardTitle className="text-base">Analysis</CardTitle>
                    </div>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Monitoring traffic patterns across your regional sites. No significant anomalies detected in the current session.
                    </p>
                    <div className="space-y-2">
                       <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-emerald-500 rounded-full" />
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Confidence</span>
                          <span className="text-xs font-medium text-emerald-600">High</span>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
