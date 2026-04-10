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
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

export default function Reconciliation() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);

  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const reconcileProviderMutation =
    trpc.reconciliation.reconcileProvider.useMutation();
  const reconcileAllMutation = trpc.reconciliation.reconcileAll.useMutation();

  const handleReconcileProvider = async () => {
    if (!selectedProvider) return;
    const date = new Date(selectedDate);
    await reconcileProviderMutation.mutateAsync({
      providerId: selectedProvider,
      date,
    });
  };

  const handleReconcileAll = async () => {
    const date = new Date(selectedDate);
    await reconcileAllMutation.mutateAsync({ date });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "matched":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-none px-2 py-0.5 font-medium text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Matched
          </Badge>
        );
      case "mismatch":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-none px-2 py-0.5 font-medium text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" /> Mismatch
          </Badge>
        );
      case "investigating":
        return (
          <Badge className="bg-red-50 text-red-700 border-none px-2 py-0.5 font-medium text-xs">
            <Activity className="w-3 h-3 mr-1" /> Investigating
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="font-medium text-xs">
            {status}
          </Badge>
        );
    }
  };

  if (!isAuthenticated) return null;

  const latestReport = reconcileProviderMutation.data;
  const allReports = reconcileAllMutation.data;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Reconciliation"
          subtitle="Compare your records with provider statements."
          category="Finance"
          actions={
            <Button
              onClick={handleReconcileAll}
              disabled={reconcileAllMutation.isPending}
              className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 font-medium text-sm"
            >
              {reconcileAllMutation.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-white" />
              ) : (
                <Zap className="mr-2 h-4 w-4 text-white" />
              )}
              Reconcile All
            </Button>
          }
          onRefresh={() => {
            providersQuery.refetch();
            toast.success("Refreshed");
          }}
        />

        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full h-9 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Provider
            </label>
            <select
              value={selectedProvider || ""}
              onChange={e =>
                setSelectedProvider(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full h-9 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select provider...</option>
              {providersQuery.data?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleReconcileProvider}
              disabled={
                !selectedProvider || reconcileProviderMutation.isPending
              }
              className="w-full h-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
            >
              {reconcileProviderMutation.isPending
                ? "Processing..."
                : "Run Reconciliation"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Report */}
          <div className="lg:col-span-2 space-y-6">
            {latestReport ? (
              <Card className="border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400 w-full" />
                <CardHeader className="flex flex-row items-center justify-between pt-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{latestReport.providerName}</CardTitle>
                      {getStatusBadge(latestReport.status)}
                    </div>
                    <CardDescription className="font-mono text-xs mt-1">
                      Date: {latestReport.date}
                    </CardDescription>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Summary metrics */}
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Expected</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${latestReport.totalExpected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Actual</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${latestReport.totalActual.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Difference</p>
                      <p className={`text-lg font-bold ${latestReport.discrepancy < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        ${latestReport.discrepancy.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Variance</p>
                      <p className={`text-lg font-bold ${Math.abs(latestReport.discrepancyPercentage) > 5 ? "text-red-600" : "text-emerald-600"}`}>
                        {latestReport.discrepancyPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 rounded-lg flex flex-col items-center text-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 mb-2" />
                      <p className="text-xs text-gray-500 mb-0.5">Matched</p>
                      <p className="text-3xl font-bold text-emerald-600">{latestReport.matchedCount}</p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 rounded-lg flex flex-col items-center text-center">
                      <AlertTriangle className="h-6 w-6 text-amber-600 mb-2" />
                      <p className="text-xs text-gray-500 mb-0.5">Mismatch</p>
                      <p className="text-3xl font-bold text-amber-600">{latestReport.mismatchCount}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 rounded-lg flex flex-col items-center text-center">
                      <RefreshCw className="h-6 w-6 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500 mb-0.5">Unprocessed</p>
                      <p className="text-3xl font-bold text-gray-500">{latestReport.unmatchedCount}</p>
                    </div>
                  </div>

                  {/* Mismatch details */}
                  {latestReport.mismatches.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                      <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-red-500" /> Discrepancies
                      </h3>
                      <div className="space-y-2">
                        {latestReport.mismatches.map(
                          (mismatch: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                            >
                              <div>
                                <p className="text-xs font-mono text-gray-400">
                                  REF: {mismatch.reference}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-slate-200 mt-0.5">
                                  Expected{" "}
                                  <span className="text-emerald-600 font-medium">
                                    ${mismatch.expected.toFixed(2)}
                                  </span>{" "}
                                  vs. Actual{" "}
                                  <span className="text-amber-600 font-medium">
                                    ${mismatch.actual.toFixed(2)}
                                  </span>
                                </p>
                              </div>
                              <Badge className="bg-red-50 text-red-600 border-none px-2 py-0.5 font-medium text-xs">
                                -${mismatch.difference.toFixed(2)}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                <ClipboardCheck className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                  Ready to reconcile
                </h3>
                <p className="text-sm text-gray-400 max-w-xs mt-1 text-center">
                  Select a provider and date above to compare transactions.
                </p>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="space-y-6">
            <Card className="border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col">
              <CardHeader className="pb-4 border-b border-gray-100 dark:border-slate-700">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-gray-400" /> Summary
                </CardTitle>
                <CardDescription>All providers overview</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {allReports && allReports.length > 0 ? (
                  <div className="space-y-3">
                    {allReports.map((report: any) => (
                      <div
                        key={report.providerId}
                        className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-md flex items-center justify-center ${report.status === "matched" ? "bg-emerald-50" : "bg-amber-50"}`}>
                              {report.status === "matched" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                                {report.providerName}
                              </p>
                              <p className="text-xs text-gray-500">
                                ${report.totalActual.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${report.discrepancy === 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {report.discrepancy === 0
                                ? "Matched"
                                : `-$${report.discrepancy.toLocaleString()}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {report.discrepancyPercentage.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        <div className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ${report.status === "matched" ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{
                              width: `${Math.max(10, 100 - Math.abs(report.discrepancyPercentage))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center flex flex-col items-center">
                    <Activity className="h-8 w-8 text-gray-300 mb-3" />
                    <p className="text-xs text-gray-400">
                      Run "Reconcile All" to see results
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance note */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <h4 className="text-sm font-semibold">Audit Active</h4>
                </div>
                <p className="text-sm text-blue-100 leading-relaxed">
                  The system auto-flags any mismatch exceeding <span className="text-white font-semibold">$5.00</span> for manual review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
