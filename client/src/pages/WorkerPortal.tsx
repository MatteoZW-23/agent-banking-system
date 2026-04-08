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

  const employeesQuery = trpc.nodes.listEmployees.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const currentEmployee = employeesQuery.data?.find(e => e.id === selectedAgentId);
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

  // Auto-select agent based on logged in user email
  useEffect(() => {
    if (employeesQuery.data && user?.email && selectedAgentId === null) {
      const match = employeesQuery.data.find(e => e.email?.toLowerCase() === user.email?.toLowerCase());
      if (match) {
        setSelectedAgentId(match.id);
      }
    }
  }, [employeesQuery.data, user?.email, selectedAgentId]);

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
    if (selectedAgentId === null || !openingCash || !passcode) {
      toast.error("Security Verification Required", {
        description: "Please enter your opening cash balance and security passcode."
      });
      return;
    }

    // Universal Test Passcodes for Testing/Sync
    const validPasscodes = ["MJ123456", "agent123", "admin123", "1234"];
    if (!validPasscodes.includes(passcode)) {
      toast.error("Authentication Failure", {
        description: "Invalid security passcode. Use 'agent123' or 'admin123' for testing."
      });
      return;
    }

    if (isNotBalancing) {
      const confirmed = window.confirm(`CASH DISCREPANCY DETECTED:\n\nYou are entering $${openingCash}, but your last shift closed with $${expectedCash}.\n\nDifference: ${cashDiscrepancy > 0 ? "+" : ""}$${cashDiscrepancy.toFixed(2)}\n\nDo you want to proceed with this discrepancy? It will be logged for administrative review.`);
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
      toast.success("Balances updated successfully");
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
      toast.success("Float requisition dispatched for authorisation");
      setRequestAmount("");
      setRequestNotes("");
      setShowFloatForm(false);
      myRequestsQuery.refetch();
    } catch (err) {
      toast.error("Requisition failed");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) return null;



  return (
    <DashboardLayout>
      <div className="space-y-12 animate-fade-in pb-20">
        <PageHeader
          title="Field Agent Portal"
          subtitle={`Welcome to your workspace, ${user?.name || "Agent"}. Manage your shift and daily money here.`}
          category="Daily Operations"
          actions={
            session ? (
              <Button 
                variant="outline"
                onClick={handleCheckOut}
                className="h-12 rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50 px-8 font-black uppercase tracking-widest text-xs transition-all"
              >
                <LogOut className="mr-3 h-4 w-4" /> End Shift
              </Button>
            ) : null
          }
        />

        {!session ? (
          <div className="max-w-2xl mx-auto pt-8">
            <div className="bg-white rounded-[4rem] p-16 space-y-16 shadow-2xl shadow-slate-200/50 border border-slate-100">
              <div className="text-center space-y-4">
                <div className="h-24 w-24 mx-auto bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-sm relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-[2rem] animate-pulse" />
                  <ShieldCheck className="h-12 w-12 text-primary relative z-10" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Terminal Authorization</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Verify your ID to start shift</p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-4 italic">Identification</label>
                    <div className="bg-slate-50 p-6 rounded-3xl flex items-center gap-6 border border-slate-100 shadow-inner">
                      <div className="h-12 w-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                        <UserCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase">{user?.name || "Authorized Agent"}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-4 italic">Security pass</label>
                    <input
                      type="password"
                      placeholder="••••••"
                      value={passcode}
                      onChange={e => setPasscode(e.target.value)}
                      className="w-full h-[76px] px-8 bg-slate-50 border border-slate-100 rounded-3xl font-mono text-2xl tracking-[0.8em] text-center focus:outline-none focus:border-primary transition-all text-slate-900 shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Starting Cash in Hand</label>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-black text-[9px] px-3 py-1 uppercase tracking-widest">
                       Verify Current Liquidity
                    </Badge>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-5xl font-black text-slate-200 pointer-events-none group-focus-within:text-primary transition-colors">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={openingCash}
                      onChange={e => setOpeningCash(e.target.value)}
                      className="w-full h-40 pl-24 pr-10 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black text-7xl text-slate-900 focus:outline-none focus:border-primary transition-all placeholder:text-slate-200 font-outfit italic tracking-tighter shadow-inner"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCheckIn}
                  className="w-full h-24 rounded-[2.5rem] bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01] active:scale-95 font-black text-xl uppercase tracking-[0.3em] shadow-2xl shadow-slate-200/50 transition-all font-outfit"
                >
                  Confirm & Start Work <ChevronRight className="ml-4 h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-12 pb-24">
            {/* COMMAND DECK */}
            <div className="lg:col-span-8 space-y-12">
              <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100">
                <div className="p-16 space-y-20">
                  {/* COCKPIT HEADER */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                       <div className="h-16 w-1.5 flex flex-col gap-1.5">
                          <div className="flex-1 bg-primary rounded-full animate-pulse" />
                          <div className="flex-1 bg-slate-200 rounded-full" />
                       </div>
                       <div>
                          <h2 className="text-6xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">My Counter</h2>
                          <div className="flex items-center gap-6 mt-6">
                             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black text-slate-500 tracking-widest">
                               AGENT ID: <span className="text-primary">{currentEmployee?.uniqueCode || "---"}</span>
                             </div>
                             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-black text-emerald-600 tracking-widest">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                CONNECTED
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Current Time</div>
                       <div className="text-2xl font-black text-slate-900 font-outfit tracking-tighter">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>

                  {/* MONEY CONTROLS */}
                  <div className="grid gap-10 md:grid-cols-2">
                    <div className="bg-slate-50 p-12 rounded-[3.5rem] space-y-12 group hover:bg-slate-100/50 transition-all border border-slate-100">
                      <div className="flex items-center justify-between">
                         <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-500 tracking-widest uppercase">Physical Cash</div>
                         <Wallet className="h-6 w-6 text-slate-300 group-hover:text-primary transition-all" />
                      </div>
                      <div className="flex items-baseline gap-4">
                        <span className="text-7xl font-black text-slate-200 font-outfit italic tracking-tighter">$</span>
                        <input
                          type="number"
                          value={currentCash}
                          onChange={e => setCurrentCash(e.target.value)}
                          className="flex-1 bg-transparent border-none text-8xl font-black text-slate-900 font-outfit outline-none focus:ring-0 p-0 placeholder:text-slate-100 tracking-tighter italic"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-rows-2 gap-10">
                      <div className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] flex items-center justify-between group hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer" onClick={() => setShowFloatForm(true)}>
                         <div className="space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Quick Access</p>
                            <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Request Money</h3>
                         </div>
                         <div className="h-20 w-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                            <Plus className="h-10 w-10" />
                         </div>
                      </div>
                      
                      <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-[3rem] flex items-center justify-between">
                         <div className="space-y-4">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em]">Estimated Bonus (15%)</p>
                            <div className="flex items-baseline gap-3">
                               <p className="text-5xl font-black text-emerald-700 font-outfit italic tracking-tighter">$12.42</p>
                               <span className="text-[9px] text-emerald-600/50 font-black tracking-widest">USD</span>
                            </div>
                         </div>
                         <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <Activity className="h-8 w-8 text-emerald-500" />
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* ASSET ARRAY */}
                  <div className="space-y-12">
                    <div className="flex items-center gap-8">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic whitespace-nowrap">Line Balances</span>
                       <div className="h-px w-full bg-slate-100" />
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                      {linesQuery.data?.map((line: any) => (
                        <div
                          key={line.id}
                          className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-10 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[8px] font-black text-slate-500 tracking-widest">{line.agentCode}</div>
                            <Smartphone className="h-5 w-5 text-slate-300 group-hover:text-primary transition-all" />
                          </div>
                          <div className="space-y-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">FLOAT BALANCE</span>
                            <div className="flex items-baseline gap-2">
                               <span className="text-3xl font-black text-slate-200 font-outfit italic tracking-tighter">$</span>
                               <input
                                  type="number"
                                  placeholder="0.00"
                                  value={lineBalances[line.providerId] || ""}
                                  onChange={e => setLineBalances({ ...lineBalances, [line.providerId]: e.target.value })}
                                  className="w-full bg-transparent border-none text-5xl font-black text-slate-900 font-outfit outline-none focus:ring-0 p-0 placeholder:text-slate-100 tracking-tighter italic"
                               />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-12 border-t border-slate-100 space-y-12">
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-8 italic">Shift Operation Notes</label>
                      <textarea
                        placeholder="ENTER LOG DETAILS..."
                        value={updateReason}
                        onChange={e => setUpdateReason(e.target.value)}
                        className="w-full p-12 bg-slate-50 border border-slate-100 rounded-[3rem] font-mono text-sm focus:outline-none focus:border-primary transition-all min-h-[160px] text-slate-700 placeholder:text-slate-200 shadow-inner"
                      />
                    </div>
                    <Button
                      onClick={handleLiveUpdate}
                      className="w-full h-24 rounded-[3rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 transition-all font-outfit italic"
                    >
                      Commit Terminal Sync <Save className="ml-5 h-7 w-7" />
                    </Button>
                  </div>
                </div>
              </div>

              {showFloatForm && (
                <div className="bg-white rounded-[4rem] p-16 space-y-16 animate-in zoom-in-95 duration-500 shadow-4xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-5xl font-black text-slate-900 italic uppercase tracking-tighter">Request Money</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Apply for additional float capital</p>
                    </div>
                    <Button variant="ghost" className="h-16 w-16 rounded-3xl hover:bg-slate-50" onClick={() => setShowFloatForm(false)}>
                      <XCircle className="h-10 w-10 text-slate-300" />
                    </Button>
                  </div>
                  <div className="grid gap-12 md:grid-cols-2">
                    <div className="space-y-6">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-8 italic">Select Provider</label>
                        <select
                          value={requestProviderId}
                          onChange={e => setRequestProviderId(e.target.value)}
                          className="w-full h-24 px-10 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-lg outline-none focus:border-primary text-slate-900 italic"
                        >
                          <option value="">SELECT GATEWAY...</option>
                          {providersQuery.data?.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                    </div>
                    <div className="space-y-6">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-8 italic">Amount Required ($)</label>
                       <input
                          type="number"
                          placeholder="0.00"
                          value={requestAmount}
                          onChange={e => setRequestAmount(e.target.value)}
                          className="w-full h-24 px-12 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-6xl text-center focus:outline-none focus:border-primary text-slate-900 italic tracking-tighter font-outfit"
                        />
                    </div>
                  </div>
                  <Button onClick={handleFloatRequest} className="w-full h-24 rounded-[3rem] bg-slate-900 hover:scale-[1.01] active:scale-95 text-white font-black text-xl uppercase tracking-[0.3em] shadow-2xl transition-all font-outfit">
                    Submit Request <Send className="ml-5 h-6 w-6" />
                  </Button>
                </div>
              )}
            </div>

            {/* COMMUNICATIONS FEED */}
            <div className="lg:col-span-4 space-y-12">
               <div className="bg-white rounded-[3.5rem] p-12 flex flex-col h-full min-h-[900px] shadow-2xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex items-center justify-between mb-12 pb-8 border-b border-slate-100">
                     <div>
                        <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Activity log</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Historical telemetry</p>
                     </div>
                     <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                        <Terminal className="h-6 w-6 text-slate-400" />
                     </div>
                  </div>
                  
                  <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-6">
                    {myRequestsQuery.data?.map((req: any) => (
                      <div key={req.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-8 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className={`h-2.5 w-2.5 rounded-full ${req.status === 'pending' ? 'bg-amber-400 animate-pulse' : req.status === 'transferred' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">REF_{req.id.toString().padStart(4, '0')}</span>
                           </div>
                           <span className="font-mono text-[10px] text-slate-300 font-bold">{new Date(req.requestTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <p className="text-4xl font-black text-slate-900 font-outfit italic tracking-tighter">${parseFloat(req.amount).toLocaleString()}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{providersQuery.data?.find(p => p.id === req.providerId)?.name}</p>
                           </div>
                           <Badge className={`border-none font-black text-[8px] uppercase px-4 py-2 rounded-xl h-fit ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : req.status === 'transferred' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                             {req.status}
                           </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 pt-12 border-t border-slate-100">
                    <Button
                      onClick={handleCheckOut}
                      className="w-full h-20 rounded-[2rem] bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white font-black text-xs uppercase tracking-[0.4em] font-outfit italic transition-all group"
                    >
                      <Power className="mr-5 h-6 w-6 group-hover:animate-spin" /> END SHIFT
                    </Button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
