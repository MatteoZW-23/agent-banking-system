import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Activity,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();

  // Fetch data for supervisor
  const floatRequests = trpc.nodes.listFloatRequests.useQuery({ status: "pending" });
  const employees = trpc.nodes.listEmployees.useQuery();
  const alerts = trpc.alerts.getHistory.useQuery({ limit: 5 });

  const processMutation = trpc.nodes.processRequest.useMutation({
    onSuccess: () => {
      floatRequests.refetch();
    },
  });

  const handleApprove = async (id: number) => {
    try {
      await processMutation.mutateAsync({
        id,
        status: "approved",
        adminNotes: "Approved by Regional Supervisor",
      });
      toast.success("Float request approved. Auto-settlement check triggered.");
    } catch {
      toast.error("Could not approve request. Please try again.");
    }
  };

  const handleDecline = async (id: number) => {
    try {
      await processMutation.mutateAsync({
        id,
        status: "declined",
        adminNotes: "Declined by Regional Supervisor",
      });
      toast.info("Float request declined.");
    } catch {
      toast.error("Could not decline request.");
    }
  };

  const pendingCount = floatRequests.data?.length || 0;
  const totalEmployees = employees.data?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Manager's Office
            </h1>
            <p className="text-xs text-slate-500">Welcome back, {user?.name || "Manager"}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={logout}
          className="text-xs font-bold uppercase tracking-widest"
        >
          Sign Out
        </Button>
      </header>

      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Pending Approvals",
              value: pendingCount,
              icon: Clock,
              color: "text-amber-500",
              bg: "bg-amber-50",
            },
            {
              label: "Active Agents",
              value: totalEmployees,
              icon: Users,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "Open Alerts",
              value: alerts.data?.filter((a: any) => a.status === "triggered").length || 0,
              icon: AlertTriangle,
              color: "text-rose-500",
              bg: "bg-rose-50",
            },
            {
              label: "Supervisor Pool (5%)",
              value: "Auto-calculated",
              icon: TrendingUp,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white"
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Float Request Queue */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                Money Requests
                {pendingCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-none font-black">
                    {pendingCount} waiting
                  </Badge>
                )}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => floatRequests.refetch()}
                className="text-[10px] font-bold uppercase tracking-widest"
              >
                Refresh
              </Button>
            </div>

            {floatRequests.isLoading && (
              <div className="text-center py-12 text-slate-400 font-medium">Loading requests...</div>
            )}

            {!floatRequests.isLoading && pendingCount === 0 && (
              <Card className="border-none shadow-lg rounded-2xl bg-white">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                  <p className="font-black text-slate-900 uppercase tracking-tight">All Clear</p>
                  <p className="text-sm text-slate-500 mt-2">No pending float requests right now.</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {floatRequests.data?.map((req: any) => (
                <Card
                  key={req.id}
                  className="border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white border-l-4 border-amber-400"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-black text-slate-900 text-lg">${req.amount}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Employee #{req.employeeId} · Provider #{req.providerId}
                        </p>
                      </div>
                      <Badge className="bg-amber-50 text-amber-600 border-amber-200 font-bold text-[10px] uppercase">
                        Pending
                      </Badge>
                    </div>

                    {req.workerNotes && (
                      <div className="p-4 bg-slate-50 rounded-xl mb-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Agent Note
                        </p>
                        <p className="text-sm text-slate-700 italic">"{req.workerNotes}"</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(req.id)}
                        disabled={processMutation.isPending}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-black text-[10px] uppercase tracking-widest"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDecline(req.id)}
                        disabled={processMutation.isPending}
                        className="flex-1 border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl h-11 font-black text-[10px] uppercase tracking-widest"
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Activity className="h-5 w-5 text-rose-500" />
              Security Alerts
            </h2>

            <div className="space-y-3">
              {alerts.data?.map((alert: any) => (
                <Card
                  key={alert.id}
                  className="border-none shadow rounded-2xl bg-white"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                          alert.severity === "critical"
                            ? "bg-rose-500"
                            : alert.severity === "high"
                            ? "bg-amber-500"
                            : "bg-blue-400"
                        }`}
                      />
                      <div>
                        <p className="text-xs font-black text-slate-900 leading-snug">
                          {alert.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!alerts.data || alerts.data.length === 0) && (
                <Card className="border-none shadow rounded-2xl bg-white">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-slate-400 font-medium">No alerts at this time.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Commission Info */}
            <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white mt-6">
              <CardContent className="p-6">
                <BarChart3 className="h-8 w-8 mb-4 opacity-80" />
                <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">
                  Your 5% Share
                </p>
                <p className="text-2xl font-black">Manager Pay</p>
                <p className="text-xs opacity-70 mt-2 leading-relaxed">
                  You earn 5% from every single commission made by agents in this network.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
