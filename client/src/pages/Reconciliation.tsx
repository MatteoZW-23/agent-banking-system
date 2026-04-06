import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Search, 
  Calendar, 
  ShieldCheck, 
  ArrowUpRight, 
  Zap, 
  ClipboardCheck,
  AlertTriangle,
  Activity
} from "lucide-react";

export default function Reconciliation() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);

  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const reconcileProviderMutation = trpc.reconciliation.reconcileProvider.useMutation();
  const reconcileAllMutation = trpc.reconciliation.reconcileAll.useMutation();

  const handleReconcileProvider = async () => {
    if (!selectedProvider) return;
    const date = new Date(selectedDate);
    await reconcileProviderMutation.mutateAsync({ providerId: selectedProvider, date });
  };

  const handleReconcileAll = async () => {
    const date = new Date(selectedDate);
    await reconcileAllMutation.mutateAsync({ date });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "matched":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> MATCHED</Badge>;
      case "mismatch":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 font-bold"><AlertTriangle className="w-3 h-3 mr-1" /> MISMATCH</Badge>;
      case "investigating":
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800 font-bold"><Activity className="w-3 h-3 mr-1" /> INVESTIGATING</Badge>;
      default:
        return <Badge variant="secondary" className="font-bold">{status.toUpperCase()}</Badge>;
    }
  };

  if (!isAuthenticated) return null;

  const latestReport = reconcileProviderMutation.data;
  const allReports = reconcileAllMutation.data;

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reconciliation Hub
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Synchronize internal ledger records with external provider statements.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Button 
                onClick={handleReconcileAll}
                disabled={reconcileAllMutation.isPending}
                variant="outline" 
                className="h-10 rounded-xl px-4 border-slate-200 font-bold text-xs uppercase tracking-widest text-slate-600"
             >
               {reconcileAllMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
               Reconcile Global Cluster
             </Button>
          </div>
        </div>

        {/* Global Controls bar */}
        <div className="grid gap-4 md:grid-cols-4 p-4 glass rounded-2xl border border-slate-200 dark:border-slate-800">
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Audit Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
             </div>

             <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Targeted Provider
                </label>
                <select
                  value={selectedProvider || ""}
                  onChange={(e) => setSelectedProvider(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-sm font-semibold"
                >
                  <option value="">Select an active gateway...</option>
                  {providersQuery.data?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
             </div>

             <div className="flex items-end pb-0.5">
                <Button 
                  onClick={handleReconcileProvider}
                  disabled={!selectedProvider || reconcileProviderMutation.isPending}
                  className="w-full h-10 rounded-xl premium-gradient text-white font-bold shadow-lg shadow-primary/20"
                >
                  {reconcileProviderMutation.isPending ? "Processing..." : "Initiate Sync"}
                </Button>
             </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Active Reconciliation Report */}
          <div className="lg:col-span-2 space-y-8">
            {latestReport ? (
              <Card className="border-none shadow-sm dark:bg-slate-900/50 overflow-hidden animate-fade-in relative">
                <div className="h-1.5 premium-gradient w-full" />
                <CardHeader className="flex flex-row items-center justify-between pt-8 pb-6 border-b border-slate-50 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <CardTitle className="text-2xl">{latestReport.providerName}</CardTitle>
                       {getStatusBadge(latestReport.status)}
                    </div>
                    <CardDescription className="font-mono text-[10px] uppercase tracking-widest font-bold">Audit Period: {latestReport.date}</CardDescription>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                     <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-10">
                  {/* Summary Metrics */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Expected</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        ${latestReport.totalExpected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Actual</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        ${latestReport.totalActual.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Delta</p>
                      <p className={`text-xl font-black ${latestReport.discrepancy < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                        ${latestReport.discrepancy.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Error Margin</p>
                      <p className={`text-xl font-black ${Math.abs(latestReport.discrepancyPercentage) > 5 ? "text-rose-500" : "text-emerald-500"}`}>
                        {latestReport.discrepancyPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Flow Visualization */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col items-center text-center group transition-all hover:bg-emerald-500/10">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-3" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Matched</p>
                      <p className="text-4xl font-black text-emerald-600">{latestReport.matchedCount}</p>
                    </div>
                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col items-center text-center group transition-all hover:bg-amber-500/10">
                      <AlertTriangle className="h-8 w-8 text-amber-500 mb-3" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Mismatch</p>
                      <p className="text-4xl font-black text-amber-500">{latestReport.mismatchCount}</p>
                    </div>
                    <div className="p-6 bg-slate-100/40 border border-slate-200/40 rounded-2xl flex flex-col items-center text-center group transition-all hover:bg-slate-100/60">
                      <RefreshCw className="h-8 w-8 text-slate-400 mb-3" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Unprocessed</p>
                      <p className="text-4xl font-black text-slate-400">{latestReport.unmatchedCount}</p>
                    </div>
                  </div>

                  {/* Mismatches Detail */}
                  {latestReport.mismatches.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-500" /> Discrepancy Registry
                      </h3>
                      <div className="space-y-3 pb-4">
                        {latestReport.mismatches.map((mismatch: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-rose-200 transition-all group">
                            <div className="space-y-1">
                               <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight group-hover:text-primary transition-colors">REF: {mismatch.reference}</p>
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                 Expected <span className="text-emerald-500">${mismatch.expected.toFixed(2)}</span> vs. Actual <span className="text-amber-500">${mismatch.actual.toFixed(2)}</span>
                               </p>
                            </div>
                            <Badge className="bg-rose-500/10 text-rose-500 border-none px-3 py-1 font-black text-xs">
                              -${mismatch.difference.toFixed(2)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 bg-white dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 group hover:border-primary/40 transition-all cursor-pointer" onClick={() => setShowForm?.(true)}>
                 <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    <ClipboardCheck className="h-10 w-10 text-slate-300" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">System Idle</h3>
                 <p className="text-sm font-medium text-slate-400 max-w-xs mt-2 text-center leading-relaxed">Initiate a sync operation to identify transaction gaps across the regional cluster.</p>
                 <Button variant="ghost" className="mt-6 text-xs font-bold uppercase tracking-widest text-primary">Begin Operations</Button>
              </div>
            )}
          </div>

          {/* Global Summary Logs */}
          <div className="space-y-8">
            <Card className="border-none shadow-sm dark:bg-slate-900/50 flex flex-col">
              <CardHeader className="pb-6 border-b border-slate-50 dark:border-slate-800">
                <CardTitle className="text-xl flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-slate-400" /> Cluster Summary</CardTitle>
                <CardDescription>Aggregate health of all active nodes</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {(allReports && allReports.length > 0) ? (
                  <div className="space-y-4">
                    {allReports.map((report: any) => (
                      <div
                        key={report.providerId}
                        className="flex flex-col gap-4 p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl group transition-all hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${report.status === 'matched' ? 'bg-emerald-500/10 font-bold' : 'bg-amber-500/10 font-bold'}`}>
                                 {report.status === 'matched' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                              </div>
                              <div className="space-y-0.5">
                                 <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{report.providerName}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Sync: ${report.totalActual.toLocaleString()}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={`text-sm font-black ${report.discrepancy === 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                {report.discrepancy === 0 ? "STABLE" : `-$${report.discrepancy.toLocaleString()}`}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                {report.discrepancyPercentage.toFixed(2)}% DELTA
                              </p>
                           </div>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                           <div 
                              className={`h-full transition-all duration-1000 ${report.status === 'matched' ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                              style={{ width: `${Math.max(10, 100 - Math.abs(report.discrepancyPercentage))}%` }} 
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center flex flex-col items-center">
                    <Activity className="h-10 w-10 text-slate-200 mb-4" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-[150px]">Waiting for global sequence initiation</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Hint */}
            <div className="p-8 rounded-3xl premium-gradient text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="h-5 w-5" />
                     <h4 className="text-lg font-bold">Auditing Active</h4>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed font-medium">
                     The system automatically flags any transaction mismatch exceeding <span className="text-white font-bold">$5.00</span> for human investigation in the security portal.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

