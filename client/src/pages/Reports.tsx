import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Calendar,
  Download,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Zap,
  ArrowUpRight,
  Search,
  RefreshCw,
  MoreHorizontal,
  ShieldCheck,
  Building2,
  Smartphone,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reportType, setReportType] = useState<
    "daily" | "pnl" | "provider" | "commission"
  >("daily");

  const dailySummary = trpc.reports.dailySummary.useQuery(
    { date: new Date(selectedDate) },
    { enabled: reportType === "daily" }
  );

  const providerBreakdown = trpc.reports.providerBreakdown.useQuery(
    { date: new Date(selectedDate) },
    { enabled: reportType === "provider" }
  );

  const handleExport = () => {
    console.log("Exporting report...");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Reports
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Business intelligence and financial reporting.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-lg px-3 border-gray-200 font-medium text-xs flex gap-1.5"
            >
              <ShareIcon className="mr-1 h-4 w-4" /> Share
            </Button>
            <Button
              onClick={handleExport}
              className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 font-medium text-sm"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid gap-4 lg:grid-cols-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <PieChart className="w-3 h-3" /> Report Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "daily", label: "Daily Summary" },
                { id: "pnl", label: "Agent P&L" },
                { id: "provider", label: "Provider Stats" },
                { id: "commission", label: "Commissions" },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id as any)}
                  className={`h-9 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                    reportType === type.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full h-12 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-col justify-center gap-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-700">Status</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">All systems active</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500 opacity-60" />
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Auto-Reconciliation</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Match rate: 99.8%</p>
              </div>
              <RefreshCw className="h-4 w-4 text-blue-500 opacity-60" />
            </div>
          </div>
        </div>

        {/* Daily report content */}
        {reportType === "daily" && dailySummary.data && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Transaction Count",
                  value: dailySummary.data.transactionCount,
                  sub: "Today's volume",
                  icon: Zap,
                  color: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                },
                {
                  label: "Total Amount",
                  value: `$${dailySummary.data.totalAmount.toLocaleString()}`,
                  sub: "Gross processed",
                  icon: DollarSign,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 dark:bg-emerald-900/20",
                },
                {
                  label: "Total Fees",
                  value: `$${dailySummary.data.totalFees.toLocaleString()}`,
                  sub: "Revenue collected",
                  icon: FileText,
                  color: "text-amber-600",
                  bg: "bg-amber-50 dark:bg-amber-900/20",
                },
                {
                  label: "Success Rate",
                  value: `${dailySummary.data.transactionCount > 0 ? ((dailySummary.data.completedCount / dailySummary.data.transactionCount) * 100).toFixed(1) : 0}%`,
                  sub: "Completion rate",
                  icon: TrendingUp,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50 dark:bg-indigo-900/20",
                },
              ].map((stat, i) => (
                <Card key={i} className="border border-gray-200 dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-300" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <p className="text-xs font-medium text-gray-500 mt-1">{stat.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Performance Breakdown</CardTitle>
                  <CardDescription>Transaction throughput by time period</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-300">
                  <MoreHorizontal />
                </Button>
              </CardHeader>
              <CardContent>
                {dailySummary.data.transactionCount > 0 ? (
                  <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="h-56 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 relative">
                      <div className="text-center space-y-1">
                        <p className="text-xs font-medium text-gray-400">Volume Chart</p>
                        <h4 className="text-xl font-bold text-gray-800 dark:text-white">
                          Transaction Distribution
                        </h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                          Hourly distribution of transaction volume.
                        </p>
                      </div>
                      <div className="absolute inset-x-8 bottom-0 top-1/2 flex items-end gap-0.5 px-8">
                        {[40, 70, 45, 90, 65, 30, 80, 55, 95, 40, 60, 85, 45, 75, 50, 90].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-t transition-all hover:bg-blue-400 dark:hover:bg-blue-600 group relative"
                            style={{ height: `${h}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {h}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No activity for this date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {reportType === "provider" && providerBreakdown.data && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providerBreakdown.data.map((provider: any) => (
                <Card key={provider.provider} className="border border-gray-200 dark:border-slate-700 shadow-sm">
                  <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                          {provider.provider.toLowerCase().includes("bank") ? (
                            <Building2 className="w-4 h-4 text-gray-500" />
                          ) : provider.provider.toLowerCase().includes("cash") ? (
                            <Smartphone className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Globe className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <CardTitle className="text-base">{provider.provider}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs font-medium">
                        ${provider.totalAmount.toLocaleString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">
                        <p className="text-xs text-gray-500 mb-0.5">Count</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{provider.transactionCount}</p>
                      </div>
                      <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">
                        <p className="text-xs text-gray-500 mb-0.5">Success</p>
                        <p className="text-lg font-bold text-emerald-600">
                          {((provider.completedCount / provider.transactionCount) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500 px-0.5">
                        <span>Completed</span>
                        <span>{provider.completedCount}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-700"
                          style={{
                            width: `${(provider.completedCount / provider.transactionCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="p-5 rounded-xl bg-gray-900 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-xl">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-400" /> Compliance Notice
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed mt-1">
                Reports are verified against the banking compliance framework. Unauthorized ledger modifications trigger security alerts.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-xs font-medium text-blue-400 whitespace-nowrap"
            >
              View Audit Trail
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
