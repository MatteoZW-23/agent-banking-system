import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Wallet,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Zap,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const floatRequests = trpc.nodes.listFloatRequests.useQuery({ status: "pending" });
  const employees = trpc.nodes.listEmployees.useQuery();
  const alerts = trpc.alerts.getHistory.useQuery({ limit: 5 });
  const payoutQuery = trpc.commissions.getSupervisorPayout.useQuery();

  const pendingCount = floatRequests.data?.length || 0;
  const totalEmployees = employees.data?.length || 0;
  const activeAlerts = alerts.data?.filter((a: any) => a.severity === "critical").length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-16">
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-4 mb-6">
               <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Operations Active</span>
               </div>
            </div>
            <h1 className="text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic font-outfit leading-none">
              Operations <span className="text-primary not-italic">Hub</span>
            </h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-6 italic">Regional Registry: {user?.name}</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="p-6 bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl flex items-center gap-6">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">System Latency</p>
                   <p className="text-lg font-black text-emerald-500 font-outfit italic tracking-tighter mt-1">12ms (Optimal)</p>
                </div>
                <div className="h-10 w-px bg-slate-100 dark:bg-white/10" />
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Network Load</p>
                   <p className="text-lg font-black text-primary font-outfit italic tracking-tighter mt-1">Low Activity</p>
                </div>
             </div>
          </div>
        </div>

        {/* Tactical Stats Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { label: "Verification Required", val: pendingCount, icon: Clock, color: "text-amber-500", path: "/supervisor/requests" },
             { label: "Team Personnel", val: totalEmployees, icon: Users, color: "text-primary", path: "/supervisor/team" },
             { label: "Critical Anomalies", val: activeAlerts, icon: ShieldAlert, color: "text-rose-500", path: "/supervisor/intel" },
             { label: "Override Pool", val: payoutQuery.data ? `$${payoutQuery.data.dailyPool.toFixed(2)}` : "$0.00", icon: TrendingUp, color: "text-emerald-500", path: "/supervisor/intel" },
           ].map((stat) => (
             <div 
               key={stat.label}
               onClick={() => setLocation(stat.path)}
               className="group p-10 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/40 dark:shadow-none rounded-[3rem] border border-slate-100 dark:border-white/5 hover:scale-[1.02] cursor-pointer transition-all"
             >
                <div className="flex items-start justify-between mb-10">
                   <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                      <stat.icon className={`h-7 w-7 ${stat.color} group-hover:scale-110 transition-transform`} />
                   </div>
                   <ArrowUpRight className="h-5 w-5 text-slate-200 group-hover:text-primary transition-colors" />
                </div>
                <div>
                   <span className="text-4xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter">{stat.val}</span>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 italic">{stat.label}</p>
                </div>
             </div>
           ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
           {/* Primary Action Hub */}
           <div className="lg:col-span-8 space-y-10">
              <div className="p-12 bg-slate-900 rounded-[4rem] text-white relative overflow-hidden group shadow-4xl">
                 <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:scale-110 transition-transform">
                    <Activity className="h-48 w-48 text-primary" />
                 </div>
                 <div className="relative z-10 max-w-xl">
                    <Badge className="bg-primary text-white border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl mb-10">Regional Intelligence</Badge>
                    <h2 className="text-5xl font-black italic tracking-tighter leading-tight font-outfit mb-8 uppercase">Managing Your Regional Efficiency Hub</h2>
                    <p className="text-lg text-slate-400 font-medium leading-relaxed mb-12 italic">
                       No major liquidity bottlenecks detected in the last session. Network stability indicates a 98.4% uptime across all stall locations.
                    </p>
                    <div className="flex items-center gap-6">
                       <Button 
                         onClick={() => setLocation("/supervisor/requests")}
                         className="h-16 px-10 rounded-2xl bg-white text-slate-950 font-black uppercase text-[11px] tracking-widest italic hover:bg-slate-50"
                       >
                          Open Queue <ArrowRight className="ml-4 h-5 w-5" />
                       </Button>
                       <div className="flex -space-x-3">
                          {[1,2,3,4].map(i => (
                             <div key={i} className="h-10 w-10 border-4 border-slate-900 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">#{i}</div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                 <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-xl group hover:border-primary/20 transition-all cursor-pointer" onClick={() => setLocation("/supervisor/team")}>
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all mb-8">
                       <Users className="h-7 w-7" />
                    </div>
                    <h3 className="text-2xl font-black font-outfit italic tracking-tighter uppercase mb-2">Team Governance</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 italic">Authorized Onboarding & Management</p>
                    <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                       Manage Personnel <ChevronRight className="ml-2 h-4 w-4" />
                    </div>
                 </div>
                 
                 <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-xl group hover:border-rose-500/20 transition-all cursor-pointer" onClick={() => setLocation("/supervisor/intel")}>
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all mb-8">
                       <ShieldCheck className="h-7 w-7" />
                    </div>
                    <h3 className="text-2xl font-black font-outfit italic tracking-tighter uppercase mb-2">Tactical Radar</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 italic">Anomaly Detection & Signal Health</p>
                    <div className="flex items-center text-[10px] font-black text-rose-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                       Security Lab <ChevronRight className="ml-2 h-4 w-4" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Tactical Alerts Shortcut */}
           <div className="lg:col-span-4 space-y-10">
              <div className="space-y-6">
                 <div className="flex items-center justify-between px-4">
                    <h3 className="text-xl font-black font-outfit italic tracking-tighter uppercase">Flash Alerts</h3>
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                 </div>
                 <div className="space-y-4">
                    {alerts.data?.slice(0, 3).map((alert: any) => (
                      <div key={alert.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-start gap-5">
                         <div className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${alert.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                         <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic leading-snug">{alert.title}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                         </div>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      onClick={() => setLocation("/supervisor/intel")}
                      className="w-full h-14 rounded-2xl bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest italic hover:bg-slate-100"
                    >
                       View Intel Analytics
                    </Button>
                 </div>
              </div>

              <div className="p-10 bg-emerald-500 rounded-[3rem] text-white shadow-2xl shadow-emerald-500/20 group hover:scale-[1.02] transition-transform">
                 <div className="flex items-center justify-between mb-8">
                    <Zap className="h-8 w-8 text-white/50 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest italic opacity-60">Session Earnings</span>
                 </div>
                 <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">Live Payout Share</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black font-outfit italic tracking-tighter">
                       {payoutQuery.data ? `$${payoutQuery.data.dailyPool.toFixed(2)}` : "$0.00"}
                    </span>
                    <span className="text-xs font-bold uppercase opacity-50">USD</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
