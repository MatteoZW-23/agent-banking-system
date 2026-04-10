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
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Float Management"
          subtitle="Track float balances across all provider accounts."
          category="Finance"
          actions={
            <Button className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 font-medium text-sm">
              <Wallet className="mr-2 h-4 w-4" /> Add Float
            </Button>
          }
          onRefresh={() => {
            providersQuery.refetch();
            totalFloatQuery.refetch();
            toast.success("Updated");
          }}
        />

        {/* Total balance card */}
        <Card className="border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400 w-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
              <Wallet className="h-3.5 w-3.5" /> Total Float
            </div>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-6">
            <div>
              <div className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                $
                {totalBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Status:{" "}
                <span className="text-emerald-600 font-medium">Healthy</span>{" "}
                across {providersQuery.data?.length || 0} providers.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center">
                <p className="text-xs text-gray-500 mb-1">Weekly Change</p>
                <p className="text-base font-semibold text-emerald-600">+12.5%</p>
              </div>
              <div className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center">
                <p className="text-xs text-gray-500 mb-1">Runway</p>
                <p className="text-base font-semibold text-amber-600">4.2 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider balances */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" /> Provider Balances
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> Warning
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" /> Critical
              </span>
            </div>
          </div>
          {providersQuery.isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          ) : providersQuery.data && providersQuery.data.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providersQuery.data.map((provider: any) => (
                <ProviderFloatCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
              <Wallet className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No providers configured</p>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent movements */}
          <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-400" /> Recent Movements
                </CardTitle>
                <CardDescription>Float adjustments history</CardDescription>
              </div>
              <Button variant="ghost" className="text-xs font-medium text-blue-600">
                View All
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {[
                  { provider: "EcoCash", type: "deposit", amount: 500, time: "2 hours ago", balance: 1250, ref: "DEP-9921" },
                  { provider: "OneMoney", type: "withdrawal", amount: 200, time: "4 hours ago", balance: 3500, ref: "WTH-8832" },
                  { provider: "InnBucks", type: "deposit", amount: 1000, time: "1 day ago", balance: 2100, ref: "DEP-1209" },
                  { provider: "ZB Bank", type: "withdrawal", amount: 300, time: "2 days ago", balance: 5600, ref: "WTH-7731" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-md flex items-center justify-center ${item.type === "deposit" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                        {item.type === "deposit" ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                          {item.provider}
                          <span className="text-xs font-mono text-gray-400">#{item.ref}</span>
                        </p>
                        <p className="text-xs text-gray-500">{item.time} · {item.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${item.type === "deposit" ? "text-emerald-600" : "text-red-600"}`}>
                        {item.type === "deposit" ? "+" : "-"}${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Bal: ${item.balance.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts & tips */}
          <div className="space-y-4">
            <Card className="border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400 opacity-40 w-full" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" /> Alert Thresholds
                </CardTitle>
                <CardDescription>Low balance warnings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { provider: "EcoCash", level: "Critical", amount: 45.50, color: "text-red-600", bg: "bg-red-50" },
                  { provider: "OneMoney", level: "Warning", amount: 320.00, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border-l-3 border-l-red-500 bg-gray-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className={`w-4 h-4 ${item.color}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{item.provider}</p>
                        <p className={`text-xs font-medium ${item.color}`}>{item.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${item.amount.toFixed(2)}</p>
                      <button className="text-xs font-medium text-blue-600 hover:underline mt-0.5">Rebalance</button>
                    </div>
                  </div>
                ))}
                <div className="p-3 rounded-lg border-2 border-dashed border-gray-200 mt-4 text-center cursor-pointer hover:border-blue-300 transition-colors">
                  <p className="text-xs text-gray-400 font-medium hover:text-blue-600 transition-colors">
                    Configure thresholds
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="p-5 rounded-xl bg-gray-900 text-white">
              <div className="space-y-3">
                <h4 className="text-base font-semibold">Optimization Suggestion</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Consider rebalancing{" "}
                  <span className="text-white font-medium">$4,500</span> from ZB
                  Bank to EcoCash to prevent potential service disruption.
                </p>
                <Button
                  variant="outline"
                  className="w-full h-9 rounded-md bg-transparent border-gray-700 text-white hover:bg-gray-800 font-medium text-sm"
                >
                  Apply Recommendation
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

  const data = mockBalances[provider.name] || { balance: 0, threshold: 0, lastUpdated: "—" };
  const isLow = data.balance < data.threshold;
  const isCritical = data.balance < data.threshold * 0.5;

  return (
    <Card className={`border border-gray-200 dark:border-slate-700 shadow-sm ${
      isCritical ? "ring-2 ring-red-300" : isLow ? "ring-2 ring-amber-300" : ""
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          {isCritical ? (
            <Badge className="bg-red-100 text-red-700 border-none font-medium text-xs">
              Critical
            </Badge>
          ) : isLow ? (
            <Badge className="bg-amber-100 text-amber-700 border-none font-medium text-xs">
              Warning
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-700 border-none font-medium text-xs">
              Healthy
            </Badge>
          )}
        </div>
        <CardTitle className="text-base pt-2">{provider.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Balance</p>
          <span className={`text-2xl font-bold tracking-tight ${isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"}`}>
            ${data.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Threshold</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-300">${data.threshold.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{data.lastUpdated}</p>
          </div>
        </div>

        {isCritical && (
          <div className="p-2.5 bg-red-50 dark:bg-red-900/10 rounded-md flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              Immediate top-up required to avoid service interruption.
            </p>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full h-9 rounded-md border-gray-200 dark:border-slate-700 font-medium text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
        >
          <ArrowRightCircle className="w-3.5 h-3.5 mr-1.5" /> View Details
        </Button>
      </CardContent>
    </Card>
  );
}
