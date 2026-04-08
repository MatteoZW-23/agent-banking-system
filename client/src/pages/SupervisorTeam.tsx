import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users2, UserPlus, ShieldX, Phone, Mail, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

function AgentEnrollmentForm({ onEnroll }: { onEnroll: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    branchId: 1,
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
    <Card className="border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/40 dark:shadow-none rounded-[3rem] bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-white/5 p-10 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
             <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-black uppercase tracking-tighter font-outfit italic">Agent Enrollment</CardTitle>
            <CardDescription className="text-[11px] font-bold uppercase tracking-[0.3em] mt-2 text-slate-400">Expand your regional network footprint</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Legal Identity</label>
               <Input 
                 placeholder="FULL NAME..." 
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 transition-all font-black text-xs uppercase italic px-6"
                 required 
               />
             </div>
             <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Communication</label>
               <Input 
                 placeholder="OFFICIAL EMAIL..." 
                 type="email"
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})}
                 className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 transition-all font-black text-xs uppercase italic px-6"
               />
             </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 italic">Direct Reach</label>
            <Input 
              placeholder="PHONE NUMBER (+263...)" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 transition-all font-black text-xs uppercase italic px-6"
            />
          </div>
          <Button 
            disabled={createMutation.isPending}
            className="w-full h-16 rounded-2xl premium-gradient text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-all mt-4 italic"
          >
            {createMutation.isPending ? "Validating Credentials..." : "Authorize Network Onboarding"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SupervisorTeam() {
  const employees = trpc.nodes.listEmployees.useQuery();
  
  const terminateMutation = trpc.nodes.updateEmployee.useMutation({
    onSuccess: () => {
      toast.success("Agent terminated and access revoked.");
      employees.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-16 pb-24">
        <div className="flex flex-col md:items-center gap-8 border-b border-slate-100 dark:border-white/5 pb-10">
           <div className="text-center md:text-left w-full">
              <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic font-outfit">
                Team <span className="text-primary not-italic">Roster</span>
              </h1>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-3">Governance and managed personnel oversight</p>
           </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
           <AgentEnrollmentForm onEnroll={() => employees.refetch()} />
           
           <div className="space-y-8">
              <div className="flex items-center justify-between px-4">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic font-outfit">Active Agents</h2>
                 <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black px-4 py-1.5 rounded-xl uppercase">Live: {employees.data?.filter(e => e.role === 'agent' && e.status === 'active').length || 0}</Badge>
              </div>

              <div className="space-y-4">
                 {employees.data?.filter(e => e.role === 'agent' && e.status === 'active').map((agent: any) => (
                   <div key={agent.id} className="group relative">
                      <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-[1.25rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10 group-hover:bg-primary/5 transition-colors">
                               <span className="text-2xl font-black text-slate-400 dark:text-slate-600 group-hover:text-primary italic font-outfit">{agent.name[0]}</span>
                            </div>
                            <div>
                               <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic font-outfit">{agent.name}</p>
                               <div className="flex items-center gap-4 mt-2">
                                  <Badge variant="outline" className="border-slate-200 dark:border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-400 bg-transparent">ID: {agent.uniqueCode}</Badge>
                                  <div className="flex items-center gap-1.5">
                                     <Phone className="h-3 w-3 text-emerald-500" />
                                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{agent.phone || "No Phone"}</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                         
                         <Button
                           variant="outline"
                           onClick={() => {
                             if (confirm(`Authorize termination of ${agent.name}? This action is immediate and revokes all terminal access.`)) {
                                terminateMutation.mutate({ id: agent.id, status: 'inactive' });
                             }
                           }}
                           className="h-12 px-6 rounded-2xl border-rose-100 dark:border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
                         >
                           Terminate Access
                         </Button>
                      </div>
                   </div>
                 ))}
                 {(!employees.data || employees.data.filter(e => e.role === 'agent' && e.status === 'active').length === 0) && (
                   <div className="p-20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] text-center bg-slate-50/30">
                      <ShieldX className="h-12 w-12 text-slate-200 mx-auto mb-6" />
                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest leading-loose">No personnel currently assigned<br/>to your management registry</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
