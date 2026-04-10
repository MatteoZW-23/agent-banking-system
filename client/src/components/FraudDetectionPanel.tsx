import {
  ShieldAlert,
  Fingerprint,
  History,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Activity,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";
import { Spinner as LoadingSpinner } from "./ui/spinner";

export function FraudDetectionPanel() {
  const { data: branches, isLoading } = trpc.nodes.listBranches.useQuery(); 

  const fraudMetrics = [
    { label: "High Volume Spikes", count: 2, risk: 85, color: "text-red-600", bg: "bg-red-50" },
    { label: "Frequent Small TXs", count: 12, risk: 64, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Account Anomalies", count: 1, risk: 98, color: "text-red-600", bg: "bg-red-50" },
    { label: "KYC Verification", count: 3, risk: 92, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  if (isLoading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      {/* Risk Summary Header */}
      <Card className="border border-gray-200 dark:border-slate-800 shadow-sm bg-gray-900 overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Fraud Monitoring</h2>
              <p className="text-gray-400 text-sm">Real-time risk assessment and activity analysis.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-5 py-2.5 bg-white/5 rounded-lg border border-white/10 text-center">
                <div className="text-lg font-bold text-red-500">0.08%</div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-tight">Alert Rate</div>
             </div>
             <div className="px-5 py-2.5 bg-white/5 rounded-lg border border-white/10 text-center">
                <div className="text-lg font-bold text-emerald-500">100%</div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-tight">System Checks</div>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {fraudMetrics.map((m, i) => (
          <Card key={i} className="border border-gray-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-tight">{m.label}</span>
                <AlertCircle className={`h-3.5 w-3.5 ${m.color}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{m.count}</span>
                <span className="text-[10px] font-medium text-gray-400">Flags</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                  <span>Probability</span>
                  <span>{m.risk}%</span>
                </div>
                <Progress value={m.risk} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Flagged List */}
        <Card className="border border-gray-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="p-5 border-b border-gray-50 dark:border-slate-800">
            <CardTitle className="text-base flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-blue-600" /> Active Risk Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {[
                { type: "KYC REJECTION", user: "Sarah Sibanda", id: "102", risk: "HIGH", score: 92, time: "10:03 AM" },
                { type: "VELOCITY SPIKE", user: "John Agent", id: "882", risk: "CRITICAL", score: 98, time: "2h ago" },
                { type: "SPLIT PAYMENTS", user: "Mary Node", id: "104", risk: "MEDIUM", score: 85, time: "4h ago" },
              ].map((flag, idx) => (
                <div key={idx} className="p-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{flag.type}</p>
                        <Badge variant="outline" className={`text-[9px] font-bold border-none px-1.5 py-0 ${flag.risk === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          {flag.risk}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{flag.user} (ID: {flag.id})</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900 dark:text-white">{flag.score}%</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase">{flag.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Health Status */}
        <Card className="border border-gray-200 dark:border-slate-800 shadow-sm bg-gray-900 text-white p-8 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="space-y-6">
            <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Compliance Status</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">
                System-wide transaction checks were completed successfully today.
              </p>
            </div>
          </div>
          <div className="space-y-3 mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-emerald-400">
              <History className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wide">NO RECENT BREACHES</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wide">SYSTEM CONFIDENCE: 99.9%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
