import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";

export default function Floats() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });

  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const totalFloatQuery = trpc.floats.getTotalBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  const totalBalance = totalFloatQuery.data ? parseFloat(totalFloatQuery.data) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Float Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage float balances across all providers
          </p>
        </div>

        {/* Total Balance */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Total Float Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              ${totalBalance.toFixed(2)}
            </div>
            <p className="text-sm text-blue-700 mt-2">
              Across {providersQuery.data?.length || 0} active providers
            </p>
          </CardContent>
        </Card>

        {/* Provider Floats Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Provider Balances</h2>
          {providersQuery.isLoading ? (
            <p className="text-muted-foreground">Loading provider data...</p>
          ) : providersQuery.data && providersQuery.data.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providersQuery.data.map((provider) => (
                <ProviderFloatCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No providers configured</p>
          )}
        </div>

        {/* Float Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Float Alerts</CardTitle>
            <CardDescription>Providers with low or critical float levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">EcoCash - Critical</p>
                    <p className="text-xs text-red-700">Balance below $100 threshold</p>
                  </div>
                  <Badge className="bg-red-600">$45.50</Badge>
                </div>
              </div>
              <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-900">OneMoney - Warning</p>
                    <p className="text-xs text-orange-700">Balance below $500 threshold</p>
                  </div>
                  <Badge className="bg-orange-600">$320.00</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Float History */}
        <Card>
          <CardHeader>
            <CardTitle>Float Movement History</CardTitle>
            <CardDescription>Recent float transactions and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { provider: "EcoCash", type: "deposit", amount: 500, time: "2 hours ago", balance: 1250 },
                { provider: "OneMoney", type: "withdrawal", amount: 200, time: "4 hours ago", balance: 3500 },
                { provider: "InnBucks", type: "deposit", amount: 1000, time: "1 day ago", balance: 2100 },
                { provider: "ZB Bank", type: "withdrawal", amount: 300, time: "2 days ago", balance: 5600 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.type === "deposit" ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{item.provider}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${item.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                      {item.type === "deposit" ? "+" : "-"}${item.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Balance: ${item.balance.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function ProviderFloatCard({ provider }: { provider: any }) {
  // Mock data - in production, fetch from API
  const mockBalances: Record<string, { balance: number; threshold: number; lastUpdated: string }> = {
    "EcoCash": { balance: 1250.50, threshold: 500, lastUpdated: "2 minutes ago" },
    "OneMoney": { balance: 3200.00, threshold: 1000, lastUpdated: "5 minutes ago" },
    "InnBucks": { balance: 2100.75, threshold: 800, lastUpdated: "10 minutes ago" },
    "ZB Bank": { balance: 5600.00, threshold: 2000, lastUpdated: "3 minutes ago" },
    "CBZ": { balance: 1800.25, threshold: 1000, lastUpdated: "15 minutes ago" },
    "NMB": { balance: 4200.00, threshold: 1500, lastUpdated: "7 minutes ago" },
  };

  const data = mockBalances[provider.name] || { balance: 0, threshold: 0, lastUpdated: "N/A" };
  const isLow = data.balance < data.threshold;
  const isCritical = data.balance < data.threshold * 0.5;

  return (
    <Card className={isCritical ? "border-red-300 bg-red-50" : isLow ? "border-orange-300 bg-orange-50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{provider.name}</CardTitle>
          {isCritical ? (
            <Badge className="bg-red-600">Critical</Badge>
          ) : isLow ? (
            <Badge className="bg-orange-600">Low</Badge>
          ) : (
            <Badge className="bg-green-600">Healthy</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className={`text-2xl font-bold ${isCritical ? "text-red-600" : isLow ? "text-orange-600" : "text-green-600"}`}>
            ${data.balance.toFixed(2)}
          </p>
        </div>
        <div className="flex justify-between text-xs">
          <div>
            <p className="text-muted-foreground">Minimum Threshold</p>
            <p className="font-medium">${data.threshold.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Last Updated</p>
            <p className="font-medium">{data.lastUpdated}</p>
          </div>
        </div>
        {isCritical && (
          <div className="p-2 bg-red-100 rounded text-xs text-red-800">
            ⚠️ Float is critically low. Immediate action required.
          </div>
        )}
        {isLow && !isCritical && (
          <div className="p-2 bg-orange-100 rounded text-xs text-orange-800">
            ⚠️ Float is below minimum threshold. Consider depositing.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
