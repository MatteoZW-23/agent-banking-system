import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "matched":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "mismatch":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case "investigating":
        return <Clock className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "matched":
        return "bg-green-100 text-green-800";
      case "mismatch":
        return "bg-orange-100 text-orange-800";
      case "investigating":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const latestReport = reconcileProviderMutation.data;
  const allReports = reconcileAllMutation.data;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reconciliation</h1>
          <p className="text-muted-foreground mt-2">
            Reconcile transactions between internal ledger and provider systems
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Provider</label>
                <select
                  value={selectedProvider || ""}
                  onChange={(e) => setSelectedProvider(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  <option value="">All Providers</option>
                  {providersQuery.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleReconcileProvider}
                  disabled={!selectedProvider || reconcileProviderMutation.isPending}
                  className="flex-1"
                >
                  {reconcileProviderMutation.isPending ? "Reconciling..." : "Reconcile Provider"}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleReconcileAll}
              disabled={reconcileAllMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {reconcileAllMutation.isPending ? "Reconciling All..." : "Reconcile All Providers"}
            </Button>
          </CardContent>
        </Card>

        {/* Latest Report */}
        {latestReport && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{latestReport.providerName}</CardTitle>
                  <CardDescription>{latestReport.date}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(latestReport.status)}
                  <Badge className={getStatusColor(latestReport.status)}>
                    {latestReport.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Expected Total</p>
                  <p className="text-lg font-semibold">
                    ${latestReport.totalExpected.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Actual Total</p>
                  <p className="text-lg font-semibold">
                    ${latestReport.totalActual.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Discrepancy</p>
                  <p className={`text-lg font-semibold ${latestReport.discrepancy < 0 ? "text-red-600" : "text-green-600"}`}>
                    ${latestReport.discrepancy.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Discrepancy %</p>
                  <p className={`text-lg font-semibold ${Math.abs(latestReport.discrepancyPercentage) > 5 ? "text-red-600" : "text-green-600"}`}>
                    {latestReport.discrepancyPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Transaction Matching */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-3 border rounded-lg bg-green-50">
                  <p className="text-xs text-muted-foreground">Matched</p>
                  <p className="text-2xl font-bold text-green-600">{latestReport.matchedCount}</p>
                </div>
                <div className="p-3 border rounded-lg bg-orange-50">
                  <p className="text-xs text-muted-foreground">Mismatched</p>
                  <p className="text-2xl font-bold text-orange-600">{latestReport.mismatchCount}</p>
                </div>
                <div className="p-3 border rounded-lg bg-gray-50">
                  <p className="text-xs text-muted-foreground">Unmatched</p>
                  <p className="text-2xl font-bold text-gray-600">{latestReport.unmatchedCount}</p>
                </div>
              </div>

              {/* Mismatches */}
              {latestReport.mismatches.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Transaction Mismatches</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {latestReport.mismatches.map((mismatch, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-xs">{mismatch.reference}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Expected: ${mismatch.expected.toFixed(2)} | Actual: ${mismatch.actual.toFixed(2)}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            ${mismatch.difference.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Reports Summary */}
        {allReports && allReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Providers Reconciliation</CardTitle>
              <CardDescription>Reconciliation status for {allReports.length} providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allReports.map((report) => (
                  <div
                    key={report.providerId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(report.status)}
                      <div>
                        <p className="font-medium">{report.providerName}</p>
                        <p className="text-xs text-muted-foreground">
                          Expected: ${report.totalExpected.toFixed(2)} | Actual: ${report.totalActual.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          ${report.discrepancy.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.discrepancyPercentage.toFixed(2)}%
                        </p>
                      </div>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
