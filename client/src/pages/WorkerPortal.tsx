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
  UserCheck,
  Activity,
  CheckCircle,
  XCircle,
  Send,
  User,
  History,
  TrendingUp,
  Save,
  ArrowUpCircle,
  LogOut,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
  DollarSign,
  ShieldAlert,
  Terminal,
  Power,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";

export default function WorkerPortal() {
  const { user, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [session, setSession] = useState<any>(null);
  const [openingCash, setOpeningCash] = useState("");
  const [passcode, setPasscode] = useState("");
  const [currentCash, setCurrentCash] = useState("");
  const [closingCash, setClosingCash] = useState("");

  // Float Request State
  const [requestAmount, setRequestAmount] = useState("");
  const [requestProviderId, setRequestProviderId] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [showFloatForm, setShowFloatForm] = useState(false);

  // Live Update State
  const [lineBalances, setLineBalances] = useState<Record<number, string>>({});
  const [updateReason, setUpdateReason] = useState("");

  const myEmployeeInfoQuery = trpc.nodes.getMyEmployeeInfo.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const currentEmployee = myEmployeeInfoQuery.data;
  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const linesQuery = trpc.nodes.getEmployeeLines.useQuery(
    { employeeId: selectedAgentId || 0 },
    { enabled: selectedAgentId !== null }
  );

  const myRequestsQuery = trpc.nodes.myFloatRequests.useQuery(
    { employeeId: selectedAgentId || 0 },
    { enabled: selectedAgentId !== null, refetchInterval: 10000 }
  );

  // Auto-select agent based on returned employee info
  useEffect(() => {
    if (myEmployeeInfoQuery.data && selectedAgentId === null) {
      setSelectedAgentId(myEmployeeInfoQuery.data.id);
    }
  }, [myEmployeeInfoQuery.data, selectedAgentId]);

  const checkInMutation = trpc.nodes.createCheckIn.useMutation();
  const checkOutMutation = trpc.nodes.checkout.useMutation();
  const requestFloatMutation = trpc.nodes.requestFloat.useMutation();
  const balanceUpdateMutation = trpc.nodes.updateBalances.useMutation();

  const latestCheckInQuery = trpc.nodes.getLatestCheckIn.useQuery({ 
    employeeId: selectedAgentId || 0 
  }, {
    enabled: !!selectedAgentId && !session
  });

  const expectedCash = latestCheckInQuery.data?.closingCash ? parseFloat(latestCheckInQuery.data.closingCash as any) : 0;
  const cashDiscrepancy = openingCash ? parseFloat(openingCash) - expectedCash : 0;
  const isNotBalancing = openingCash && Math.abs(cashDiscrepancy) > 0.01;

  const handleCheckIn = async () => {
    if (selectedAgentId === null) {
      // Fallback for dev mode - if we can't find the employee record, try to resolve it now
      if (myEmployeeInfoQuery.data) {
        setSelectedAgentId(myEmployeeInfoQuery.data.id);
      } else {
        toast.error("Identity not resolved", {
          description: "Your account is not linked to an active employee record. Check the Staff Directory."
        });
        return;
      }
    }

    if (!openingCash || !passcode) {
      toast.error("Missing information", {
        description: "Please enter your opening cash balance and passcode."
      });
      return;
    }

    const validPasscodes = ["MJ123456", "agent123", "admin123", "1234"];
    const submittedPasscode = passcode.trim().toLowerCase();
    
    // Check if the passcode is one of the generic ones or matches the role-level default
    const isMockAuth = validPasscodes.map(p => p.toLowerCase()).includes(submittedPasscode);

    if (!isMockAuth) {
      toast.error("Invalid passcode", {
        description: "Use 'agent123' or 'admin123' for testing."
      });
      return;
    }

    if (isNotBalancing) {
      const confirmed = window.confirm(`Cash discrepancy detected:\n\nYou entered $${openingCash}, but your last shift closed with $${expectedCash}.\n\nDifference: ${cashDiscrepancy > 0 ? "+" : ""}$${cashDiscrepancy.toFixed(2)}\n\nProceed? This will be logged for review.`);
      if (!confirmed) return;
    }

    try {
      const res = await checkInMutation.mutateAsync({
        employeeId: selectedAgentId,
        openingCash: parseFloat(openingCash),
        notes: isNotBalancing ? `Shift start with $${cashDiscrepancy.toFixed(2)} discrepancy` : "Shift start",
      });
      setSession(res);
      setCurrentCash(openingCash);
      toast.success("Shift started. Good luck!");
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
        updateReason: updateReason || "Mid-shift balance update",
      });
      toast.success("Balances updated");
      setUpdateReason("");
    } catch (err) {
      toast.error("Failed to update balances");
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
        notes: "End of shift checkout",
      });
      setSession(null);
      setOpeningCash("");
      setPasscode("");
      setClosingCash("");
      setCurrentCash("");
      setLineBalances({});
      toast.success("Shift closed. Have a good rest!");
    } catch (err) {
      toast.error("Failed to close shift");
    }
  };

  const handleFloatRequest = async () => {
    if (!selectedAgentId || !requestProviderId || !requestAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await requestFloatMutation.mutateAsync({
        employeeId: selectedAgentId,
        providerId: parseInt(requestProviderId),
        amount: parseFloat(requestAmount),
        workerNotes: requestNotes,
      });
      toast.success("Float request submitted for approval");
      setRequestAmount("");
      setRequestNotes("");
      setShowFloatForm(false);
      myRequestsQuery.refetch();
    } catch (err) {
      toast.error("Request failed");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Agent Portal"
          subtitle={`Welcome, ${user?.name || "Agent"}. Manage your shift and daily operations.`}
          category="Daily Operations"
          actions={
            session ? (
              <Button 
                variant="outline"
                onClick={handleCheckOut}
                className="h-10 rounded-lg border-red-200 text-red-600 hover:bg-red-50 px-5 font-medium text-sm"
              >
                <LogOut className="mr-2 h-4 w-4" /> End Shift
              </Button>
            ) : null
          }
        />

        {!session ? (
          <div className="max-w-lg mx-auto pt-4">
            <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="text-center pb-4 border-b border-gray-100 dark:border-slate-700">
                <div className="h-14 w-14 mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="h-7 w-7 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Start Your Shift</CardTitle>
                <CardDescription>Verify your identity and opening cash balance</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Agent</label>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {currentEmployee?.name || user?.name || "Agent"}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-gray-400 font-mono">
                            {user?.email}
                          </p>
                          <Badge variant="outline" className="h-4 px-1 text-[8px] font-bold uppercase border-blue-100 text-blue-400">
                            {currentEmployee?.uniqueCode || "ID: PENDING"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Passcode</label>
                    <input
                      type="password"
                      placeholder="........."
                      value={passcode}
                      onChange={e => setPasscode(e.target.value)}
                      className="w-full h-11 px-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">Opening Cash Balance</label>
                    {expectedCash > 0 && (
                      <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700 font-medium">
                        Last close: ${expectedCash.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={openingCash}
                      onChange={e => setOpeningCash(e.target.value)}
                      className="w-full h-16 pl-12 pr-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-3xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-200"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCheckIn}
                  className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  Start Shift <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Main workspace */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <CardTitle className="text-2xl">My Workspace</CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-xs font-medium border-gray-200 text-gray-500">
                            ID: {currentEmployee?.uniqueCode || "---"}
                          </Badge>
                          <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs font-medium">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" /> Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Current time</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Cash and float request */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cash in Hand</span>
                        <Wallet className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-300">$</span>
                        <input
                          type="number"
                          value={currentCash}
                          onChange={e => setCurrentCash(e.target.value)}
                          className="flex-1 bg-transparent text-4xl font-bold text-gray-900 dark:text-white outline-none placeholder:text-gray-200"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-rows-2 gap-3">
                      <button
                        onClick={() => setShowFloatForm(true)}
                        className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between group hover:border-blue-300 transition-colors"
                      >
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Quick Action</p>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Request Float</h3>
                        </div>
                        <div className="h-10 w-10 bg-gray-50 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-gray-400">
                          <Plus className="h-5 w-5" />
                        </div>
                      </button>
                      
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600 font-medium mb-0.5">Est. Commission (15%)</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">$12.42</p>
                        </div>
                        <Activity className="h-5 w-5 text-blue-500 opacity-50" />
                      </div>
                    </div>
                  </div>

                  {/* Line balances */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider Balances</span>
                      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-700" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {linesQuery.data?.map((line: any) => (
                        <div
                          key={line.id}
                          className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] font-mono font-medium border-gray-200 text-gray-500">{line.agentCode}</Badge>
                            <Smartphone className="h-4 w-4 text-gray-300" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Float Balance</p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-bold text-gray-300">$</span>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={lineBalances[line.providerId] || ""}
                                onChange={e => setLineBalances({ ...lineBalances, [line.providerId]: e.target.value })}
                                className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white outline-none placeholder:text-gray-200"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes and submit */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-700 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">Shift Notes (optional)</label>
                      <textarea
                        placeholder="Any notes about this update..."
                        value={updateReason}
                        onChange={e => setUpdateReason(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[80px] resize-none"
                      />
                    </div>
                    <Button
                      onClick={handleLiveUpdate}
                      className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      Save Balances <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {showFloatForm && (
                <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle className="text-xl">Request Float</CardTitle>
                      <CardDescription>Apply for additional float capital</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => setShowFloatForm(false)}>
                      <XCircle className="h-5 w-5 text-gray-400" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Provider</label>
                        <select
                          value={requestProviderId}
                          onChange={e => setRequestProviderId(e.target.value)}
                          className="w-full h-11 px-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="">Select provider...</option>
                          {providersQuery.data?.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Amount ($)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={requestAmount}
                          onChange={e => setRequestAmount(e.target.value)}
                          className="w-full h-11 px-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleFloatRequest}
                      className="w-full h-11 rounded-lg bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 text-white font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      Submit Request <Send className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Activity log sidebar */}
            <div className="lg:col-span-4">
              <Card className="border border-gray-200 dark:border-slate-700 shadow-sm sticky top-8">
                <CardHeader className="pb-4 border-b border-gray-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Activity Log</CardTitle>
                      <CardDescription>Your float request history</CardDescription>
                    </div>
                    <div className="h-9 w-9 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-slate-700">
                      <History className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 max-h-[600px] overflow-y-auto">
                  <div className="space-y-3">
                    {myRequestsQuery.data?.map((req: any) => (
                      <div key={req.id} className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${req.status === 'pending' ? 'bg-amber-400' : req.status === 'transferred' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="font-mono text-xs text-gray-400">#{req.id.toString().padStart(4, '0')}</span>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(req.requestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">${parseFloat(req.amount).toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{providersQuery.data?.find(p => p.id === req.providerId)?.name}</p>
                          </div>
                          <Badge className={`border-none font-medium text-xs px-2.5 py-1 ${
                            req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                            req.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                            req.status === 'transferred' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {req.status === 'verified' ? 'Processing' : req.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                  <Button
                    onClick={handleCheckOut}
                    variant="outline"
                    className="w-full h-11 rounded-lg border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm"
                  >
                    <Power className="mr-2 h-4 w-4" /> End Shift
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
