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
import {
  AlertCircle,
  TrendingUp,
  DollarSign,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  FileText,
  MousePointer2,
  ShieldCheck,
  ShieldCheck as ShieldCheckIcon,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Smartphone,
  Banknote,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";

function FloatRequestAction({
  request,
  onProcessed,
}: {
  request: any;
  onProcessed: () => void;
}) {
  const [ref, setRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const processMutation = trpc.nodes.processRequest.useMutation();
  const providersQuery = trpc.providers.list.useQuery();
  const employeesQuery = trpc.nodes.listEmployees.useQuery();

  const handleAction = async (status: "transferred" | "declined") => {
    if (status === "transferred" && !ref) {
      toast.error("Enter transaction reference (Bank/MoMo Ref)");
      return;
    }

    setIsProcessing(true);
    try {
      await processMutation.mutateAsync({
        id: request.id,
        status,
        transactionReference: ref,
        adminNotes:
          status === "transferred"
            ? "Approved and transferred"
            : "Declined by admin",
      });
      toast.success(`Request ${status} successfully`);
      onProcessed();
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const employee = employeesQuery.data?.find(e => e.id === request.employeeId);
  const provider = providersQuery.data?.find(p => p.id === request.providerId);

  return (
    <div className="p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl space-y-4 hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-semibold text-sm">
            {employee?.name?.[0] || "A"}
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white block">
              {employee?.name}
            </span>
            <span className="text-xs text-gray-500">
              {provider?.name}
            </span>
          </div>
        </div>
        <div className="text-right">
           <span className="text-xl font-bold text-gray-900 dark:text-white">
             ${request.amount}
           </span>
           <p className="text-xs text-blue-600 font-medium mt-0.5">Pending</p>
        </div>
      </div>

      {request.workerNotes && (
        <p className="text-xs text-gray-500 italic bg-gray-50 dark:bg-slate-900 p-2 rounded-md border border-gray-100 dark:border-slate-700">
          "{request.workerNotes}"
        </p>
      )}

      <div className="space-y-2.5">
        <input
          placeholder="Transfer Reference (Bank/MoMo Auth ID)"
          value={ref}
          onChange={e => setRef(e.target.value)}
          className="w-full h-9 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
        />
        <div className="flex gap-2">
          <Button
            onClick={() => handleAction("transferred")}
            disabled={isProcessing}
            className="flex-1 h-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            {isProcessing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              "Approve & Send"
            )}
          </Button>
          <Button
            onClick={() => handleAction("declined")}
            disabled={isProcessing}
            variant="outline"
            className="h-9 px-3 rounded-md border-gray-200 text-red-500 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const [selectedDate] = useState(new Date());
  const [_, setLocation] = useLocation();

  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const floatQuery = trpc.floats.getTotalBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const alertsQuery = trpc.alerts.getHistory.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );
  const dailySummaryQuery = trpc.reports.dailySummary.useQuery(
    { date: selectedDate },
    { enabled: isAuthenticated }
  );

  const floatRequestsQuery = trpc.nodes.listFloatRequests.useQuery(
    {},
    { enabled: isAuthenticated, refetchInterval: 5000 }
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) return <DashboardLayout />;

  const stats = [
    {
      title: "Total Float Balance",
      value: `$${floatQuery.data ? parseFloat(floatQuery.data).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}`,
      description: "All provider accounts combined",
      icon: DollarSign,
      trend: "+2.5%",
      trendUp: true,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Active Providers",
      value: providersQuery.data?.length || 0,
      description: "Live payment gateways",
      icon: Zap,
      trend: "Stable",
      trendUp: true,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      title: "Today's Transactions",
      value: dailySummaryQuery.data?.transactionCount || 0,
      description: `$${dailySummaryQuery.data?.totalAmount.toLocaleString() || "0.00"} processed`,
      icon: TrendingUp,
      trend: "+12%",
      trendUp: true,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Pending Requests",
      value: (floatRequestsQuery.data?.filter((r: any) => r.status === "pending" || r.status === "verified") || []).length,
      description: "Float top-up queue",
      icon: Banknote,
      trend: "+3",
      trendUp: true,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${user?.name || "Administrator"}. Here's your business overview.`}
          actions={
            <Button 
               onClick={() => {
                 providersQuery.refetch();
                 floatQuery.refetch();
                 dailySummaryQuery.refetch();
                 toast.success("Data refreshed");
               }}
               className="h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 font-medium text-sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          }
        />

        {/* KPI cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border border-gray-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div
                  className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${stat.trendUp ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-700 bg-red-50"}`}
                >
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  )}
                  {stat.trend}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  {stat.title}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {stat.description}
                </p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-gray-400">System Status</p>
                    <p className="text-sm font-semibold text-emerald-600">Active</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200 dark:bg-slate-600" />
                  <div>
                    <p className="text-xs text-gray-400">Network Nodes</p>
                    <p className="text-sm font-semibold text-blue-600">Sync</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Float requests queue */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Float Requests
              </h3>
              <Badge className="bg-red-100 text-red-700 border-none font-medium text-xs">
                Action Required
              </Badge>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {floatRequestsQuery.data
                ?.filter((r: any) => r.status === "pending" || r.status === "verified")
                .map((request: any) => (
                  <div key={request.id} className="relative">
                    {request.status === "verified" && (
                      <div className="absolute -top-2 -right-2 z-20 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-semibold rounded-full shadow-md flex items-center gap-1">
                        <ShieldCheckIcon className="h-3 w-3" /> Verified
                      </div>
                    )}
                    <FloatRequestAction
                      request={request}
                      onProcessed={() => floatRequestsQuery.refetch()}
                    />
                  </div>
                ))}
              {(!floatRequestsQuery.data ||
                floatRequestsQuery.data.filter(
                  (r: any) => r.status === "pending" || r.status === "verified"
                ).length === 0) && (
                <div className="p-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center text-center">
                  <CheckCircle className="h-8 w-8 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">
                    No pending requests.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent alerts */}
          <Card className="lg:col-span-5 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Security logs and alerts</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {alertsQuery.isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                </div>
              ) : alertsQuery.data && alertsQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {alertsQuery.data.map((alert: any) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg"
                    >
                      <div
                        className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                          alert.severity === "critical"
                            ? "bg-red-500"
                            : alert.severity === "high"
                              ? "bg-orange-500"
                              : "bg-amber-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                          {alert.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {new Date(alert.triggeredAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ShieldCheckIcon className="h-10 w-10 text-gray-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm text-gray-400">
                    No active alerts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white pl-1">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  label: "Reconciliation",
                  icon: RefreshCw,
                  color: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                  path: "/reconciliation",
                },
                {
                  label: "Staff Directory",
                  icon: Zap,
                  color: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                  path: "/nodes",
                },
                {
                  label: "Float Management",
                  icon: DollarSign,
                  color: "text-orange-600",
                  bg: "bg-orange-50 dark:bg-orange-900/20",
                  path: "/floats",
                },
                {
                  label: "Provider Status",
                  icon: ShieldCheck,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 dark:bg-emerald-900/20",
                  path: "/provider-config",
                },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => setLocation(action.path)}
                  className="flex items-center justify-between w-full p-3.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-300 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${action.bg}`}>
                      <action.icon className={`h-4 w-4 ${action.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                      {action.label}
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>

            {/* Summary card */}
            <div className="p-6 rounded-xl bg-gray-900 text-white">
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                  Network Summary
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Float is moving across your agent network. Approve pending requests on the left panel.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div>
                    <span className="text-lg font-bold">
                       ${floatRequestsQuery.data?.filter((r: any) => r.status === "pending").reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0).toFixed(2) || "0.00"}
                    </span>
                    <span className="text-xs text-gray-500 block mt-0.5">Pending</span>
                  </div>
                  <div className="h-6 w-px bg-gray-700" />
                  <div>
                    <span className="text-lg font-bold">{trpc.nodes.listBranches.useQuery().data?.length || 0}</span>
                    <span className="text-xs text-gray-500 block mt-0.5">Branches</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
