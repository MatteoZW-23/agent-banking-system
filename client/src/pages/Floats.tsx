import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ArrowRightCircle,
  History,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";

export default function Floats() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });

  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const totalFloatQuery = trpc.floats.getTotalBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const totalBalance = totalFloatQuery.data
    ? parseFloat(totalFloatQuery.data)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-12 animate-fade-in pb-20">
        {/* Float Header Node */}
        <PageHeader
          title="Float Monitoring"
          subtitle="Real-time liquidity tracking across all payment network clusters."
          category="Capital Distribution"
          actions={
            <Button className="h-12 rounded-[1.25rem] premium-gradient text-white px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all">
              <Wallet className="mr-3 h-4 w-4" /> Inject Capital
            </Button>
          }
          onRefresh={() => {
            providersQuery.refetch();
            totalFloatQuery.refetch();
            toast.success("Liquidity State Recalculated");
          }}
        />

        {/* Global Liquidity Card */}
        <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
          <div className="h-1.5 premium-gradient w-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-primary uppercase tracking-[0.2em]">
              <Wallet className="h-3 w-3" /> Aggregated Global Float
            </div>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-8">
            <div className="space-y-2">
              <div className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                $
                {totalBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-sm font-medium text-slate-400">
                Current liquidity status:{" "}
                <span className="text-emerald-500 font-bold">OPTIMAL</span>{" "}
                across {providersQuery.data?.length || 0} nodes.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Weekly Change
                </p>
                <p className="text-lg font-bold text-emerald-500">+12,50%</p>
              </div>
              <div className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Projected Burn
                </p>
                <p className="text-lg font-bold text-amber-500">4.2 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Float Status Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Active Node
              Balances
            </h2>
            <div className="flex items-center gap-4 text-[10px] font-extrabold text-slate-400">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> HEALTHY
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> WARN
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" /> CRITICAL
              </span>
            </div>
          </div>
          {providersQuery.isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : providersQuery.data && providersQuery.data.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {providersQuery.data.map((provider: any) => (
                <ProviderFloatCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="p-20 text-center glass rounded-3xl border border-dashed border-slate-200">
              <Wallet className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                No Nodes Detected
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Float Movement History */}
          <Card className="border-none shadow-sm dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-50 dark:border-slate-800">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-400" /> Movement Logs
                </CardTitle>
                <CardDescription>
                  Audited sequence of float adjustments
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                className="text-xs font-bold text-primary"
              >
                View Full Audit
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                {[
                  {
                    provider: "EcoCash",
                    type: "deposit",
                    amount: 500,
                    time: "2 hours ago",
                    balance: 1250,
                    ref: "DEP-9921",
                  },
                  {
                    provider: "OneMoney",
                    type: "withdrawal",
                    amount: 200,
                    time: "4 hours ago",
                    balance: 3500,
                    ref: "WTH-8832",
                  },
                  {
                    provider: "InnBucks",
                    type: "deposit",
                    amount: 1000,
                    time: "1 day ago",
                    balance: 2100,
                    ref: "DEP-1209",
                  },
                  {
                    provider: "ZB Bank",
                    type: "withdrawal",
                    amount: 300,
                    time: "2 days ago",
                    balance: 5600,
                    ref: "WTH-7731",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.type === "deposit" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}
                      >
                        {item.type === "deposit" ? (
                          <TrendingUp className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-rose-500" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          {item.provider}{" "}
                          <span className="text-[10px] font-mono text-slate-400 font-medium">
                            #{item.ref}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {item.time} • {item.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p
                        className={`text-sm font-black ${item.type === "deposit" ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {item.type === "deposit" ? "+" : "-"}$
                        {item.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                        Bal: ${item.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Optimization */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm dark:bg-slate-900/50 overflow-hidden">
              <div className="h-1 premium-gradient opacity-40 w-full" />
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-500" /> Alert
                  Thresholds
                </CardTitle>
                <CardDescription>
                  Critical markers for network rebalancing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    provider: "EcoCash",
                    level: "Critical",
                    amount: 45.5,
                    color: "text-rose-500",
                    bg: "bg-rose-500/10",
                  },
                  {
                    provider: "OneMoney",
                    level: "Warning",
                    amount: 320.0,
                    color: "text-amber-500",
                    bg: "bg-amber-500/10",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-2xl border-l-4 border-rose-500 bg-slate-50 dark:bg-black/20"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className={`w-5 h-5 ${item.color}`} />
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">
                          {item.provider}
                        </p>
                        <p
                          className={`text-[10px] font-extrabold uppercase tracking-widest ${item.color}`}
                        >
                          {item.level} Level
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        ${item.amount.toFixed(2)}
                      </p>
                      <button className="text-[10px] font-bold text-primary hover:underline mt-1">
                        REBALANCE
                      </button>
                    </div>
                  </div>
                ))}
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 mt-6 text-center group cursor-pointer hover:border-primary/40 transition-all">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">
                    Adjust Global Thresholds
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Info className="h-32 w-32 -rotate-12" />
              </div>
              <div className="relative z-10 space-y-4">
                <h4 className="text-lg font-bold">Optimization Engine</h4>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Our predictive algorithms suggest rebalancing{" "}
                  <span className="text-white font-bold">$4,500</span> from ZB
                  Bank to EcoCash to prevent potential service downtime tonight.
                </p>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl bg-transparent border-slate-700 text-white hover:bg-slate-800 hover:border-slate-600 transition-all font-bold"
                >
                  Execute Recommendation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProviderFloatCard({ provider }: { provider: any }) {
  // Enhanced mock data logic
  const mockBalances: Record<
    string,
    { balance: number; threshold: number; lastUpdated: string }
  > = {
    EcoCash: { balance: 1250.5, threshold: 500, lastUpdated: "2m ago" },
    OneMoney: { balance: 3200.0, threshold: 1000, lastUpdated: "5m ago" },
    InnBucks: { balance: 2100.75, threshold: 800, lastUpdated: "10m ago" },
    "ZB Bank": { balance: 5600.0, threshold: 2000, lastUpdated: "3m ago" },
    "CBZ Bank": { balance: 1800.25, threshold: 1000, lastUpdated: "15m ago" },
    "NMB Bank": { balance: 4200.0, threshold: 1500, lastUpdated: "7m ago" },
  };

  const data = mockBalances[provider.name] || {
    balance: 0,
    threshold: 0,
    lastUpdated: "—",
  };
  const isLow = data.balance < data.threshold;
  const isCritical = data.balance < data.threshold * 0.5;

  return (
    <Card
      className={`group border-none shadow-sm dark:bg-slate-900/50 hover-lift overflow-hidden ${
        isCritical
          ? "ring-2 ring-rose-500/40"
          : isLow
            ? "ring-2 ring-amber-500/40"
            : ""
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 premium-gradient rounded-xl flex items-center justify-center shadow-md">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          {isCritical ? (
            <Badge className="bg-rose-500 text-white font-black text-[10px] tracking-widest border-none px-3 py-1 animate-pulse">
              CRITICAL
            </Badge>
          ) : isLow ? (
            <Badge className="bg-amber-500 text-white font-black text-[10px] tracking-widest border-none px-3 py-1">
              WARNING
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-500 font-black text-[10px] tracking-widest border-none px-3 py-1"
            >
              OPTIMAL
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl pt-4 text-slate-800 dark:text-white group-hover:text-primary transition-colors">
          {provider.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <CircleDot className="w-2.5 h-2.5 text-slate-300" /> Real-time
            Balance
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black tracking-tight ${isCritical ? "text-rose-500" : isLow ? "text-amber-500" : "text-emerald-500"}`}
            >
              $
              {data.balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              USD
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-2">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
              Floor Marker
            </p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-300">
              ${data.threshold.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
              Last Sync
            </p>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {data.lastUpdated}
            </p>
          </div>
        </div>

        {isCritical && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl flex items-start gap-2.5 animate-pulse">
            <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300 leading-relaxed uppercase">
              Immediate liquidity injection required. Node at risk of service
              denial.
            </p>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full h-10 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase group-hover:bg-primary group-hover:text-white transition-all"
        >
          <ArrowRightCircle className="w-3.5 h-3.5 mr-2" /> Operational Details
        </Button>
      </CardContent>
    </Card>
  );
}

function CircleDot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}
