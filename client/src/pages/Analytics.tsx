import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Users, DollarSign, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const [selectedDays, setSelectedDays] = useState(30);

  // Fetch analytics data
  const transactionTrends = trpc.analytics.getTransactionTrends.useQuery({ days: selectedDays });
  const providerMetrics = trpc.analytics.getProviderMetrics.useQuery();
  const employeePerformance = trpc.analytics.getEmployeePerformance.useQuery();
  const dailySummary = trpc.analytics.getDailyFinancialSummary.useQuery({});
  const volumeByProvider = trpc.analytics.getTransactionVolumeByProvider.useQuery();
  const statusDistribution = trpc.analytics.getTransactionStatusDistribution.useQuery({ days: selectedDays });
  const hourlyPattern = trpc.analytics.getHourlyTransactionPattern.useQuery({ days: 7 });

  // Format hourly data for display
  const hourlyData = useMemo(() => {
    if (!hourlyPattern.data) return [];
    return hourlyPattern.data.map((h: any) => ({
      hour: `${h.hour}:00`,
      transactions: h.count,
      volume: h.volume,
    }));
  }, [hourlyPattern.data]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Transaction trends, provider performance, and financial insights</p>
        </div>

        {/* Time Period Selector */}
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDays === days
                  ? "bg-blue-600 text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              Last {days} Days
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${dailySummary.data?.totalTransactionVolume.toLocaleString("en-US", { maximumFractionDigits: 2 }) || "0"}
              </p>
              <p className="text-xs text-muted-foreground">Today's transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Transaction Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dailySummary.data?.totalTransactionCount || 0}</p>
              <p className="text-xs text-muted-foreground">Today's transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dailySummary.data?.activeProviders || 0}</p>
              <p className="text-xs text-muted-foreground">Connected providers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Float
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${dailySummary.data?.totalFloatBalance.toLocaleString("en-US", { maximumFractionDigits: 2 }) || "0"}
              </p>
              <p className="text-xs text-muted-foreground">Across all providers</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Transaction Trends
            </CardTitle>
            <CardDescription>Daily transaction volume and count over time</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionTrends.isLoading ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : transactionTrends.data && transactionTrends.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={transactionTrends.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="#3b82f6"
                    name="Total Volume ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="transactionCount"
                    stroke="#10b981"
                    name="Transaction Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Provider Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Provider Performance
              </CardTitle>
              <CardDescription>Transaction volume by provider</CardDescription>
            </CardHeader>
            <CardContent>
              {providerMetrics.isLoading ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : providerMetrics.data && providerMetrics.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={providerMetrics.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="providerName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalVolume" fill="#3b82f6" name="Volume ($)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Transaction Status
              </CardTitle>
              <CardDescription>Distribution of transaction statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {statusDistribution.isLoading ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : statusDistribution.data && statusDistribution.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution.data}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {statusDistribution.data.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hourly Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Transaction Pattern</CardTitle>
            <CardDescription>Transaction activity by hour of day (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyPattern.isLoading ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="transactions" fill="#3b82f6" name="Transaction Count" />
                  <Bar yAxisId="right" dataKey="volume" fill="#10b981" name="Volume ($)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Volume by Provider Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume Distribution</CardTitle>
            <CardDescription>Percentage of total volume by provider</CardDescription>
          </CardHeader>
          <CardContent>
            {volumeByProvider.isLoading ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : volumeByProvider.data && volumeByProvider.data.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={volumeByProvider.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    >
                      {volumeByProvider.data.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {volumeByProvider.data.map((provider: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${provider.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">{provider.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Top Employees */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Employees</CardTitle>
            <CardDescription>Employees with highest transaction volumes</CardDescription>
          </CardHeader>
          <CardContent>
            {employeePerformance.isLoading ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">Loading...</div>
            ) : employeePerformance.data && employeePerformance.data.length > 0 ? (
              <div className="space-y-3">
                {employeePerformance.data.slice(0, 5).map((emp: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{emp.employeeName}</p>
                      <p className="text-sm text-muted-foreground">Code: {emp.uniqueCode} • Top: {emp.topProvider}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${emp.totalVolume.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">{emp.totalTransactions} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-muted-foreground">No employee data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
