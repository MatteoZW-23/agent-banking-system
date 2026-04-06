import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users2, 
  ShieldCheck, 
  Search, 
  MoreHorizontal, 
  MapPin, 
  Activity, 
  Wallet, 
  ArrowUpRight, 
  UserPlus, 
  RefreshCw,
  Globe,
  Navigation,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Fingerprint
} from "lucide-react";

function EmployeeLines({ employeeId }: { employeeId: number }) {
  const linesQuery = trpc.nodes.getEmployeeLines.useQuery({ employeeId });
  const providersQuery = trpc.providers.list.useQuery();
  
  if (linesQuery.isLoading) return <div className="h-4 w-full bg-slate-100 animate-pulse rounded mt-2" />;
  
  return (
    <div className="mt-4 space-y-2 animate-fade-in">
       <p className="text-[9px] font-black text-primary uppercase tracking-widest pl-1 mb-2">Active Provider Mesh</p>
       <div className="grid gap-2">
          {linesQuery.data?.map((line: any) => {
             const provider = providersQuery.data?.find(p => p.id === line.providerId);
             return (
                <div key={line.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all">
                   <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 flex items-center justify-center">
                         <Smartphone className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="flex flex-col text-left">
                         <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{provider?.name || 'Unknown'}</span>
                         <span className="font-mono text-[9px] text-slate-400">LINE: {line.agentCode}</span>
                      </div>
                   </div>
                   <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0 border-slate-200 text-slate-400">AUDITED</Badge>
                </div>
             );
          })}
       </div>
    </div>
  );
}

export default function Nodes() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const branchesQuery = trpc.nodes.listBranches.useQuery(undefined, { enabled: isAuthenticated });
  const employeesQuery = trpc.nodes.listEmployees.useQuery(undefined, { enabled: isAuthenticated });
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);

  if (!isAuthenticated) return null;

  const branches = branchesQuery.data || [];
  const employees = employeesQuery.data || [];

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Workforce & Node Operations
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Mapping individual personnel across 200+ unique provider identifiers and hardware lines.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-11 rounded-xl px-4 border-slate-200 font-bold text-xs uppercase tracking-widest text-slate-600">
               <Navigation className="mr-2 h-4 w-4" /> Global Map
             </Button>
             <Button className="h-11 rounded-xl premium-gradient text-white px-6 font-bold shadow-lg shadow-primary/20">
               <UserPlus className="mr-2 h-4 w-4" /> Add Agent
             </Button>
          </div>
        </div>

        {/* Executive Monitoring Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Workforce", value: "248", sub: "Active Personnel", icon: Users2, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Active Provider Lines", value: "721", sub: "Registered IDs", icon: Smartphone, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Network Uptime", value: "99.9%", sub: "Service Availability", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Assigned Liquidity", value: "$124K", sub: "Multi-Hub Float", icon: Wallet, color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((stat, i) => (
             <Card key={i} className="hover-lift border-none shadow-sm dark:bg-slate-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                   <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                   </div>
                   <ArrowUpRight className="h-4 w-4 text-slate-300" />
                </CardHeader>
                <CardContent>
                   <div className="text-3xl font-black text-slate-900 dark:text-white font-outfit">{stat.value}</div>
                   <div className="flex flex-col mt-1.5">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase opacity-60 font-inter">{stat.sub}</p>
                   </div>
                </CardContent>
             </Card>
          ))}
        </div>

        {/* Regional Hub Management */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Branch Pulse Table */}
          <Card className="lg:col-span-12 border-none shadow-sm dark:bg-slate-900/50 overflow-hidden">
            <div className="h-1.5 premium-gradient opacity-30 w-full" />
            <CardHeader className="flex flex-row items-center justify-between pt-8">
               <div>
                  <CardTitle className="text-2xl font-outfit">Node Operations Hub</CardTitle>
                  <CardDescription className="font-inter">Consolidated view of regional performance and workforce density</CardDescription>
               </div>
               <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1 font-black text-[10px] uppercase">ALL NODES ONLINE</Badge>
               </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="text-xs font-black uppercase tracking-widest py-4">Node Location</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest text-center">Personnel</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest text-center">Line Coverage</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest text-right">Liquidity Health</TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-widest text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch: any) => {
                      const branchEmployees = employees.filter(e => e.branchId === branch.id);
                      return (
                        <TableRow key={branch.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 border-slate-100 dark:border-slate-800 h-24 transition-colors">
                          <TableCell>
                             <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-[1.25rem] flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                   <MapPin className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                   <span className="font-black text-slate-800 dark:text-slate-100 text-lg font-outfit">{branch.name}</span>
                                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{branch.region} • Mgr: {branch.managerName}</span>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <div className="flex flex-col items-center">
                                <span className="text-base font-black text-slate-900 dark:text-white font-outfit">
                                  {branchEmployees.length} Agents
                                </span>
                                <div className="flex -space-x-1.5 mt-2">
                                   {[1,2,3,4].map(i => (
                                      <div key={i} className="h-5 w-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200" />
                                   ))}
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                <Smartphone className="h-3 w-3 text-primary" />
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">~{branchEmployees.length * 3} Codes</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex flex-col">
                                <span className="text-lg font-black text-slate-900 dark:text-white font-outfit">$48.2K</span>
                                <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full ml-auto mt-2 overflow-hidden">
                                   <div className="h-full bg-emerald-500 w-[84%] shadow-inner" />
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-3">
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-3 py-1">OPERATIONAL</Badge>
                                <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-300 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                             </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Personnel Multi-Line Directory */}
          <div className="lg:col-span-12 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black font-outfit">Active Provider Mesh</h3>
                  <p className="text-sm text-slate-400 font-inter">Auditing individual agent hardware lines (OneMoney, InnBucks, Omari)</p>
               </div>
               <div className="relative group max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                     placeholder="Filter workforce by name, employee code, or location..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-12 pr-6 h-14 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold shadow-sm"
                  />
               </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {filteredEmployees.map((emp) => {
                  const isExpanded = expandedEmployee === emp.id;
                  const branch = branches.find(b => b.id === emp.branchId);
                  return (
                    <Card key={emp.id} className={`border-none shadow-sm dark:bg-slate-900/50 transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary/20 scale-[1.02]' : 'hover:scale-[1.01]'}`}>
                       <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm">
                                   {emp.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-base font-black text-slate-800 dark:text-white font-outfit leading-none">{emp.name}</span>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 font-inter">EMP ID: {emp.uniqueCode}</span>
                                </div>
                             </div>
                             <Badge className={`border-none font-black text-[9px] uppercase px-2.5 py-0.5 ${emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                {emp.status}
                             </Badge>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <MapPin className="h-3 w-3 text-slate-400" />
                                   <span className="text-[10px] font-bold text-slate-500 truncate">{branch?.name || 'Unassigned'}</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-bold border-slate-200 uppercase">{emp.role}</Badge>
                             </div>
                          </div>

                          <Button 
                             onClick={() => setExpandedEmployee(isExpanded ? null : emp.id)}
                             variant="ghost" 
                             className={`w-full h-11 rounded-[15px] text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all ${isExpanded ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                          >
                             {isExpanded ? (
                                <>Collapse Lines <ChevronUp className="h-4 w-4" /></>
                             ) : (
                                <>View All Agent Codes <ChevronDown className="h-4 w-4" /></>
                             )}
                          </Button>

                          {isExpanded && <EmployeeLines employeeId={emp.id} />}
                       </CardContent>
                    </Card>
                  );
               })}
            </div>
          </div>
        </div>

        {/* Global Compliance Footer Card */}
        <div className="p-10 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-12 opacity-5">
              <ShieldCheck className="h-64 w-64" />
           </div>
           <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                 <div className="h-14 w-14 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Fingerprint className="h-7 w-7" />
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-3xl font-black font-outfit">Multi-Platform Identity Registry</h4>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium font-inter opacity-80">
                       Every worker in this operation is tracked through an immutable "Provider Mesh." Whether they are using a bank app, OneMoney code, or Omari credentials, the system cryptographically reconciles their activity into a single source of truth.
                    </p>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                       <span className="text-2xl font-black font-outfit">248</span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Personnel</span>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex flex-col">
                       <span className="text-2xl font-black font-outfit">721</span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active Lines</span>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: 'InnBucks Codes', value: '182', color: 'text-amber-500' },
                   { label: 'OneMoney Lines', value: '204', color: 'text-blue-500' },
                   { label: 'Bank App IDs', value: '115', color: 'text-emerald-500' },
                   { label: 'EcoCash Registers', value: '220', color: 'text-rose-500' }
                 ].map((stat, i) => (
                    <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-2 group hover:bg-white/10 transition-all">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{stat.label}</p>
                       <p className={`text-2xl font-black font-outfit ${stat.color}`}>{stat.value}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
