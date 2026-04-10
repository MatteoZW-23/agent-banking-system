import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users2, UserPlus, ShieldX, Phone, Mail, MapPin, Search, Settings, XCircle, ChevronDown, ChevronUp, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";

function AgentEnrollmentForm({ onEnroll }: { onEnroll: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    branchId: 1,
  });

  const createMutation = trpc.nodes.createEmployee.useMutation({
    onSuccess: () => {
      toast.success("Agent enrolled successfully");
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
    <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
      <CardHeader className="pb-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Enroll Agent</CardTitle>
            <CardDescription className="text-xs">Add a new member to your team</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Full Name</label>
              <Input 
                placeholder="Enter name..." 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="h-10 rounded-lg bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-sm"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Email</label>
              <Input 
                placeholder="email@company.co.zw" 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="h-10 rounded-lg bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Phone</label>
            <Input 
              placeholder="+263 7..." 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="h-10 rounded-lg bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-sm"
            />
          </div>
          <Button 
            disabled={createMutation.isPending}
            className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm mt-2"
          >
            {createMutation.isPending ? "Enrolling..." : "Enroll Agent"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LineManager({ agentId, onUpdate }: { agentId: number; onUpdate: () => void }) {
  const lines = trpc.nodes.getEmployeeLines.useQuery({ employeeId: agentId });
  const providers = trpc.nodes.listProviders.useQuery();
  
  const registerMutation = trpc.nodes.registerLine.useMutation({
    onSuccess: () => {
      toast.success("Line registered");
      lines.refetch();
      onUpdate();
    }
  });

  const deleteMutation = trpc.nodes.deleteLine.useMutation({
    onSuccess: () => {
      toast.success("Line revoked");
      lines.refetch();
      onUpdate();
    }
  });

  const [newLine, setNewLine] = useState({ providerId: "", agentCode: "" });

  return (
    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-700 space-y-4">
       <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Provider Lines</h4>
          <div className="flex items-center gap-2">
             <select 
               value={newLine.providerId}
               onChange={e => setNewLine({...newLine, providerId: e.target.value})}
               className="h-8 px-3 bg-gray-50 dark:bg-slate-800 rounded-md text-xs font-medium border border-gray-200 dark:border-slate-700 outline-none focus:border-blue-500"
             >
               <option value="">Select provider...</option>
               {providers.data?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
             <Input 
               placeholder="Agent code..." 
               value={newLine.agentCode}
               onChange={e => setNewLine({...newLine, agentCode: e.target.value})}
               className="h-8 w-28 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-xs font-mono"
             />
             <Button 
               onClick={() => registerMutation.mutate({ employeeId: agentId, providerId: parseInt(newLine.providerId), agentCode: newLine.agentCode })}
               disabled={!newLine.providerId || !newLine.agentCode || registerMutation.isPending}
               size="sm"
               className="h-8 px-3 bg-blue-600 text-white rounded-md text-xs font-medium"
             >
               Add
             </Button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {lines.data?.map((line: any) => (
            <div key={line.id} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 flex items-center justify-between group">
               <div className="flex items-center gap-2.5">
                  <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium text-blue-600">{providers.data?.find((p: any) => p.id === line.providerId)?.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{line.agentCode}</p>
                  </div>
               </div>
               <Button 
                 onClick={() => {
                   if(confirm("Revoke this line?")) {
                      deleteMutation.mutate({ id: line.id });
                   }
                 }}
                 variant="ghost" 
                 size="icon"
                 className="h-7 w-7 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
               >
                  <XCircle className="h-3.5 w-3.5" />
               </Button>
            </div>
          ))}
          {(!lines.data || lines.data.length === 0) && (
            <div className="col-span-full py-4 text-center border border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
               <span className="text-xs text-gray-400">No lines assigned</span>
            </div>
          )}
       </div>
    </div>
  );
}

export default function SupervisorTeam() {
  const employees = trpc.nodes.listEmployees.useQuery();
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  
  const terminateMutation = trpc.nodes.updateEmployee.useMutation({
    onSuccess: () => {
      toast.success("Agent terminated.");
      employees.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Team Management"
          subtitle="Enroll agents and manage provider access."
          category="Supervisor"
        />

        <div className="grid lg:grid-cols-2 gap-8 items-start">
           <AgentEnrollmentForm onEnroll={() => employees.refetch()} />
           
           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Agents</h2>
                 <Badge className="bg-blue-50 text-blue-700 border-none font-medium text-xs">
                   {employees.data?.filter(e => e.role === 'agent' && e.status === 'active').length || 0} active
                 </Badge>
              </div>

              <div className="space-y-3">
                 {employees.data?.filter(e => e.role === 'agent' && e.status === 'active').map((agent: any) => (
                   <Card
                     key={agent.id}
                     className={`border border-gray-200 dark:border-slate-700 shadow-sm transition-all ${expandedAgent === agent.id ? 'ring-2 ring-blue-300' : ''}`}
                   >
                     <CardContent className="p-5">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}>
                             <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-colors ${expandedAgent === agent.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                                {agent.name[0]}
                             </div>
                             <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{agent.name}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                   <Badge variant="outline" className="text-[10px] font-medium text-gray-400 border-gray-200">ID: {agent.uniqueCode}</Badge>
                                   {agent.phone && (
                                     <span className="text-xs text-gray-400 flex items-center gap-1">
                                       <Phone className="h-3 w-3 text-emerald-500" /> {agent.phone}
                                     </span>
                                   )}
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <Button
                               variant="outline"
                               onClick={() => {
                                 if (confirm(`Terminate ${agent.name}? This revokes all access.`)) {
                                    terminateMutation.mutate({ id: agent.id, status: 'inactive' });
                                 }
                               }}
                               size="sm"
                               className="h-8 px-3 rounded-md border-red-200 text-red-600 hover:bg-red-50 font-medium text-xs"
                             >
                               Terminate
                             </Button>
                             <Button
                               onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 rounded-md"
                             >
                                {expandedAgent === agent.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                             </Button>
                          </div>
                       </div>
                       
                       {expandedAgent === agent.id && (
                         <LineManager agentId={agent.id} onUpdate={() => employees.refetch()} />
                       )}
                     </CardContent>
                   </Card>
                 ))}
                 {(!employees.data || employees.data.filter(e => e.role === 'agent' && e.status === 'active').length === 0) && (
                   <div className="p-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-center">
                      <Users2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No agents assigned to your team</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
