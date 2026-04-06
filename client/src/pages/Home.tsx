import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Search,
  FileText,
  MousePointer2,
  ShieldCheck,
  ShieldCheck as ShieldCheckIcon,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Smartphone,
  Banknote
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

function FloatRequestAction({ request, onProcessed }: { request: any, onProcessed: () => void }) {
  const [ref, setRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const processMutation = trpc.nodes.processRequest.useMutation();
  const providersQuery = trpc.providers.list.useQuery();
  const employeesQuery = trpc.nodes.listEmployees.useQuery();

  const handleAction = async (status: "transferred" | "declined") => {
    if (status === "transferred" && !ref) {
       toast.error("Enter transaction reference (Bank/MoMo Ref)");
       return;
    }
    
    setIsProcessing(true);
    try {
       await processMutation.mutateAsync({
          id: request.id,
          status,
          transactionReference: ref,
          adminNotes: status === "transferred" ? "Approved and transferred" : "Declined by admin"
       });
       toast.success(`Request ${status} successfully`);
       onProcessed();
    } catch (err) {
       toast.error("Action failed");
    } finally {
       setIsProcessing(false);
    }
  };

  const employee = employeesQuery.data?.find(e => e.id === request.employeeId);
  const provider = providersQuery.data?.find(p => p.id === request.providerId);

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4 hover:border-primary/20 transition-all shadow-sm">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                {employee?.name?.[0] || "A"}
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-black text-slate-800 dark:text-white font-outfit">{employee?.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{provider?.name} Line</span>
             </div>
          </div>
          <span className="text-lg font-black text-slate-900 dark:text-white font-outfit">${request.amount}</span>
       </div>
       
       {request.workerNotes && (
          <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
             "{request.workerNotes}"
          </p>
       )}

       <div className="space-y-3 pt-2">
          <input 
            placeholder="Transfer Reference (Bank/MoMo Auth ID)"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
          />
          <div className="flex gap-2">
             <Button 
               onClick={() => handleAction("transferred")}
               disabled={isProcessing}
               className="flex-1 h-10 rounded-xl premium-gradient text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10"
             >
                {isProcessing ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Transfer Float"}
             </Button>
             <Button 
               onClick={() => handleAction("declined")}
               disabled={isProcessing}
               variant="outline"
               className="h-10 px-4 rounded-xl border-slate-100 dark:border-slate-800 text-rose-500 hover:bg-rose-50 transition-colors"
             >
                <XCircle className="h-4 w-4" />
             </Button>
          </div>
       </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedDate] = useState(new Date());
  const [_, setLocation] = useLocation();

  // Fetch dashboard data
  const providersQuery = trpc.providers.list.useQuery(undefined, { enabled: isAuthenticated });
  const floatQuery = trpc.floats.getTotalBalance.useQuery(undefined, { enabled: isAuthenticated });
  const alertsQuery = trpc.alerts.getHistory.useQuery({ limit: 5 }, { enabled: isAuthenticated });
  const dailySummaryQuery = trpc.reports.dailySummary.useQuery({ date: selectedDate }, { enabled: isAuthenticated });
  
  const floatRequestsQuery = trpc.nodes.listFloatRequests.useQuery(
    { status: "pending" }, 
    { enabled: isAuthenticated, refetchInterval: 5000 }
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) return <DashboardLayout />;

  const stats = [
    {
      title: "Total Float Balance",
      value: `$${floatQuery.data ? parseFloat(floatQuery.data).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}`,
      description: "Across all provider accounts",
      icon: DollarSign,
      trend: "+2.5%",
      trendUp: true,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Active Providers",
      value: providersQuery.data?.length || 0,
      description: "Connected and real-time syncing",
      icon: Zap,
      trend: "Stable",
      trendUp: true,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      title: "Daily Transactions",
      value: dailySummaryQuery.data?.transactionCount || 0,
      description: `$${dailySummaryQuery.data?.totalAmount.toLocaleString() || "0.00"} processed today`,
      icon: TrendingUp,
      trend: "+12%",
      trendUp: true,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Pending Transfers",
      value: floatRequestsQuery.data?.length || 0,
      description: "Capital requests from workers",
      icon: Banknote,
      trend: "+3",
      trendUp: true,
      color: "text-rose-500",
      bg: "bg-rose-500/10"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Header Section */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-outfit uppercase">
              Executive Overview
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium font-inter">
              Welcome back, <span className="text-primary font-bold">{user?.name || "Admin"}</span>. Monitoring 200+ agents.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm font-black font-outfit uppercase tracking-wider">
               {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
             </div>
             <Button className="premium-gradient text-white h-10 px-6 rounded-xl shadow-lg hover:shadow-primary/20 transition-all font-black text-xs uppercase tracking-widest">
               Refresh Hub
             </Button>
          </div>
        </div>

        {/* Global Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="hover-lift border-none shadow-sm dark:bg-slate-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${stat.trendUp ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'}`}>
                  {stat.trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {stat.trend}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-outfit">
                  {stat.value}
                </div>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-widest">
                  {stat.title}
                </p>
                <p className="text-[10px] text-slate-400 mt-3 truncate font-medium">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-12">
          {/* Float Requests Panel */}
          <div className="lg:col-span-4 space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black font-outfit uppercase tracking-tight">Float Liquidity Requests</h3>
                <Badge className="bg-rose-500 text-white border-none font-black text-[10px] rounded-lg">ACTION REQUIRED</Badge>
             </div>
             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {floatRequestsQuery.data?.filter((r:any) => r.status === 'pending').map((request: any) => (
                   <FloatRequestAction 
                     key={request.id} 
                     request={request} 
                     onProcessed={() => floatRequestsQuery.refetch()} 
                   />
                ))}
                {(!floatRequestsQuery.data || floatRequestsQuery.data.filter((r:any) => r.status === 'pending').length === 0) && (
                   <div className="p-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                      <CheckCircle className="h-10 w-10 text-emerald-500 mb-4 opacity-20" />
                      <p className="text-sm font-bold text-slate-300">All liquidity requests are processed.</p>
                   </div>
                )}
             </div>
          </div>

          {/* Operation Telemetry & Alerts */}
          <Card className="lg:col-span-5 border-none shadow-sm dark:bg-slate-900/50 flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-outfit uppercase font-black">Operation Telemetry</CardTitle>
              <CardDescription className="font-inter">Real-time system health and discrepancy alerts</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {alertsQuery.isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                </div>
              ) : (alertsQuery.data && alertsQuery.data.length > 0) ? (
                <div className="space-y-4">
                  {alertsQuery.data.map((alert: any) => (
                    <div
                      key={alert.id}
                      className="group flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="flex gap-4">
                        <div className={`mt-1 h-2 w-2 rounded-full ring-4 ${
                           alert.severity === "critical" ? "bg-rose-500 ring-rose-500/20" : 
                           alert.severity === "high" ? "bg-orange-500 ring-orange-500/20" : 
                           "bg-amber-500 ring-amber-500/20"
                        }`} />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{alert.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">{alert.message}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                             {new Date(alert.triggeredAt).toLocaleTimeString()} • SYSTEM AUTO-GEN
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShieldCheckIcon className="h-12 w-12 text-slate-200 dark:text-slate-800 mb-4" />
                  <p className="text-sm font-medium text-slate-500">System is clean. No active alerts.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intelligent Quick Control */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-lg font-black font-outfit uppercase tracking-widest pl-2">Quick Control</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Run Full Reconcile", icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50/50", path: "/reconciliation" },
                { label: "Worker Operations", icon: Zap, color: "text-indigo-500", bg: "bg-indigo-50/50", path: "/nodes" },
                { label: "Audit Total Capital", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50/50", path: "/floats" },
                { label: "Provider Health", icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50/50", path: "/provider-config" },
              ].map((action, i) => (
                <button
                   key={i}
                   onClick={() => setLocation(action.path)}
                   className="flex items-center justify-between w-full p-5 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-primary/40 hover:shadow-xl transition-all active:scale-[0.98] group shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-2xl ${action.bg} dark:bg-slate-800 border border-slate-100 dark:border-slate-800`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors uppercase tracking-widest">
                      {action.label}
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
            
            {/* Liquidity Overview Mini-Card */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <DollarSign className="h-32 w-32" />
               </div>
               <div className="relative z-10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] italic">Network Liquidity Hub</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                     Your capital is distributed across 200+ hardware lines. Use the Float panel to manage instant fund transfers.
                  </p>
                  <div className="flex items-center gap-4 pt-4">
                     <div className="flex flex-col">
                        <span className="text-xl font-black font-outfit">$4.2K</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Pending</span>
                     </div>
                     <div className="h-8 w-px bg-white/10" />
                     <div className="flex flex-col">
                        <span className="text-xl font-black font-outfit">12</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Hubs</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
