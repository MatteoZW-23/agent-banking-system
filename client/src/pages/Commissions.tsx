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
  Clock,
  Search
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

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
      <div className="space-y-8 pb-16">
        <PageHeader 
          title="Commission Reports"
          subtitle="Review agent performance and commission payouts."
          category="Financials"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 rounded-lg border-gray-200 font-medium">
                <Download className="mr-2 h-3.5 w-3.5" /> Export CSV
              </Button>
              <Button size="sm" className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Audit Period
              </Button>
            </div>
          }
        />

        {/* Date Filter */}
        <Card className="border border-gray-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 grid gap-4 md:grid-cols-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 px-1">
                <Calendar className="w-3.5 h-3.5" /> Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full h-9 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-gray-300">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full h-9 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <Button 
              onClick={() => reportQuery.refetch()}
              className="h-9 rounded-lg bg-gray-900 dark:bg-slate-700 text-white text-sm font-medium"
            >
              Update View
            </Button>
            <Button 
              variant="ghost" 
              className="h-9 rounded-lg text-gray-500 text-xs font-medium"
              onClick={() => {
                const start = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0];
                const end = new Date().toISOString().split("T")[0];
                setDateRange({ start, end });
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Summary Boxes */}
        <div className="grid gap-4 md:grid-cols-4">
           {[
             { label: "Total Revenue", val: `$${totalCommission.toFixed(2)}`, color: "text-gray-900 dark:text-white" },
             { label: "Company Share (85%)", val: `$${(report?.bossShare || 0).toFixed(2)}`, color: "text-blue-600" },
             { label: "Payroll (15%)", val: `$${(report?.totalPayroll || 0).toFixed(2)}`, color: "text-emerald-600" },
             { label: "Pending Payouts", val: `$${(report?.accruedCommission || 0).toFixed(2)}`, color: "text-amber-600" },
           ].map((stat, i) => (
             <Card key={i} className="border border-gray-200 dark:border-slate-800 shadow-sm">
                <CardContent className="pt-5 pb-5">
                   <div className={`text-2xl font-bold ${stat.color}`}>{stat.val}</div>
                   <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-tight">{stat.label}</p>
                </CardContent>
             </Card>
           ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          {/* Main Table */}
          <Card className="lg:col-span-4 border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50 dark:border-slate-800/50">
               <div>
                  <CardTitle className="text-lg">Agent Performance</CardTitle>
                  <CardDescription>Individual summary of transactions and earnings</CardDescription>
               </div>
               <Badge className="bg-blue-50 text-blue-700 border-none font-medium px-2.5 py-0.5">{employeeCount} Agents</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {reportQuery.isLoading ? (
                <div className="py-20 flex justify-center">
                   <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
              ) : report && report.details.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-gray-50 dark:border-slate-800">
                        <TableHead className="text-xs font-semibold text-gray-500 pl-6 h-12">Agent Name</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 text-right h-12">Activity</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 text-right h-12">Total Comm.</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 text-right h-12">Salary Est.</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 text-right pr-6 h-12">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.details.map((emp: any) => (
                        <TableRow key={emp.employeeCode} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 border-gray-50 dark:border-slate-800 transition-colors h-14">
                          <TableCell className="pl-6">
                             <div className="flex flex-col">
                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{emp.employeeName}</span>
                                <span className="font-mono text-[10px] text-gray-400">ID: {emp.employeeCode}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{emp.transactionCount} tx</span>
                                <span className="text-[10px] text-gray-400">${typeof emp.totalAmount === "string" ? parseFloat(emp.totalAmount).toLocaleString() : (emp.totalAmount as number).toLocaleString()} vol</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <span className="text-sm font-bold text-gray-600 mb-2">
                               ${typeof emp.totalCommission === "string" ? parseFloat(emp.totalCommission).toFixed(2) : (emp.totalCommission as number).toFixed(2)}
                             </span>
                          </TableCell>
                          <TableCell className="text-right">
                             <span className="text-sm font-bold text-emerald-600">
                               ${typeof emp.estimatedSalary === "string" ? parseFloat(emp.estimatedSalary).toFixed(2) : (emp.estimatedSalary as number).toFixed(2)}
                             </span>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                             <div className="flex items-center justify-end gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] font-medium border-none px-2 py-0.5 h-auto ${
                                    emp.commissionBreakdown?.[0]?.payoutFrequency === "instant" 
                                      ? "bg-emerald-50 text-emerald-700" 
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {emp.commissionBreakdown?.[0]?.payoutFrequency || "Monthly"}
                                </Badge>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-20 text-center">
                   <FileBox className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                   <h3 className="text-sm font-semibold text-gray-800 dark:text-white">No records found</h3>
                   <p className="text-xs text-gray-400 mt-1">Try adjusting your date filters.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            {/* Top Performers */}
            {report && report.details.length > 0 && (
              <Card className="border border-gray-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-base">Top Earners</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {report.details
                    .sort((a: any, b: any) => {
                      const aComm = typeof a.totalCommission === "string" ? parseFloat(a.totalCommission) : (a.totalCommission as number);
                      const bComm = typeof b.totalCommission === "string" ? parseFloat(b.totalCommission) : (b.totalCommission as number);
                      return bComm - aComm;
                    })
                    .slice(0, 4)
                    .map((emp: any, idx: number) => (
                      <div key={emp.employeeCode} className="p-3.5 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 flex items-center justify-center rounded-lg font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 dark:bg-slate-900 text-gray-400'}`}>
                            {idx + 1}
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">{emp.employeeName}</p>
                             <p className="text-[10px] text-gray-500 uppercase tracking-tight">{emp.transactionCount} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold text-emerald-600">
                             ${typeof emp.totalCommission === "string" ? parseFloat(emp.totalCommission).toFixed(0) : (emp.totalCommission as number).toFixed(0)}
                           </p>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2 flex items-center justify-center gap-2">
                       Full Leaderboard <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                </CardContent>
              </Card>
            )}

            {/* Performance Breakdown */}
            <Card className="border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-base">Breakdown</CardTitle>
                  </div>
               </CardHeader>
               <CardContent className="space-y-2 pt-0">
                  {["cash_out", "cash_in", "send_money", "receive_money", "bill_payment", "airtime"].map(
                    (type) => {
                      const typeCommission = report?.details.reduce((sum: number, emp: any) => {
                        const breakdown = emp.commissionBreakdown.find((b: any) => b.transactionType === type);
                        return sum + (breakdown?.commission || 0);
                      }, 0) || 0;

                      if (typeCommission === 0) return null;

                      return (
                        <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800 rounded-lg group">
                          <div>
                             <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{type.replace(/_/g, " ")}</p>
                             <p className="text-[10px] text-gray-400 font-medium">
                                {report?.details.reduce((sum: number, emp: any) => {
                                   const breakdown = emp.commissionBreakdown.find((b: any) => b.transactionType === type);
                                   return sum + (breakdown?.count || 0);
                                }, 0)} items
                             </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">${typeCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
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
