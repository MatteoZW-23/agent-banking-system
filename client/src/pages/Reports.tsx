import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Calendar, Download, FileText } from "lucide-react";

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reportType, setReportType] = useState<"daily" | "pnl" | "provider" | "commission">("daily");

  const dailySummary = trpc.reports.dailySummary.useQuery(
    { date: new Date(selectedDate) },
    { enabled: reportType === "daily" }
  );

  const agentPnL = trpc.reports.agentPnL.useQuery(
    {
      startDate: new Date(new Date(selectedDate).getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(selectedDate),
    },
    { enabled: reportType === "pnl" }
  );

  const providerBreakdown = trpc.reports.providerBreakdown.useQuery(
    { date: new Date(selectedDate) },
    { enabled: reportType === "provider" }
  );

  const commissionReport = trpc.commissions.getReport.useQuery(
    {
      startDate: new Date(new Date(selectedDate).getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(selectedDate),
    },
    { enabled: reportType === "commission" }
  );

  const handleExport = () => {
    // Export functionality would go here
    console.log("Exporting report...");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and export system reports</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Report Type</CardTitle>
              <CardDescription>Select the type of report to generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["daily", "pnl", "provider", "commission"].map((type) => (
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reportType"
                    value={type}
                    checked={reportType === type}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{type === "pnl" ? "Agent P&L" : type} Report</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Date Range</CardTitle>
              <CardDescription>Select the date for the report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {reportType === "daily" && dailySummary.data && (
          <Card>
            <CardHeader>
              <CardTitle>Daily Summary</CardTitle>
              <CardDescription>Transaction summary for {selectedDate}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{dailySummary.data.transactionCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">${dailySummary.data.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Fees</p>
                  <p className="text-2xl font-bold">${dailySummary.data.totalFees.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {dailySummary.data.transactionCount > 0
                      ? ((dailySummary.data.completedCount / dailySummary.data.transactionCount) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === "provider" && providerBreakdown.data && (
          <Card>
            <CardHeader>
              <CardTitle>Provider Breakdown</CardTitle>
              <CardDescription>Transaction breakdown by provider for {selectedDate}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerBreakdown.data.map((provider: any) => (
                  <div key={provider.provider} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{provider.provider}</h3>
                      <span className="text-sm text-muted-foreground">${provider.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Transactions</p>
                        <p className="font-semibold">{provider.transactionCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-semibold text-green-600">{provider.completedCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-semibold text-red-600">{provider.failedCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
