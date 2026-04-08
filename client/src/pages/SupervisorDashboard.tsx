import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";

function AgentEnrollmentForm({ onEnroll }: { onEnroll: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    branchId: 1, // Defaulting to first branch for now
  });

  const createMutation = trpc.nodes.createEmployee.useMutation({
    onSuccess: () => {
      toast.success("New Agent Enrolled Successfully");
      setFormData({ name: "", email: "", phone: "", branchId: 1 });
      onEnroll();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, role: "agent" });
  };

  return (
    <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
             <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight font-outfit italic">Agent Enrollment</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-400">Add verified personnel to the network</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input 
              placeholder="Full Legal Name" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all font-bold text-xs"
              required 
            />
          </div>
          <Input 
            type="email" 
            placeholder="Official Email Address" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all font-bold text-xs"
          />
          <Input 
            placeholder="Phone Number (+263...)" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all font-bold text-xs"
          />
          <Button 
            disabled={createMutation.isPending}
            className="w-full h-14 rounded-2xl premium-gradient text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            {createMutation.isPending ? "Validating..." : "Authorize Onboarding"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();

  // Fetch data for supervisor
  const floatRequests = trpc.nodes.listFloatRequests.useQuery({ status: "pending" });
  const employees = trpc.nodes.listEmployees.useQuery();
  const alerts = trpc.alerts.getHistory.useQuery({ limit: 5 });
  const payoutQuery = trpc.commissions.getSupervisorPayout.useQuery();

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
        adminNotes: "Pre-verified by Regional Supervisor",
      });
      toast.success("Request Verified. Sent to Owner for Final Transfer.");
    } catch {
      toast.error("Could not verify request.");
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
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar - Refined for Managers */}
      <header className="bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 font-outfit">
               Manager's<span className="text-primary not-italic">Office</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Regional Overseer: {user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 hidden md:flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Verified</span>
           </div>
           <Button
            variant="ghost"
            onClick={logout}
            className="h-12 px-6 rounded-2xl hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-rose-500 transition-all"
          >
            Secure Sign Out <XCircle className="ml-3 h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="p-8 space-y-12 max-w-7xl mx-auto pb-24">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Pending Verification",
              value: pendingCount,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50/50",
            },
            {
              label: "Managed Agents",
              value: totalEmployees,
              icon: Users,
              color: "text-primary",
              bg: "bg-primary/5",
            },
            {
              label: "Security Alerts",
              value: alerts.data?.filter((a: any) => a.status === "triggered").length || 0,
              icon: AlertTriangle,
              color: "text-rose-600",
              bg: "bg-rose-50/50",
            },
            {
              label: "Supervisor Pool (5%)",
              value: payoutQuery.data ? `$${payoutQuery.data.dailyPool.toFixed(2)}` : "$0.00",
              icon: TrendingUp,
              color: "text-emerald-500",
              bg: "bg-emerald-50/50",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="border border-slate-100 shadow-xl shadow-slate-200/30 rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-all"
            >
              <CardContent className="p-8 flex items-center gap-5">
                <div className={`h-16 w-16 rounded-3xl ${stat.bg} flex items-center justify-center shadow-inner`}>
                  <stat.icon className={`h-8 w-8 ${stat.color} group-hover:scale-110 transition-transform`} />
                </div>
                <div>
                   <p className="text-3xl font-black text-slate-900 font-outfit italic tracking-tighter leading-none">{stat.value}</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Requests and Enrollment */}
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 font-outfit italic flex items-center gap-3">
                  <Wallet className="h-6 w-6 text-primary" />
                  Verification Queue
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => floatRequests.refetch()}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                >
                  <Clock className="mr-2 h-3 w-3" /> Sync Latest
                </Button>
              </div>

              {pendingCount === 0 && (
                <div className="p-12 text-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                  <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs">All Activity Verified</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {floatRequests.data?.map((req: any) => (
                  <Card
                    key={req.id}
                    className="border border-slate-100 shadow-lg shadow-slate-200/20 rounded-[2rem] bg-white group hover:border-primary/30 transition-all overflow-hidden"
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <p className="text-3xl font-black text-slate-900 font-outfit italic tracking-tighter">${req.amount}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                            Branch ID #{req.employeeId} · Provider #{req.providerId}
                          </p>
                        </div>
                        <Badge className="bg-amber-500/10 text-amber-600 border-none font-black text-[9px] uppercase px-3 py-1 mt-1">
                          Awaiting Screening
                        </Badge>
                      </div>

                      {req.workerNotes && (
                        <div className="p-5 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Agent Justification</p>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">"{req.workerNotes}"</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleApprove(req.id)}
                          disabled={processMutation.isPending}
                          className="premium-gradient text-white rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                          Verify Req
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDecline(req.id)}
                          disabled={processMutation.isPending}
                          className="border-slate-100 text-rose-500 hover:bg-rose-50 rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest"
                        >
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <AgentEnrollmentForm onEnroll={() => employees.refetch()} />
          </div>

          {/* Right Column: Security and Earnings */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 font-outfit italic flex items-center gap-3 px-2">
                <Activity className="h-6 w-6 text-rose-500" />
                Network Alerts
              </h2>

              <div className="space-y-4">
                {alerts.data?.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-4 items-start"
                  >
                    <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 animate-pulse ${
                      alert.severity === "critical" ? "bg-rose-500" : "bg-amber-500"
                    }`} />
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        {alert.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Earnings Card */}
            <Card className="rounded-[2.5rem] bg-slate-900 p-1 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                 <Zap className="h-32 w-32 text-primary" />
              </div>
              <CardContent className="p-10 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-8">
                   <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-3">Live Commission Share (5%)</h3>
                <div className="flex items-baseline gap-2 mb-6">
                   <span className="text-5xl font-black text-white font-outfit italic tracking-tighter">
                      {payoutQuery.data ? `$${payoutQuery.data.dailyPool.toFixed(2)}` : "$0.00"}
                   </span>
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">USD</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-8">
                  Your override on today's network volume. This is auto-credited to your manager account upon month-end settlement.
                </p>
                <Button className="w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all">
                  Withdrawal Protocols <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
