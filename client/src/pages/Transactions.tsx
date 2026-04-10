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
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-xs"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-50 text-red-700 border-red-200 font-medium text-xs"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "reversed":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200 font-medium text-xs"><RefreshCw className="w-3 h-3 mr-1" /> Reversed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReconBadge = (status: string | null) => {
     if (status === 'matched') return <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">Matched</Badge>;
     if (status === 'mismatch') return <Badge variant="outline" className="text-red-600 border-red-300 text-xs">Mismatch</Badge>;
     return <Badge variant="outline" className="text-gray-400 text-xs">{status || 'Pending'}</Badge>;
  };

  const getTypeLabel = (type: string | null) => {
    if (!type) return "Unknown";
    return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Transactions
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              View and audit transaction records across all providers.
            </p>
          </div>
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  placeholder="Search reference..." 
                  className="pl-9 pr-3 h-9 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
             </div>
             <Button variant="outline" className="h-9 rounded-lg px-3 flex gap-1.5 font-medium text-xs border-gray-200">
               <Download className="w-4 h-4" /> Export
             </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-12 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
             <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Filter className="w-3 h-3" /> Provider
                </label>
                <select
                  value={selectedProvider || ""}
                  onChange={(e) => setSelectedProvider(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full h-9 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Providers</option>
                  {providersQuery.data?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
             </div>

             <div className="space-y-1.5 md:col-span-5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Date Range
                </label>
                <div className="flex items-center gap-2">
                   <input
                     type="date"
                     value={dateRange.start.toISOString().split("T")[0]}
                     onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                     className="flex-1 h-9 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                   />
                   <span className="text-gray-400">—</span>
                   <input
                     type="date"
                     value={dateRange.end.toISOString().split("T")[0]}
                     onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                     className="flex-1 h-9 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                   />
                </div>
             </div>

             <div className="flex items-end md:col-span-2">
                <Button className="w-full h-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs">
                  Apply
                </Button>
             </div>

             <div className="flex items-end md:col-span-2">
                <Button variant="ghost" className="w-full h-9 rounded-md text-gray-400 font-medium text-xs hover:text-gray-600">
                  Reset
                </Button>
             </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transaction table */}
          <Card className="lg:col-span-2 border border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
               <div>
                 <CardTitle className="text-lg">Transaction Ledger</CardTitle>
                 <CardDescription>Audited records of funds movement</CardDescription>
               </div>
               <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 font-medium text-xs">
                 {transactionsQuery.data?.length || 0} total
               </Badge>
            </CardHeader>
            <CardContent>
              {transactionsQuery.isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
              ) : transactionsQuery.data && transactionsQuery.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-gray-100 dark:border-slate-700">
                        <TableHead className="font-medium text-xs">Reference</TableHead>
                        <TableHead className="font-medium text-xs">Type</TableHead>
                        <TableHead className="font-medium text-xs">
                           <div className="flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                        </TableHead>
                        <TableHead className="font-medium text-xs text-center">Status</TableHead>
                        <TableHead className="font-medium text-xs text-right">Reconciliation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsQuery.data.map((txn: any) => (
                        <TableRow key={txn.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/30 border-gray-100 dark:border-slate-700 h-14">
                          <TableCell>
                            <div>
                              <span className="font-mono text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                                #{txn.providerReference?.substring(0, 10) || '00000'}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-slate-300 block mt-0.5">
                                {new Date(txn.transactionTime).toLocaleDateString()} at {new Date(txn.transactionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-gray-600 whitespace-nowrap">
                              {getTypeLabel(txn.type)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                               <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                 ${typeof txn.amount === "string" ? parseFloat(txn.amount).toFixed(2) : (txn.amount as number).toFixed(2)}
                               </span>
                               <span className="text-xs text-red-400 block mt-0.5">
                                 Fee: ${txn.fee ? (typeof txn.fee === "string" ? parseFloat(txn.fee).toFixed(2) : (txn.fee as number).toFixed(2)) : "0.00"}
                               </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(txn.status)}
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-2">
                                {getReconBadge(txn.reconciliationStatus)}
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors">
                                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                   <SearchCode className="h-8 w-8 text-gray-300 mb-3" />
                   <h3 className="text-base font-semibold text-gray-700 dark:text-slate-200">No transactions found</h3>
                   <p className="text-sm text-gray-400 max-w-xs mt-1">Try adjusting your filters or date range.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flagged transactions */}
          <div className="space-y-4">
            <Card className="border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400 w-full" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Flagged Transactions
                  </CardTitle>
                  <CardDescription>Anomalies detected by the security engine</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {flaggedQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                    </div>
                  ) : flaggedQuery.data && flaggedQuery.data.length > 0 ? (
                    <div className="space-y-3">
                      {flaggedQuery.data.slice(0, 6).map((flag: any) => (
                        <div key={flag.id} className="p-3 bg-gray-50 dark:bg-slate-800 border-l-3 border-l-red-500 rounded-lg group hover:bg-red-50/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{flag.flagType}</p>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">{flag.reason}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 font-mono">
                                 <span>Score: {(parseFloat(flag.riskScore || '0') * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded">
                               <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                       <CheckCircle2 className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                       <p className="text-xs text-gray-400">No anomalies detected.</p>
                    </div>
                  )}
                  {flaggedQuery.data && flaggedQuery.data.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-md border-gray-200 mt-2 font-medium text-xs h-9"
                      onClick={() => setLocation("/security")}
                    >
                       View Security Portal
                    </Button>
                  )}
                </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 space-y-2">
                <div className="flex items-center gap-1.5">
                   <ShieldCheck className="h-4 w-4 text-blue-600" />
                   <h4 className="text-sm font-medium text-blue-700">Compliance Active</h4>
                </div>
                <p className="text-xs text-blue-600/70 leading-relaxed">
                   System is auditing ZB Bank, EcoCash, and OneMoney flows for velocity anomalies.
                </p>
                <div className="flex items-center gap-1.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                   <span className="text-xs font-medium text-emerald-600">Status: Healthy</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
