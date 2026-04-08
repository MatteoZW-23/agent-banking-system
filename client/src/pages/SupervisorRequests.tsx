import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2, XCircle, Clock, ShieldCheck, Filter } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function SupervisorRequests() {
  const floatRequests = trpc.nodes.listFloatRequests.useQuery({ status: "pending" });
  
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

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic font-outfit">
              Verification <span className="text-primary not-italic">Queue</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Screen and authorize terminal liquidity requests</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-12 rounded-2xl border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest px-6">
               <Filter className="mr-2 h-4 w-4" /> Filter Results
             </Button>
             <Button 
               onClick={() => floatRequests.refetch()}
               className="h-12 rounded-2xl premium-gradient text-white font-black uppercase text-[10px] tracking-widest px-8 shadow-xl shadow-primary/20"
             >
               Sync Registry
             </Button>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/40 dark:shadow-none rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-3xl">
          <CardContent className="p-0">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                     <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Reference</th>
                     <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Agent/Station</th>
                     <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Liquidity Amount</th>
                     <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Reasoning</th>
                     <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                   {floatRequests.data?.map((req: any) => (
                     <tr key={req.id} className="group hover:bg-slate-50/30 dark:hover:bg-white/[0.02] transition-colors">
                       <td className="px-10 py-10">
                          <Badge className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 border-none font-mono text-[9px] px-3 py-1 rounded-lg">
                            REQ_{req.id.toString().padStart(4, '0')}
                          </Badge>
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center font-black text-primary text-xs italic font-outfit">
                               #{req.employeeId}
                             </div>
                             <div>
                               <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Agent Terminal</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Stall ID: {req.employeeId}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-10">
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter">${parseFloat(req.amount).toLocaleString()}</span>
                       </td>
                       <td className="px-10 py-10 max-w-xs">
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic line-clamp-2">
                            {req.workerNotes || "Routine operational top-up"}
                          </p>
                       </td>
                       <td className="px-10 py-10">
                          <div className="flex items-center gap-3">
                             <Button 
                               onClick={() => handleApprove(req.id)}
                               disabled={processMutation.isPending}
                               className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                             >
                               Verify
                             </Button>
                             <Button 
                               onClick={() => handleDecline(req.id)}
                               disabled={processMutation.isPending}
                               className="h-10 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-rose-500/20"
                             >
                               Decline
                             </Button>
                          </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {(!floatRequests.data || floatRequests.data.length === 0) && (
                 <div className="p-20 text-center">
                    <ShieldCheck className="h-16 w-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
                    <p className="text-sm font-black text-slate-300 uppercase tracking-[0.3em]">No Pending Requests Found</p>
                 </div>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
