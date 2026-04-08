import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ShieldAlert, Activity, AlertTriangle, Zap, Fingerprint, Radar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function SupervisorIntel() {
  const alerts = trpc.alerts.getHistory.useQuery({ limit: 20 });

  return (
    <DashboardLayout>
      <div className="space-y-12">
        <div className="flex items-center justify-between pb-8 border-b border-slate-100 dark:border-white/5">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic font-outfit">
              Security <span className="text-primary not-italic">Intelligence</span>
            </h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-3">Regional Network Health & Tactical Alerts</p>
          </div>
          <div className="h-20 w-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
             <Radar className="h-10 w-10 text-rose-500 animate-pulse" />
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center gap-4 px-4 sticky top-0 py-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-10 rounded-2xl">
                 <ShieldAlert className="h-5 w-5 text-rose-500" />
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Tactical Feed</h2>
                 <Badge className="bg-rose-500 text-white border-none text-[9px] font-black px-3 py-1 rounded-lg uppercase ml-auto">Live Monitoring</Badge>
              </div>

              <div className="space-y-4">
                 {alerts.data?.map((alert: any) => (
                   <div key={alert.id} className="p-8 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group flex items-start gap-8">
                      <div className={`mt-2 h-4 w-4 rounded-full flex-shrink-0 ${
                        alert.severity === "critical" ? "bg-rose-500 animate-ping" : "bg-amber-500"
                      }`} />
                      
                      <div className="flex-1">
                         <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Alert_Ref: {alert.id.toString().padStart(5, '0')}</span>
                            <span className="text-[9px] font-mono font-bold text-slate-300">{new Date(alert.timestamp).toLocaleString()}</span>
                         </div>
                         <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3 italic font-outfit">{alert.title}</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                           {alert.message}
                         </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                         <Badge variant="outline" className={`border-none px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                           alert.severity === "critical" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                         }`}>
                           {alert.severity}
                         </Badge>
                      </div>
                   </div>
                 ))}
                 {(!alerts.data || alerts.data.length === 0) && (
                    <div className="p-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                       <Fingerprint className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                       <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No Intelligence Hits Found</p>
                    </div>
                 )}
              </div>
           </div>

           <div className="lg:col-span-4 space-y-10">
              <Card className="rounded-[3rem] bg-slate-900 p-2 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:rotate-12 transition-transform">
                    <Zap className="h-32 w-32 text-primary" />
                 </div>
                 <CardContent className="p-10 relative z-10">
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-8 italic">Network Vitals</h3>
                    <div className="space-y-8">
                       {[
                         { label: "Alert Density", val: "Low-Risk", color: "text-emerald-500" },
                         { label: "Signal Strength", val: "98%", color: "text-primary" },
                         { label: "Node Coverage", val: "Global", color: "text-white" },
                       ].map(vital => (
                         <div key={vital.label} className="flex items-center justify-between border-b border-white/5 pb-6">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{vital.label}</span>
                            <span className={`text-lg font-black italic font-outfit ${vital.color} uppercase tracking-tighter`}>{vital.val}</span>
                         </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>

              <div className="p-10 bg-white dark:bg-slate-900/50 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl">
                 <div className="flex items-center gap-4 mb-8">
                    <Activity className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Regional AI Radar</h3>
                 </div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
                   Analyzing traffic patterns across your regional stalling sites. AI indicates no significant anomalies in the current session.
                 </p>
                 <div className="mt-8 space-y-4">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full w-2/3 bg-emerald-500 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pattern Validity</span>
                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">High Confidence</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
