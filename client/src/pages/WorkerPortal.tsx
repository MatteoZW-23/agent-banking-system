import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Wallet,
  ClipboardCheck,
  LogOut,
  UserCheck,
  MapPin,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Timer,
  ChevronRight,
  ShieldCheck,
  Building2,
  Phone,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  User,
  History,
  TrendingDown,
  TrendingUp,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export default function WorkerPortal() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [session, setSession] = useState<any>(null);
  const [openingCash, setOpeningCash] = useState("");
  const [currentCash, setCurrentCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");

  // Float Request State
  const [requestAmount, setRequestAmount] = useState("");
  const [requestProviderId, setRequestProviderId] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [showFloatForm, setShowFloatForm] = useState(false);

  // Live Update State
  const [lineBalances, setLineBalances] = useState<Record<number, string>>({});
  const [updateReason, setUpdateReason] = useState("");

  const employeesQuery = trpc.nodes.listEmployees.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const linesQuery = trpc.nodes.getEmployeeLines.useQuery(
    { employeeId: selectedAgentId || 0 },
    { enabled: !!selectedAgentId }
  );

  const myRequestsQuery = trpc.nodes.myFloatRequests.useQuery(
    { employeeId: selectedAgentId || 0 },
    { enabled: !!selectedAgentId, refetchInterval: 10000 }
  );

  const checkInMutation = trpc.nodes.createCheckIn.useMutation();
  const checkOutMutation = trpc.nodes.checkout.useMutation();
  const requestFloatMutation = trpc.nodes.requestFloat.useMutation();
  const balanceUpdateMutation = trpc.nodes.updateBalances.useMutation();

  const handleCheckIn = async () => {
    if (!selectedAgentId || !openingCash) {
      toast.error("Please enter your opening cash balance");
      return;
    }

    try {
      const res = await checkInMutation.mutateAsync({
        employeeId: selectedAgentId,
        openingCash: parseFloat(openingCash),
        notes: "Initial start of day check-in",
      });
      setSession(res);
      setCurrentCash(openingCash);
      toast.success("Shift started successfully. Good luck!");
    } catch (err) {
      toast.error("Failed to start shift");
    }
  };

  const handleLiveUpdate = async () => {
    if (!session || !currentCash) {
      toast.error("Enter current cash amount");
      return;
    }

    try {
      await balanceUpdateMutation.mutateAsync({
        checkInId: session.id,
        employeeId: selectedAgentId!,
        cashAmount: parseFloat(currentCash),
        floatBalances: lineBalances,
        updateReason: updateReason || "Mid-shift balance reporting",
      });
      toast.success("Liquidity snapshot synchronized with admin hub");
      setUpdateReason("");
    } catch (err) {
      toast.error("Failed to sync balances");
    }
  };

  const handleCheckOut = async () => {
    if (!session || !closingCash) {
      toast.error("Please enter your final closing balance");
      return;
    }

    try {
      await checkOutMutation.mutateAsync({
        checkInId: session.id,
        closingCash: parseFloat(closingCash),
        notes: notes || "End of shift checkout",
      });
      setSession(null);
      setOpeningCash("");
      setClosingCash("");
      setNotes("");
      setCurrentCash("");
      setLineBalances({});
      toast.success("Shift closed and audited. See you tomorrow!");
    } catch (err) {
      toast.error("Failed to close shift");
    }
  };

  const handleFloatRequest = async () => {
    if (!selectedAgentId || !requestProviderId || !requestAmount) {
      toast.error("Complete all request fields");
      return;
    }

    try {
      await requestFloatMutation.mutateAsync({
        employeeId: selectedAgentId,
        providerId: parseInt(requestProviderId),
        amount: parseFloat(requestAmount),
        workerNotes: requestNotes,
      });
      toast.success("Float request sent to admin for approval");
      setRequestAmount("");
      setRequestNotes("");
      setShowFloatForm(false);
      myRequestsQuery.refetch();
    } catch (err) {
      toast.error("Request failed");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 font-inter">
      <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 premium-gradient rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tighter italic">
                Workforce Operational Hub
              </h1>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Global Network Active • RTGS Synchronization Live
                </p>
              </div>
            </div>
          </div>
          {session && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 pr-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase leading-none">
                  {
                    employeesQuery.data?.find(e => e.id === selectedAgentId)
                      ?.name
                  }
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                  Shift active:{" "}
                  {new Date(session.checkInTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {!session ? (
          <div className="max-w-2xl mx-auto space-y-8 py-10">
            {/* Identity Selection */}
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden">
              <CardHeader className="bg-white dark:bg-slate-900 pb-8 text-center pt-12">
                <div className="h-20 w-20 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border-2 border-primary/10">
                  <UserCheck className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-4xl font-black font-outfit uppercase tracking-tight">
                  Shift Verification
                </CardTitle>
                <CardDescription className="text-sm font-medium pt-2">
                  Authorize your identity to begin daily financial telemetry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-10 p-12">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">
                    Select Your Identity Profile
                  </label>
                  <select
                    value={selectedAgentId || ""}
                    onChange={e =>
                      setSelectedAgentId(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full h-16 px-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-primary/5 focus:outline-none font-black text-lg transition-all appearance-none"
                  >
                    <option value="">Roster Search...</option>
                    {employeesQuery.data?.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — ({emp.uniqueCode})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAgentId && (
                  <div className="space-y-10 animate-fade-in pt-4">
                    {/* Line Summary Component */}
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                      <Activity className="absolute bottom-0 right-0 h-32 w-32 opacity-5 translate-y-1/3 translate-x-1/3" />
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.3em] bg-primary/10 px-3 py-1.5 rounded-full inline-block">
                            Provider Identity Mesh
                          </h4>
                          <div className="flex -space-x-2">
                            <div
                              className="h-6 w-6 rounded-full bg-emerald-500 border-2 border-slate-900"
                              title="OneMoney Link Active"
                            />
                            <div
                              className="h-6 w-6 rounded-full bg-orange-500 border-2 border-slate-900"
                              title="InnBucks Link Active"
                            />
                            <div
                              className="h-6 w-6 rounded-full bg-blue-500 border-2 border-slate-900"
                              title="Bank Link Active"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {linesQuery.data?.map((line: any) => (
                            <div
                              key={line.id}
                              className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md flex flex-col gap-1 hover:bg-white/10 transition-colors"
                            >
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Line Identity
                              </span>
                              <span className="font-mono text-sm font-bold text-white tracking-widest">
                                {line.agentCode}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Opening Balance Input */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                          Physical Opening Cash (USD)
                        </label>
                        <Wallet className="h-5 w-5 text-primary/50" />
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={openingCash}
                        onChange={e => setOpeningCash(e.target.value)}
                        className="w-full h-20 px-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] focus:outline-none focus:ring-8 focus:ring-emerald-500/5 text-4xl font-black text-slate-900 dark:text-white transition-all text-center placeholder:text-slate-200 font-outfit"
                      />
                    </div>

                    <Button
                      onClick={handleCheckIn}
                      className="w-full h-20 rounded-[2.5rem] premium-gradient text-white font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all font-outfit"
                    >
                      Open Daily Settlement{" "}
                      <ChevronRight className="ml-2 h-6 w-6" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] font-inter italic opacity-50">
              Encrypted with Regional Multi-Zim Authority Standards
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-12 animate-fade-in pb-20">
            {/* Left Column: Live Control & Balances */}
            <div className="md:col-span-12 lg:col-span-8 space-y-8">
              {/* Active Liquidity Dashboard */}
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-slate-900 p-10 text-white relative">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Activity className="h-40 w-40" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-4">
                      <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] tracking-widest px-4 py-1.5 uppercase italic animate-pulse">
                        Session Active
                      </Badge>
                      <div className="space-y-1">
                        <h2 className="text-4xl font-black font-outfit uppercase tracking-tighter italic">
                          Shift Liquidity Mesh
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          Real-time field reporting active since{" "}
                          {new Date(session.checkInTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 ">
                        Identity Reference
                      </span>
                      <span className="text-xl font-mono font-black text-white px-5 py-2 bg-white/5 rounded-2xl border border-white/10">
                        {
                          employeesQuery.data?.find(
                            e => e.id === selectedAgentId
                          )?.uniqueCode
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-10 space-y-10">
                  {/* Main Balance Updates */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Cash Monitor */}
                    <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <Wallet className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Live Cash-On-Hand
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={currentCash}
                          onChange={e => setCurrentCash(e.target.value)}
                          className="w-full bg-transparent border-none text-5xl font-black text-slate-900 dark:text-white font-outfit outline-none focus:ring-0 p-0 placeholder:text-slate-200"
                          placeholder="0.00"
                        />
                        <p className="text-[10px] font-black text-primary/50 uppercase tracking-widest">
                          Adjust physical notes held at booth
                        </p>
                      </div>
                    </div>

                    {/* Action Hub Mini */}
                    <div className="flex flex-col gap-4">
                      <div
                        className="flex-1 p-8 rounded-[2.5rem] bg-primary group cursor-pointer hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 relative overflow-hidden"
                        onClick={() => setShowFloatForm(true)}
                      >
                        <ArrowUpCircle className="absolute top-0 right-0 h-32 w-32 text-white opacity-5 -translate-y-1/4 translate-x-1/4" />
                        <div className="relative z-10 flex flex-col h-full justify-between">
                          <div className="h-10 w-10 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white font-outfit uppercase italic">
                              Get Float
                            </h3>
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest italic group-hover:text-white transition-colors">
                              Emergency Liquidity Request
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Providers Mesh Updates */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-outfit italic">
                        Provider Line Reconciliation Update
                      </h3>
                      <div className="h-px flex-1 mx-6 bg-slate-100 dark:bg-slate-800" />
                      <RefreshCw className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      {linesQuery.data?.map((line: any) => (
                        <div
                          key={line.id}
                          className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4 group hover:border-primary/20 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-primary">
                              <Smartphone className="h-4 w-4" />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {line.agentCode.slice(0, 8)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
                              Line Float
                            </span>
                            <input
                              type="number"
                              placeholder="Current Bal"
                              value={lineBalances[line.providerId] || ""}
                              onChange={e =>
                                setLineBalances({
                                  ...lineBalances,
                                  [line.providerId]: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border-none text-xl font-black text-slate-900 dark:text-white font-outfit outline-none focus:ring-0 p-0 placeholder:text-slate-200"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Master Synchronization Control */}
                  <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
                        Reason for Synchronization (Optional)
                      </label>
                      <textarea
                        placeholder="e.g. End of major cash-out cycle, or peak traffic update"
                        value={updateReason}
                        onChange={e => setUpdateReason(e.target.value)}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-slate-800 dark:text-slate-300 min-h-[80px]"
                      />
                    </div>
                    <Button
                      onClick={handleLiveUpdate}
                      className="w-full h-20 rounded-[2.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg uppercase tracking-[0.3em] shadow-2xl shadow-emerald-600/20 transition-all font-outfit italic"
                    >
                      Sync Field Balances with Admin{" "}
                      <Save className="ml-3 h-6 w-6" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Float Request Form Overlay */}
              {showFloatForm && (
                <div className="animate-in zoom-in-95 duration-200">
                  <Card className="border-4 border-primary/20 bg-primary/5 rounded-[3rem] overflow-hidden shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between p-10 pb-4">
                      <div className="space-y-1">
                        <CardTitle className="text-3xl font-black font-outfit text-primary italic uppercase tracking-tighter">
                          Request Floating Capital
                        </CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase text-primary/60 tracking-widest">
                          Emergency Liquidity Injection Gateway
                        </CardDescription>
                      </div>
                      <XCircle
                        className="h-10 w-10 text-slate-300 cursor-pointer hover:text-rose-500 transition-colors"
                        onClick={() => setShowFloatForm(false)}
                      />
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">
                            Select High-Traffic Line
                          </label>
                          <select
                            value={requestProviderId}
                            onChange={e => setRequestProviderId(e.target.value)}
                            className="w-full h-16 px-6 bg-white dark:bg-slate-950 border-2 border-primary/10 rounded-2xl font-black text-base transition-all appearance-none outline-none focus:border-primary"
                          >
                            <option value="">Select Target Provider...</option>
                            {providersQuery.data?.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">
                            Amount (USD)
                          </label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={requestAmount}
                            onChange={e => setRequestAmount(e.target.value)}
                            className="w-full h-16 px-6 bg-white dark:bg-slate-950 border-2 border-primary/10 rounded-2xl font-black text-3xl text-center focus:outline-none focus:border-primary transition-all font-outfit"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">
                          Operational Justification
                        </label>
                        <input
                          placeholder="e.g. Unusual OneMoney demand at stall B-04"
                          value={requestNotes}
                          onChange={e => setRequestNotes(e.target.value)}
                          className="w-full h-16 px-6 bg-white dark:bg-slate-950 border-2 border-primary/10 rounded-2xl font-black text-sm outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <Button
                        onClick={handleFloatRequest}
                        className="w-full h-20 rounded-[2.5rem] premium-gradient text-white font-black text-lg uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 font-outfit italic"
                      >
                        Transmit Capital Request{" "}
                        <Send className="ml-3 h-6 w-6" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Right Column: Activity Audit */}
            <div className="md:col-span-12 lg:col-span-4 space-y-8">
              {/* Live Audit Feed */}
              <Card className="border-none shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-full max-h-[850px]">
                <CardHeader className="p-10 pb-6 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl font-black font-outfit uppercase italic">
                      Field Audit Feed
                    </CardTitle>
                    <History className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest italic opacity-50">
                    Live status of your field ops and capital moves
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                  {/* Requests Status */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        Capital Requests
                      </span>
                      <div className="h-[2px] w-12 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    {myRequestsQuery.data?.map((req: any) => (
                      <div
                        key={req.id}
                        className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-11 w-11 rounded-2xl flex items-center justify-center ${req.status === "pending" ? "bg-amber-500/10 text-amber-600" : req.status === "transferred" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}
                          >
                            {req.status === "pending" ? (
                              <Clock className="h-6 w-6" />
                            ) : req.status === "transferred" ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : (
                              <XCircle className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-black text-slate-800 dark:text-white font-outfit leading-tight italic tracking-tighter">
                              ${req.amount}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase mt-1 italic">
                              {
                                providersQuery.data?.find(
                                  p => p.id === req.providerId
                                )?.name
                              }
                            </span>
                          </div>
                        </div>
                        <Badge
                          className={`border-none font-black text-[9px] uppercase px-3 py-1.5 italic rounded-xl ${req.status === "pending" ? "bg-amber-500/10 text-amber-600" : req.status === "transferred" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}
                        >
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Branch Info Mini */}
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden group">
                    <MapPin className="absolute top-0 right-0 h-32 w-32 text-white/5 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10 space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.3em] bg-white/5 py-2 px-4 rounded-full inline-block italic">
                        Assigned Node Identity
                      </h4>
                      <div className="space-y-1">
                        <p className="text-2xl font-black font-outfit italic uppercase">
                          Harare CBD Hub
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Branch Manager: Tendai Zulu
                        </p>
                      </div>
                      <div className="pt-4 flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-primary font-black font-outfit text-lg">
                            99.8%
                          </span>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">
                            Uptime
                          </span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col">
                          <span className="text-primary font-black font-outfit text-lg">
                            RT-Sync
                          </span>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">
                            Status
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* End Shift Sticky Bottom */}
                <div className="p-8 pt-0 mt-auto">
                  <Button
                    onClick={handleCheckOut}
                    className="w-full h-16 rounded-[2.5rem] bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-rose-600/20 transition-all font-outfit italic"
                  >
                    <LogOut className="mr-3 h-4 w-4" /> Terminate Shift & Audit
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
