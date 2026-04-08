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
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpDown, 
  Download, 
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  SearchCode,
  ShieldCheck,
  ArrowUpRight
} from "lucide-react";

export default function Transactions() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [location, setLocation] = useLocation();

  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const transactionsQuery = trpc.transactions.listByDateRange.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: isAuthenticated }
  );

  const flaggedQuery = trpc.transactions.flaggedTransactions.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const getStatusBadge = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> COMPLETED</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 font-bold"><Clock className="w-3 h-3 mr-1" /> PENDING</Badge>;
      case "failed":
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800 font-bold"><XCircle className="w-3 h-3 mr-1" /> FAILED</Badge>;
      case "reversed":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800 font-bold"><RefreshCw className="w-3 h-3 mr-1" /> REVERSED</Badge>;
      default:
        return <Badge variant="secondary">{status.toUpperCase()}</Badge>;
    }
  };

  const getReconBadge = (status: string | null) => {
     if (status === 'matched') return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">MATCHED</Badge>;
     if (status === 'mismatch') return <Badge variant="outline" className="text-rose-500 border-rose-500/30">MISMATCH</Badge>;
     return <Badge variant="outline" className="text-slate-400">{status?.toUpperCase() || 'UNRECONCILED'}</Badge>;
  };

  const getTypeLabel = (type: string | null) => {
    if (!type) return "UNKNOWN";
    return type.replace(/_/g, " ").toUpperCase();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Header with Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Transactions
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Analyze and audit multi-provider transaction flows with precision.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  placeholder="Search reference..." 
                  className="pl-10 pr-4 h-10 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                />
             </div>
             <Button variant="outline" className="h-10 rounded-xl px-4 flex gap-2 font-bold text-xs uppercase tracking-widest border-slate-200">
               <Download className="w-4 h-4" /> Export
             </Button>
          </div>
        </div>

        {/* Global Filters bar */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-12 p-3.5 glass rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20">
             <div className="space-y-2 md:col-span-3">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1.5 flex items-center gap-2 opacity-70">
                  <Filter className="w-3.5 h-3.5 text-primary" /> Filter by Provider
                </label>
                <select
                  value={selectedProvider || ""}
                  onChange={(e) => setSelectedProvider(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:outline-none text-sm font-bold shadow-sm transition-all"
                >
                  <option value="">All Operational Gateways</option>
                  {providersQuery.data?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
             </div>

             <div className="space-y-2 md:col-span-5 relative">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1.5 flex items-center gap-2 opacity-70">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Audit Date Selection
                </label>
                <div className="flex items-center gap-3">
                   <div className="relative flex-1">
                      <input
                        type="date"
                        value={dateRange.start.toISOString().split("T")[0]}
                        onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                        className="w-full h-11 pl-4 pr-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black shadow-sm focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                   </div>
                   <div className="text-slate-300 font-black">—</div>
                   <div className="relative flex-1">
                      <input
                        type="date"
                        value={dateRange.end.toISOString().split("T")[0]}
                        onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                        className="w-full h-11 pl-4 pr-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black shadow-sm focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                   </div>
                </div>
             </div>

             <div className="flex items-end pb-0.5 md:col-span-2">
                <Button className="w-full h-11 rounded-2xl premium-gradient text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  Apply Filter
                </Button>
             </div>

             <div className="flex items-end pb-0.5 md:col-span-2">
                <Button variant="ghost" className="w-full h-11 rounded-2xl text-slate-400 font-bold text-[10px] uppercase tracking-tighter hover:bg-slate-50 transition-colors">
                  Reset Views
                </Button>
             </div>
        </div>

        {/* Ledger Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Ledger Table */}
          <Card className="lg:col-span-2 border-none shadow-sm dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
               <div>
                 <CardTitle className="text-xl">Transaction Ledger</CardTitle>
                 <CardDescription>Audited records of funds movement</CardDescription>
               </div>
               <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-bold">
                 {transactionsQuery.data?.length || 0} TOTAL
               </Badge>
            </CardHeader>
            <CardContent>
              {transactionsQuery.isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : transactionsQuery.data && transactionsQuery.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Ref</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Type</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">
                           <div className="flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Recon Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsQuery.data.map((txn: any) => (
                        <TableRow key={txn.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 border-slate-50 dark:border-slate-800 transition-colors h-16">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-[10px] text-slate-400 group-hover:text-primary transition-colors">
                                #{txn.providerReference?.substring(0, 10) || '00000'}
                              </span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                {new Date(txn.transactionTime).toLocaleDateString()} at {new Date(txn.transactionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 whitespace-nowrap">
                              {getTypeLabel(txn.type)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                 ${typeof txn.amount === "string" ? parseFloat(txn.amount).toFixed(2) : (txn.amount as number).toFixed(2)}
                               </span>
                               <span className="text-[10px] text-rose-400 font-medium">
                                 Fee: ${txn.fee ? (typeof txn.fee === "string" ? parseFloat(txn.fee).toFixed(2) : (txn.fee as number).toFixed(2)) : "0.00"}
                               </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(txn.status)}
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-3">
                                {getReconBadge(txn.reconciliationStatus)}
                                <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                  <MoreHorizontal className="w-4 h-4 text-slate-300" />
                                </button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                   <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                      <SearchCode className="h-8 w-8 text-slate-300" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No data found</h3>
                   <p className="text-sm text-slate-500 max-w-xs mt-1">Try adjusting your filters or date range to isolate specific flows.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* High-Risk/Flagged Transactions */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm dark:bg-slate-900/50 overflow-hidden">
                <div className="h-1.5 premium-gradient w-full" />
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" /> Risk & Security Audit
                  </CardTitle>
                  <CardDescription>Anomalies detected by the national security engine</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {flaggedQuery.isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  ) : flaggedQuery.data && flaggedQuery.data.length > 0 ? (
                    <div className="space-y-4">
                      {flaggedQuery.data.slice(0, 6).map((flag: any) => (
                        <div key={flag.id} className="p-4 bg-slate-50 dark:bg-slate-800/20 border-l-4 border-rose-500 rounded-2xl group hover:bg-rose-500/5 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-2">{flag.flagType}</p>
                              <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{flag.reason}</p>
                              <div className="flex items-center gap-2 mt-3 font-mono text-[10px] text-slate-400">
                                 <span>REF: #88229</span>
                                 <span>•</span>
                                 <span>SCORE: {(parseFloat(flag.riskScore || '0') * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                               <ArrowUpRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                       <CheckCircle2 className="h-12 w-12 text-emerald-100 dark:text-emerald-950 mx-auto mb-3" />
                       <p className="text-xs font-bold text-slate-500">Security engine reports 0 anomalies.</p>
                    </div>
                  )}
                  {flaggedQuery.data && flaggedQuery.data.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-slate-200 mt-2 font-bold text-xs uppercase h-10"
                      onClick={() => setLocation("/security")}
                    >
                       View Security Portal
                    </Button>
                  )}
                </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-primary" />
                   <h4 className="text-sm font-bold text-primary">Compliance Engine Active</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-blue-600 dark:text-blue-400 opacity-80 uppercase tracking-wide font-bold">
                   System is currently auditing ZB Bank, EcoCash, and OneMoney flows for velocity anomalies.
                </p>
                <div className="flex items-center gap-1.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-emerald-600">Sync status: Optimal</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
