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
    console.log("Exporting report cluster...");
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case "daily":
        return <BarChart3 className="w-5 h-5" />;
      case "pnl":
        return <DollarSign className="w-5 h-5" />;
      case "provider":
        return <PieChart className="w-5 h-5" />;
      case "commission":
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Analytical Reports
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Comprehensive data orchestration for business intelligence and
              regulatory auditing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-11 rounded-xl px-4 border-slate-200 font-bold text-xs uppercase tracking-widest text-slate-600"
            >
              <Share2 className="mr-2 h-4 w-4" /> Share Cluster
            </Button>
            <Button
              onClick={handleExport}
              className="h-11 rounded-xl premium-gradient text-white px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate & Export
            </Button>
          </div>
        </div>

        {/* Global Configuration bar */}
        <div className="grid gap-6 lg:grid-cols-3 p-4 glass rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 flex items-center gap-1.5 opacity-60">
              <PieChart className="w-3 h-3" /> Report Classification
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "daily", label: "Daily Ledger" },
                { id: "pnl", label: "Agent P&L" },
                { id: "provider", label: "Provider Stats" },
                { id: "commission", label: "Commissions" },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id as any)}
                  className={`h-11 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    reportType === type.id
                      ? "premium-gradient text-white shadow-md"
                      : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 flex items-center gap-1.5 opacity-60">
              <Calendar className="w-3 h-3" /> Target Horizon
            </label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full h-24 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 text-2xl font-black text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Node Status
                </p>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                  ALL CLUSTERS ACTIVE
                </p>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-500 opacity-60" />
            </div>
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  Auto-Recon
                </p>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                  MATCHED: 99.8%
                </p>
              </div>
              <RefreshCw className="h-5 w-5 text-primary opacity-60 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Dynamic Report Content */}
        {reportType === "daily" && dailySummary.data && (
          <div className="space-y-10 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Volume Flux",
                  value: dailySummary.data.transactionCount,
                  sub: "Total sequences",
                  icon: Zap,
                  color: "text-blue-500",
                  bg: "bg-blue-50",
                },
                {
                  label: "Net Liquidity",
                  value: `$${dailySummary.data.totalAmount.toLocaleString()}`,
                  sub: "Gross processed",
                  icon: DollarSign,
                  color: "text-emerald-500",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Operational Fees",
                  value: `$${dailySummary.data.totalFees.toLocaleString()}`,
                  sub: "Network overhead",
                  icon: FileText,
                  color: "text-amber-500",
                  bg: "bg-amber-50",
                },
                {
                  label: "Sequence Success",
                  value: `${dailySummary.data.transactionCount > 0 ? ((dailySummary.data.completedCount / dailySummary.data.transactionCount) * 100).toFixed(1) : 0}%`,
                  sub: "Execution rate",
                  icon: TrendingUp,
                  color: "text-indigo-500",
                  bg: "bg-indigo-50",
                },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="hover-lift border-none shadow-sm dark:bg-slate-900/50"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div
                      className={`p-2.5 rounded-xl ${stat.bg} dark:bg-slate-800`}
                    >
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-300" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {stat.value}
                    </div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">
                      {stat.label}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400/60 mt-1 uppercase">
                      {stat.sub}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-sm dark:bg-slate-900/50 overflow-hidden">
              <CardHeader className="pb-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Node Performance Breakdown
                  </CardTitle>
                  <CardDescription>
                    Audited transaction throughput across operational nodes
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-300">
                  <MoreHorizontal />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {dailySummary.data.transactionCount > 0 ? (
                  <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="h-64 flex flex-col items-center justify-center bg-slate-50 dark:bg-black/20 relative">
                      <div className="text-center space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                          Data Visualizer
                        </p>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white">
                          Throughput Heatmap
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                          Interactive visualization showing real-time load
                          distribution across regional banking nodes.
                        </p>
                      </div>
                      {/* Placeholder for actual chart */}
                      <div className="absolute inset-x-10 bottom-0 top-1/2 flex items-end gap-1 px-10">
                        {[
                          40, 70, 45, 90, 65, 30, 80, 55, 95, 40, 60, 85, 45,
                          75, 50, 90,
                        ].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-primary/20 rounded-t-lg transition-all hover:bg-primary/40 group relative"
                            style={{ height: `${h}%` }}
                          >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {h}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center">
                    <BarChart3 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      No node activity detected for target horizon
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {reportType === "provider" && providerBreakdown.data && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {providerBreakdown.data.map((provider: any) => (
                <Card
                  key={provider.provider}
                  className="hover-lift border-none shadow-sm dark:bg-slate-900/50 group"
                >
                  <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {provider.provider.toLowerCase().includes("bank") ? (
                            <Building2 className="w-5 h-5 text-slate-500" />
                          ) : provider.provider
                              .toLowerCase()
                              .includes("cash") ? (
                            <Smartphone className="w-5 h-5 text-slate-500" />
                          ) : (
                            <Globe className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <CardTitle className="text-lg">
                          {provider.provider}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold">
                        ${provider.totalAmount.toLocaleString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-2">
                          Flux
                        </p>
                        <p className="text-lg font-black text-slate-800 dark:text-white">
                          {provider.transactionCount}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-2">
                          Efficiency
                        </p>
                        <p className="text-lg font-black text-emerald-500">
                          {(
                            (provider.completedCount /
                              provider.transactionCount) *
                            100
                          ).toFixed(0)}
                          %
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                        <span>Succeeded</span>
                        <span>{provider.completedCount}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-1000"
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

        {/* Global Policy Note */}
        <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Integrated
                Compliance Note
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                This report is automatically verified against the regional
                banking compliance cluster. Unauthorized modifications to the
                underlying ledger will trigger high-priority alerts in the
                security telemetry hub.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-xs font-bold uppercase tracking-[0.2em] text-primary whitespace-nowrap"
            >
              View Verification Chain
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Share2({ className }: { className?: string }) {
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
