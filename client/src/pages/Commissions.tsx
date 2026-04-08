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
  Trophy, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  Calendar, 
  FileBox, 
  Download, 
  UserCheck, 
  Zap,
  RefreshCw,
  MoreHorizontal,
  ChevronRight,
  TrendingDown,
  Clock
} from "lucide-react";

export default function Commissions() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const reportQuery = trpc.commissions.getReport.useQuery(
    {
      startDate: new Date(dateRange.start),
      endDate: new Date(dateRange.end),
    },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return null;
  }

  const report = reportQuery.data;
  const totalCommission = report?.totalCommission || 0;
  const employeeCount = report?.details.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Commission Records
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              View agent commissions and performance.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-11 rounded-xl px-4 border-slate-200 font-bold text-xs uppercase tracking-widest text-slate-600">
               <Download className="mr-2 h-4 w-4" /> Export Payouts
             </Button>
             <Button className="h-11 rounded-xl premium-gradient text-white px-6 font-bold shadow-lg shadow-primary/20">
               Audit Full Period
             </Button>
          </div>
        </div>

        {/* Audit Period configuration */}
        <div className="grid gap-4 md:grid-cols-4 p-4 glass rounded-2xl border border-slate-200 dark:border-slate-800">
             <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5 opacity-60">
                  <Calendar className="w-3 h-3" /> Select Date Range
                </label>
                <div className="flex items-center gap-3">
                   <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                  <span className="text-slate-300">—</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                </div>
             </div>

             <div className="flex items-end pb-0.5">
                <Button className="w-full h-10 rounded-xl premium-gradient text-white font-bold shadow-md shadow-primary/10">
                  Update Commissions
                </Button>
             </div>

             <div className="flex items-end pb-0.5">
                <Button variant="ghost" className="w-full h-10 rounded-xl text-slate-500 font-bold text-xs uppercase hover:bg-slate-50">
                  Default View
                </Button>
             </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
           <Card className="hover-lift border-none shadow-sm dark:bg-slate-900/50">
              <CardContent className="pt-6">
                 <div className="text-3xl font-black text-slate-900 dark:text-white">${totalCommission.toFixed(2)}</div>
                 <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">Gross Profit</p>
              </CardContent>
           </Card>
           <Card className="hover-lift border-none shadow-sm dark:bg-slate-900/50 ring-2 ring-blue-500/20 shadow-blue-500/5">
              <CardContent className="pt-6">
                 <div className="text-3xl font-black text-blue-500">${(report?.bossShare || 0).toFixed(2)}</div>
                 <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">Boss Share (85%)</p>
              </CardContent>
           </Card>
           <Card className="hover-lift border-none shadow-sm dark:bg-slate-900/50">
              <CardContent className="pt-6">
                 <div className="text-3xl font-black text-emerald-500">${(report?.totalPayroll || 0).toFixed(2)}</div>
                 <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">Payroll Pool (15%)</p>
              </CardContent>
           </Card>
           <Card className="hover-lift border-none shadow-sm dark:bg-slate-900/50">
              <CardContent className="pt-6">
                 <div className="text-3xl font-black text-amber-500">${(report?.accruedCommission || 0).toFixed(2)}</div>
                 <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">Pending Payouts</p>
              </CardContent>
           </Card>
        </div>

        <div className="grid gap-10 lg:grid-cols-7">
          {/* Main Earnings Table */}
          <Card className="lg:col-span-4 border-none shadow-sm dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="text-xl">Staff Earnings</CardTitle>
                  <CardDescription>Individual performance and commission</CardDescription>
               </div>
               <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-bold">{employeeCount} AGENTS</Badge>
            </CardHeader>
            <CardContent>
              {reportQuery.isLoading ? (
                <div className="py-20 flex justify-center">
                   <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : report && report.details.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-50 dark:border-slate-800">
                        <TableHead className="text-xs font-bold uppercase tracking-widest">Agent ID</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-widest text-right">Activity</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-widest text-right">Commission</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-widest text-right">Salary (15%)</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-widest text-right">Method</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-widest text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.details.map((emp: any) => (
                        <TableRow key={emp.employeeCode} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 border-slate-50 dark:border-slate-800 transition-colors h-16">
                          <TableCell>
                             <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-slate-100">{emp.employeeName}</span>
                                <span className="font-mono text-[10px] text-slate-400 uppercase">CODE: {emp.employeeCode}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{emp.transactionCount} TXNs</span>
                                <span className="text-[10px] text-slate-400 font-medium">${typeof emp.totalAmount === "string" ? parseFloat(emp.totalAmount).toLocaleString() : (emp.totalAmount as number).toLocaleString()}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <span className="text-sm font-black text-slate-400">
                               ${typeof emp.totalCommission === "string" ? parseFloat(emp.totalCommission).toFixed(2) : (emp.totalCommission as number).toFixed(2)}
                             </span>
                          </TableCell>
                          <TableCell className="text-right">
                             <span className="text-sm font-black text-emerald-500">
                               ${typeof emp.estimatedSalary === "string" ? parseFloat(emp.estimatedSalary).toFixed(2) : (emp.estimatedSalary as number).toFixed(2)}
                             </span>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">EC-WALLET</span>
                                <span className="text-[8px] text-slate-400 font-mono">077112233</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-3">
                                <Badge 
                                  variant="outline" 
                                  className={`text-[9px] font-black px-2 py-0 h-5 border-none uppercase tracking-tighter ${
                                    emp.commissionBreakdown?.[0]?.payoutFrequency === "instant" 
                                      ? "bg-emerald-500/10 text-emerald-600" 
                                      : "bg-amber-500/10 text-amber-600"
                                  }`}
                                >
                                  {emp.commissionBreakdown?.[0]?.payoutFrequency || "MONTHLY"}
                                </Badge>
                                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-300 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-24 text-center">
                   <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileBox className="h-8 w-8 text-slate-200" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">Zero Activity Ledger</h3>
                   <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">No commission data detected for the current horizon period.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-8">
            {/* Top Performers Podium */}
            {report && report.details.length > 0 && (
              <Card className="border-none shadow-sm dark:bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" /> Performance Leaders
                  </CardTitle>
                  <CardDescription>Top revenue generators for the period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.details
                    .sort((a: any, b: any) => {
                      const aComm = typeof a.totalCommission === "string" ? parseFloat(a.totalCommission) : (a.totalCommission as number);
                      const bComm = typeof b.totalCommission === "string" ? parseFloat(b.totalCommission) : (b.totalCommission as number);
                      return bComm - aComm;
                    })
                    .slice(0, 4)
                    .map((emp: any, idx: number) => (
                      <div key={emp.employeeCode} className="group p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-emerald-500/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 flex items-center justify-center rounded-xl font-black text-xs ${idx === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-900 border border-slate-100 text-slate-400'}`}>
                            #{idx + 1}
                          </div>
                          <div className="space-y-0.5">
                             <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{emp.employeeName}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.transactionCount} INITIATED FLOWS</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-black text-emerald-500">
                             ${typeof emp.totalCommission === "string" ? parseFloat(emp.totalCommission).toFixed(0) : (emp.totalCommission as number).toFixed(0)}
                           </p>
                           <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px] bg-emerald-500/5 font-bold">+12%</Badge>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-xs font-bold text-primary uppercase tracking-widest mt-4 flex items-center justify-between group">
                       View All Rankings <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </CardContent>
              </Card>
            )}

            {/* Accrual Categories */}
            <Card className="border-none shadow-sm dark:bg-slate-900/50 overflow-hidden">
               <div className="h-1.5 premium-gradient opacity-40 w-full" />
               <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" /> Commission Breakdown
                  </CardTitle>
                  <CardDescription>Earning breakdown by transaction type</CardDescription>
               </CardHeader>
               <CardContent className="space-y-3">
                  {["cash_out", "cash_in", "send_money", "receive_money", "bill_payment", "airtime"].map(
                    (type) => {
                      const typeCommission = report?.details.reduce((sum: number, emp: any) => {
                        const breakdown = emp.commissionBreakdown.find((b: any) => b.transactionType === type);
                        return sum + (breakdown?.commission || 0);
                      }, 0) || 0;

                      if (typeCommission === 0) return null;

                      return (
                        <div key={type} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-primary/20 transition-all">
                          <div className="flex gap-4">
                             <div className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary" />
                             </div>
                             <div className="space-y-0.5">
                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">{type.replace(/_/g, " ")}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                   {report?.details.reduce((sum: number, emp: any) => {
                                      const breakdown = emp.commissionBreakdown.find((b: any) => b.transactionType === type);
                                      return sum + (breakdown?.count || 0);
                                   }, 0)} Transactions
                                </p>
                             </div>
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">${typeCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      );
                    }
                  )}
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
