import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const floatRequests = trpc.nodes.listFloatRequests.useQuery(
    { status: "pending" },
    { refetchInterval: 10000 } // Auto-sync pending requests every 10s
  );
  const employees = trpc.nodes.listEmployees.useQuery(
    undefined, 
    { refetchInterval: 30000 } // Sync team list every 30s
  );
  const alerts = trpc.alerts.getHistory.useQuery(
    { limit: 5 },
    { refetchInterval: 15000 } // Sync alerts every 15s
  );
  const payoutQuery = trpc.commissions.getSupervisorPayout.useQuery(
    undefined,
    { refetchInterval: 60000 } // Sync earnings every 1min
  );

  const pendingCount = floatRequests.data?.length || 0;
  const totalEmployees = employees.data?.length || 0;
  const activeAlerts = alerts.data?.filter((a: any) => a.severity === "critical").length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Supervisor</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Operations Overview
            </h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-400">Network Nodes</p>
                <p className="text-sm font-semibold text-emerald-600">{totalEmployees}</p>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-slate-600" />
              <div>
                <p className="text-xs text-gray-400">Cloud Sync</p>
                <p className="text-sm font-semibold text-blue-600">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { label: "Pending Approvals", val: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", path: "/supervisor/requests" },
             { label: "Team Members", val: totalEmployees, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", path: "/supervisor/team" },
             { label: "Active Alerts", val: activeAlerts, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", path: "/supervisor/intel" },
             { label: "Commission Pool", val: payoutQuery.data ? `$${payoutQuery.data.dailyPool.toFixed(2)}` : "$0.00", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", path: "/supervisor/intel" },
           ].map((stat) => (
             <Card
               key={stat.label}
               onClick={() => setLocation(stat.path)}
               className="border border-gray-200 dark:border-slate-700 shadow-sm hover:border-blue-300 cursor-pointer transition-colors"
             >
               <CardContent className="p-5">
                 <div className="flex items-start justify-between mb-4">
                   <div className={`p-2 rounded-lg ${stat.bg}`}>
                     <stat.icon className={`h-5 w-5 ${stat.color}`} />
                   </div>
                   <ArrowUpRight className="h-4 w-4 text-gray-300" />
                 </div>
                 <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.val}</div>
                 <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
               </CardContent>
             </Card>
           ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
           {/* Primary section */}
           <div className="lg:col-span-8 space-y-6">
              <div className="p-8 bg-gray-900 rounded-xl text-white">
                 <div className="max-w-xl">
                    <Badge className="bg-blue-600 text-white border-none font-medium text-xs px-2.5 py-0.5 mb-4">Summary</Badge>
                    <h2 className="text-2xl font-bold mb-3">Regional Performance</h2>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6">
                       No major issues detected. Network stability at 98.4% uptime across all locations.
                    </p>
                    <div className="flex items-center gap-4">
                       <Button 
                         onClick={() => setLocation("/supervisor/requests")}
                         className="h-10 px-5 rounded-lg bg-white text-gray-900 hover:bg-gray-100 font-medium text-sm"
                       >
                          Review Queue <ArrowRight className="ml-2 h-4 w-4" />
                       </Button>
                    </div>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                 <button 
                   onClick={() => setLocation("/supervisor/team")}
                   className="p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-left group hover:border-blue-300 transition-colors"
                 >
                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600">
                       <Users className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Team Management</h3>
                    <p className="text-xs text-gray-500 mb-4">Onboard and manage your agents</p>
                    <div className="flex items-center text-xs font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                       Manage <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </div>
                 </button>
                 
                 <button 
                   onClick={() => setLocation("/supervisor/intel")}
                   className="p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-left group hover:border-red-300 transition-colors"
                 >
                    <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-all text-red-600">
                       <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Security & Alerts</h3>
                    <p className="text-xs text-gray-500 mb-4">Monitor anomalies and system health</p>
                    <div className="flex items-center text-xs font-medium text-red-600 group-hover:translate-x-1 transition-transform">
                       View <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </div>
                 </button>
              </div>
           </div>

           {/* Sidebar */}
           <div className="lg:col-span-4 space-y-6">
              <div className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Alerts</h3>
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                 </div>
                 <div className="space-y-2">
                    {alerts.data?.slice(0, 3).map((alert: any) => (
                      <div key={alert.id} className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg flex items-start gap-3">
                         <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                         <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{alert.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                         </div>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      onClick={() => setLocation("/supervisor/intel")}
                      className="w-full h-9 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 font-medium text-xs hover:bg-gray-100"
                    >
                       View All Alerts
                    </Button>
                 </div>
              </div>

              <div className="p-6 bg-emerald-600 rounded-xl text-white">
                 <div className="flex items-center justify-between mb-3">
                    <Zap className="h-5 w-5 text-white/60" />
                    <span className="text-xs font-medium text-white/60">Today's Earnings</span>
                 </div>
                 <p className="text-xs text-white/60 mb-1">Commission Share</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                       {payoutQuery.data ? `$${payoutQuery.data.dailyPool.toFixed(2)}` : "$0.00"}
                    </span>
                    <span className="text-xs font-medium opacity-50">USD</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
