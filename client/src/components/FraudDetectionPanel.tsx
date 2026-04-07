import {
  ShieldAlert,
  Fingerprint,
  History,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";
import { Spinner as LoadingSpinner } from "./ui/spinner";

export function FraudDetectionPanel() {
  const { data: flaggedTxs, isLoading } = trpc.nodes.listBranches.useQuery(); // Just to trigger a query for now, I'll use listBranches as a proxy if needed
  // In a real app, I'd have a specific trpc.ai.getFraudFlags or similar

  // Mock data for the demonstration since we're in dev mode
  const fraudMetrics = [
    { label: "Velocity Attacks", count: 2, risk: 85, color: "text-rose-500" },
    {
      label: "Smurfing Patterns",
      count: 12,
      risk: 64,
      color: "text-orange-500",
    },
    { label: "Internal Collusion", count: 1, risk: 98, color: "text-red-600" },
    { label: "KYC Compliance", count: 3, risk: 92, color: "text-amber-500" },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div className="flex items-center justify-between p-8 bg-slate-900 dark:bg-black rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-16 w-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
            <ShieldAlert className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              Ethical Shield <span className="text-primary italic">V2.0</span>
            </h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />{" "}
              Real-time Fraud Interdiction Active
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 relative z-10">
          <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 text-center px-8">
            <div className="text-2xl font-black text-rose-500 tracking-tighter">
              0.08%
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
              Error Rate
            </div>
          </div>
          <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 text-center px-8">
            <div className="text-2xl font-black text-emerald-500 tracking-tighter">
              100%
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
              Audit Coverage
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {fraudMetrics.map((m, i) => (
          <Card
            key={i}
            className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden hover-lift transition-all duration-300"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {m.label}
              </CardTitle>
              <div className={`${m.color} h-2 w-2 rounded-full animate-ping`} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter italic">
                  {m.count}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  Detected
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                  <span>Risk Intensity</span>
                  <span>{m.risk}%</span>
                </div>
                <Progress value={m.risk} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <Fingerprint className="h-6 w-6 text-primary" /> Active Compliance
              Watch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {[
                {
                  id: 1,
                  type: "KYC MISSING",
                  user: "Sarah Sibanda (ID: 102)",
                  risk: "CRITICAL",
                  score: 0.92,
                  time: "10:03 AM",
                  reason: "TX > $500 without ID record",
                },
                {
                  id: 2,
                  type: "Collusion",
                  user: "John Agent (ID: 882)",
                  risk: "CRITICAL",
                  score: 0.98,
                  time: "2h ago",
                },
                {
                  id: 3,
                  type: "Velocity",
                  user: "Mary Node (ID: 104)",
                  risk: "HIGH",
                  score: 0.85,
                  time: "4h ago",
                },
              ].map(flag => (
                <div
                  key={flag.id}
                  className="p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Fingerprint className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                          {flag.type} Pattern
                        </p>
                        <Badge
                          className={`text-[9px] font-black border-none px-2 ${
                            flag.risk === "CRITICAL"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {flag.risk}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        {flag.user}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-lg font-black text-slate-800 dark:text-white tracking-tighter italic">
                      {(flag.score * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {flag.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-900 dark:bg-black rounded-[2.5rem] overflow-hidden text-white flex flex-col justify-center p-12 space-y-8 relative group cursor-pointer">
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[50px] -z-10" />
          <div className="space-y-4">
            <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 animate-bounce">
              <ShieldCheck className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-4xl font-black italic uppercase tracking-tighter">
              AI Ethics <br />
              Audit <span className="text-primary italic">Report</span>
            </h3>
            <p className="text-slate-400 text-sm max-w-xs font-bold leading-relaxed uppercase tracking-widest opacity-80">
              The latest system-wide ethical audit was completed at 04:00 AM
              Today.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <History className="h-5 w-5" />
              <span className="text-sm font-black uppercase tracking-widest italic leading-none">
                NO BREACHES DETECTED IN LAST 6H
              </span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-black uppercase tracking-widest italic leading-none">
                ETHICAL SCORE: 99.98% (STABLE)
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
