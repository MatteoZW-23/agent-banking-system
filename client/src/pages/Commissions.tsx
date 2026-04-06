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

export default function Commissions() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor employee commissions and performance
          </p>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Report Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalCommission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {report?.period || "Selected period"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{employeeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">With transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${employeeCount > 0 ? (totalCommission / employeeCount).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per employee</p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Commission Details */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Commission Breakdown</CardTitle>
            <CardDescription>
              Detailed commission for each employee during the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportQuery.isLoading ? (
              <p className="text-muted-foreground">Loading commission data...</p>
            ) : report && report.details.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.details.map((emp) => (
                      <TableRow key={emp.employeeCode}>
                        <TableCell className="font-mono text-sm">{emp.employeeCode}</TableCell>
                        <TableCell>{emp.employeeName}</TableCell>
                        <TableCell className="text-right">{emp.transactionCount}</TableCell>
                        <TableCell className="text-right">
                          ${typeof emp.totalAmount === "string"
                            ? parseFloat(emp.totalAmount).toFixed(2)
                            : (emp.totalAmount as number).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${typeof emp.totalCommission === "string"
                            ? parseFloat(emp.totalCommission).toFixed(2)
                            : (emp.totalCommission as number).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No commission data for the selected period
              </p>
            )}
          </CardContent>
        </Card>

        {/* Transaction Type Breakdown */}
        {report && report.details.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Commission by Transaction Type</CardTitle>
              <CardDescription>
                Commission breakdown by transaction type across all employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["cash_out", "cash_in", "send_money", "receive_money", "bill_payment", "airtime"].map(
                  (type) => {
                    const typeCommission = report.details.reduce((sum, emp) => {
                      const breakdown = emp.commissionBreakdown.find((b) => b.transactionType === type);
                      return sum + (breakdown?.commission || 0);
                    }, 0);

                    if (typeCommission === 0) return null;

                    return (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{type.replace(/_/g, " ").toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.details.reduce((sum, emp) => {
                              const breakdown = emp.commissionBreakdown.find((b) => b.transactionType === type);
                              return sum + (breakdown?.count || 0);
                            }, 0)}{" "}
                            transactions
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          ${typeCommission.toFixed(2)}
                        </Badge>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Performers */}
        {report && report.details.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Employees with highest commission earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.details
                  .sort((a, b) => {
                    const aComm = typeof a.totalCommission === "string"
                      ? parseFloat(a.totalCommission)
                      : (a.totalCommission as number);
                    const bComm = typeof b.totalCommission === "string"
                      ? parseFloat(b.totalCommission)
                      : (b.totalCommission as number);
                    return bComm - aComm;
                  })
                  .slice(0, 5)
                  .map((emp, idx) => (
                    <div key={emp.employeeCode} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-gray-200 text-gray-800">{idx + 1}</Badge>
                        <div>
                          <p className="font-medium">{emp.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{emp.transactionCount} transactions</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        ${typeof emp.totalCommission === "string"
                          ? parseFloat(emp.totalCommission).toFixed(2)
                          : (emp.totalCommission as number).toFixed(2)}
                      </p>
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
