import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function Transactions() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });

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

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "reversed":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all transactions across providers
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
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
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: new Date(e.target.value) })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={dateRange.end.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: new Date(e.target.value) })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Showing {transactionsQuery.data?.length || 0} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading transactions...</p>
            ) : transactionsQuery.data && transactionsQuery.data.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Recon Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsQuery.data.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="font-mono text-xs">
                          {txn.providerReference
                            ? (typeof txn.providerReference === "string"
                                ? txn.providerReference.substring(0, 20)
                                : "N/A")
                            : "N/A"}...
                        </TableCell>
                        <TableCell>{getTypeLabel(txn.type)}</TableCell>
                        <TableCell>
                          ${typeof txn.amount === "string"
                            ? parseFloat(txn.amount).toFixed(2)
                            : (txn.amount as number).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ${txn.fee
                            ? (typeof txn.fee === "string"
                                ? parseFloat(txn.fee).toFixed(2)
                                : (txn.fee as number).toFixed(2))
                            : "0.00"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(txn.status)}>
                            {txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(txn.transactionTime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{txn.reconciliationStatus}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transactions found</p>
            )}
          </CardContent>
        </Card>

        {/* Flagged Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Flagged Transactions</CardTitle>
            <CardDescription>Transactions requiring review</CardDescription>
          </CardHeader>
          <CardContent>
            {flaggedQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading flagged transactions...</p>
            ) : flaggedQuery.data && flaggedQuery.data.length > 0 ? (
              <div className="space-y-3">
                {flaggedQuery.data.slice(0, 10).map((flag) => (
                  <div key={flag.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{flag.flagType}</p>
                        <p className="text-xs text-muted-foreground mt-1">{flag.reason}</p>
                      </div>
                      <Badge
                        className={
                          flag.riskScore
                            ? (typeof flag.riskScore === "string"
                                ? parseFloat(flag.riskScore)
                                : (flag.riskScore as number)) > 0.7
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {flag.riskScore
                          ? ((typeof flag.riskScore === "string"
                              ? parseFloat(flag.riskScore)
                              : (flag.riskScore as number)) * 100).toFixed(0)
                          : "0"}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No flagged transactions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
