import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import PageHeader from "@/components/PageHeader";
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
  Fingerprint,
  Plus,
  Zap,
  Globe2,
  Lock,
  Cpu,
  Server,
  Layers,
  Network,
  IdCard,
  UserCog,
  ChevronRight,
  Database,
  Mail,
  Phone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

function EmployeeLines({ employeeId }: { employeeId: number }) {
  const linesQuery = trpc.nodes.getEmployeeLines.useQuery({ employeeId });
  const providersQuery = trpc.providers.list.useQuery();

  if (linesQuery.isLoading)
    return (
      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded mt-2" />
    );

  return (
    <div className="mt-4 space-y-2 animate-fade-in">
      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] pl-1 mb-2">
        Active Provider Mesh
      </p>
      <div className="grid gap-2">
        {linesQuery.data?.map((line: any) => {
          const provider = providersQuery.data?.find(
            p => p.id === line.providerId
          );
          return (
            <div
              key={line.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter">
                    {provider?.name || "Unknown"}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">
                    LINE: {line.agentCode}
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] font-bold px-2 py-0 border-slate-200 text-slate-400"
              >
                AUDITED
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ZIMBABWE_TOWNS = [
  "Harare",
  "Bulawayo",
  "Chitungwiza",
  "Mutare",
  "Epworth",
  "Gweru",
  "Kwekwe",
  "Kadoma",
  "Masvingo",
  "Chinhoyi",
  "Norton",
  "Marondera",
  "Ruwa",
  "Chegutu",
  "Zvishavane",
  "Bindura",
  "Beitbridge",
  "Redcliff",
  "Victoria Falls",
  "Hwange",
  "Rusape",
  "Chiredzi",
  "Kariba",
  "Karoi",
  "Chipinge",
  "Gokwe",
  "Shurugwi",
  "Gwanda",
  "Mashava",
  "Mazowe",
  "Glendale",
  "Penhalonga",
  "Mvurwi",
  "Lupane",
  "Plumtree",
  "Insiza",
  "Zaka",
  "Bikita",
  "Nkayi",
  "Centenary",
  "Mount Darwin",
];

export default function Nodes() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const branchesQuery = trpc.nodes.listBranches.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const employeesQuery = trpc.nodes.listEmployees.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createEmployeeMutation = trpc.nodes.createEmployee.useMutation();
  const registerLineMutation = trpc.nodes.registerLine.useMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New Agent Form State
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [newRole, setNewRole] = useState("agent");
  const [activeServices, setActiveServices] = useState<Record<number, string>>(
    {}
  );

  const handleAddAgent = async () => {
    if (!newName || !newCode || !newBranchId) {
      toast.error("Complete core identity fields");
      return;
    }

    try {
      const employee = await createEmployeeMutation.mutateAsync({
        name: newName,
        uniqueCode: newCode,
        email: newEmail,
        phone: newPhone,
        location: newLocation,
        branchId: parseInt(newBranchId),
        role: newRole as any,
      });

      for (const [providerId, agentCode] of Object.entries(activeServices)) {
        if (agentCode) {
          await registerLineMutation.mutateAsync({
            employeeId: employee.id,
            providerId: parseInt(providerId),
            agentCode: agentCode,
          });
        }
      }

      toast.success(`Agent ${newName} onboarded`);
      setIsDialogOpen(false);
      employeesQuery.refetch();

      setNewName("");
      setNewCode("");
      setNewEmail("");
      setNewPhone("");
      setNewLocation("");
      setNewBranchId("");
      setNewRole("agent");
      setActiveServices({});
    } catch (err) {
      toast.error("Process failed");
    }
  };

  if (!isAuthenticated) return null;

  const branches = branchesQuery.data || [];
  const employees = employeesQuery.data || [];

  const filteredEmployees = employees.filter(
    emp =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-12 animate-fade-in pb-20 px-4 lg:px-0">
        {/* Network Header Node */}
        <PageHeader
          title="Network Nodes"
          subtitle="Workforce optimization and regional hub telemetry orchestration."
          category="Strategic Distribution"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-[1.25rem] px-6 border-slate-200 dark:border-slate-800 font-black text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-all"
              >
                <Navigation className="mr-3 h-4 w-4" /> Global Map
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 rounded-[1.25rem] premium-gradient text-white px-8 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all">
                    <UserPlus className="mr-3 h-4 w-4 text-white" /> Register
                    Personnel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 bg-white dark:bg-[#0f172a] overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-10 pb-6 border-b border-slate-50 dark:border-slate-800">
                    <DialogHeader className="space-y-5">
                      <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                        <UserCog className="h-7 w-7 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <DialogTitle className="text-3xl font-black font-outfit uppercase tracking-tighter italic">
                          Personnel Registry
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Institutional Onboarding Node
                        </DialogDescription>
                      </div>
                    </DialogHeader>
                  </div>

                  <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                          Full Legal Name
                        </label>
                        <input
                          placeholder="e.g. Tendai"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-sm transition-all focus:ring-8 focus:ring-primary/5 focus:border-primary/20 outline-none text-slate-800 dark:text-white font-outfit placeholder:text-slate-200 shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                          Employee ID
                        </label>
                        <input
                          placeholder="EMP-XXXX"
                          value={newCode}
                          onChange={e =>
                            setNewCode(e.target.value.toUpperCase())
                          }
                          className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-sm transition-all focus:ring-8 focus:ring-primary/5 focus:border-primary/20 outline-none text-slate-800 dark:text-white font-mono placeholder:text-slate-200 uppercase shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic block h-4">
                          Home Hub (Branch)
                        </label>
                        <div className="relative isolate">
                          <select
                            value={newBranchId}
                            onChange={e => setNewBranchId(e.target.value)}
                            className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs transition-all appearance-none outline-none focus:border-primary/40 text-slate-800 dark:text-slate-200 cursor-pointer shadow-inner pr-12"
                          >
                            <option value="">Select Cluster Node...</option>
                            {branches.map(b => (
                              <option
                                key={b.id}
                                value={b.id}
                                className="bg-white dark:bg-slate-900"
                              >
                                {b.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                            <ChevronDown className="h-5 w-5 text-slate-300" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic block h-4">
                          Network Tier (Role)
                        </label>
                        <div className="relative isolate">
                          <select
                            value={newRole}
                            onChange={e => setNewRole(e.target.value)}
                            className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs transition-all appearance-none outline-none focus:border-primary/40 text-slate-800 dark:text-slate-200 cursor-pointer shadow-inner pr-12"
                          >
                            <option
                              value="agent"
                              className="bg-white dark:bg-slate-900"
                            >
                              Field Agent
                            </option>
                            <option
                              value="supervisor"
                              className="bg-white dark:bg-slate-900"
                            >
                              Hub Supervisor
                            </option>
                            <option
                              value="manager"
                              className="bg-white dark:bg-slate-900"
                            >
                              Regional Manager
                            </option>
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                            <ChevronDown className="h-5 w-5 text-slate-300" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                          Email Address
                        </label>
                        <div className="relative group overflow-hidden">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20">
                            <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-primary transition-all" />
                          </div>
                          <input
                            placeholder="email@agent.co.zw"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="w-full h-14 pl-14 pr-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs transition-all focus:ring-8 focus:ring-primary/5 focus:border-primary/20 outline-none text-slate-800 dark:text-white font-inter placeholder:text-slate-100 shadow-inner"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                          Phone Number
                        </label>
                        <div className="relative group overflow-hidden">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20">
                            <Phone className="h-5 w-5 text-slate-300 group-focus-within:text-primary transition-all" />
                          </div>
                          <input
                            placeholder="+263 7..."
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                            className="w-full h-14 pl-14 pr-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs transition-all focus:ring-8 focus:ring-primary/5 focus:border-primary/20 outline-none text-slate-800 dark:text-white font-inter placeholder:text-slate-100 shadow-inner"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                        Zimbabwe Worksite Town/City
                      </label>
                      <div className="relative isolate group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20">
                          <MapPin className="h-5 w-5 text-slate-300 group-focus-within:text-primary transition-all" />
                        </div>
                        <select
                          value={newLocation}
                          onChange={e => setNewLocation(e.target.value)}
                          className="w-full h-14 pl-14 pr-12 bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs transition-all appearance-none outline-none focus:border-primary/40 text-slate-800 dark:text-slate-200 cursor-pointer shadow-inner"
                        >
                          <option
                            value=""
                            className="bg-white dark:bg-slate-900"
                          >
                            Select Town/City...
                          </option>
                          {ZIMBABWE_TOWNS.map(town => (
                            <option
                              key={town}
                              value={town}
                              className="bg-white dark:bg-slate-900"
                            >
                              {town}
                            </option>
                          ))}
                          <option
                            value="Other"
                            className="bg-white dark:bg-slate-900"
                          >
                            Other (Remote/Field)
                          </option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                          <ChevronDown className="h-5 w-5 text-slate-300" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8 pt-10">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.35em] italic">
                          Identity Mesh Mapping
                        </h4>
                        <div className="h-px flex-1 mx-8 bg-slate-50 dark:bg-slate-800 shadow-inner" />
                        <Layers className="h-4 w-4 text-primary opacity-30" />
                      </div>

                      <div className="grid gap-3">
                        {providersQuery.data?.map((p: any) => (
                          <div
                            key={p.id}
                            className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-50 dark:border-slate-800/50 flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`h-11 w-11 rounded-[1.25rem] flex items-center justify-center transition-all ${activeServices[p.id] ? "bg-primary/20 text-primary shadow-lg shadow-primary/10" : "bg-white dark:bg-slate-800 text-slate-200"}`}
                              >
                                <Smartphone className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col">
                                <span
                                  className={`text-[11px] font-black uppercase tracking-widest italic ${activeServices[p.id] ? "text-slate-950 dark:text-white" : "text-slate-400"}`}
                                >
                                  {p.name}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-70">
                                  Zim Hub Link
                                </span>
                              </div>
                            </div>
                            <div className="relative max-w-[180px] w-full">
                              <input
                                placeholder="Agent ID..."
                                value={activeServices[p.id] || ""}
                                onChange={e =>
                                  setActiveServices({
                                    ...activeServices,
                                    [p.id]: e.target.value,
                                  })
                                }
                                className="w-full h-11 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 text-xs font-mono font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary/30 transition-all text-center placeholder:text-slate-100 shadow-inner"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-10 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-50 dark:border-slate-800 flex flex-col items-center gap-4">
                    <Button
                      onClick={handleAddAgent}
                      className="w-full h-16 rounded-[1.5rem] premium-gradient text-white font-black text-lg uppercase tracking-[0.25em] shadow-2xl shadow-primary/30 font-outfit italic flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Commit Personnel Entry{" "}
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-6 opacity-40">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest font-inter">
                          Audit Path
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest font-inter">
                          Live Entry
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          }
          onRefresh={() => {
            employeesQuery.refetch();
            branchesQuery.refetch();
            providersQuery.refetch();
            toast.success("Workforce Mesh Refreshed");
          }}
        />

        {/* Global Summary Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            {
              label: "Total Workforce",
              value: employees.length.toString(),
              sub: "Personnel",
              icon: Users2,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Provider Ties",
              value: "721",
              sub: "Active Lines",
              icon: Smartphone,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
            {
              label: "Network Active",
              value: "99.9%",
              sub: "Node Uptime",
              icon: Activity,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Regional Pool",
              value: "$482K",
              sub: "Available Float",
              icon: Wallet,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className="border-none shadow-sm dark:bg-slate-900/50 rounded-[2.5rem] overflow-hidden group"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-4 px-8 pt-10">
                <div className={`p-3.5 rounded-2xl ${stat.bg} shadow-soft`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="text-4xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tighter italic">
                  {stat.value}
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Node Registry */}
        <Card className="border-none shadow-sm dark:bg-slate-900/50 rounded-[3rem] overflow-hidden">
          <div className="h-1.5 premium-gradient opacity-30 w-full" />
          <CardHeader className="flex flex-row items-center justify-between pt-12 px-10 pb-6">
            <div className="space-y-1.5">
              <CardTitle className="text-3xl font-black font-outfit uppercase tracking-tighter italic">
                Regional Grid Monitor
              </CardTitle>
              <CardDescription className="text-xs uppercase font-bold text-slate-400 tracking-[0.2em] italic">
                Consolidated workforce density & service mesh status
              </CardDescription>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-6 py-2.5 font-black text-[10px] uppercase italic tracking-[0.3em] rounded-full animate-pulse transition-all">
              Online Hubs Verified
            </Badge>
          </CardHeader>
          <CardContent className="px-10 pb-12">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-50 dark:border-slate-800">
                    <TableHead className="text-xs font-black uppercase tracking-[0.25em] py-8 text-primary italic">
                      Node Hub Identity
                    </TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-[0.25em] text-center italic">
                      Personnel density
                    </TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-[0.25em] text-center italic">
                      Hardware Ties
                    </TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-[0.25em] text-right italic">
                      Node Pool
                    </TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-[0.25em] text-right italic">
                      Service
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch: any) => {
                    const branchEmployees = employees.filter(
                      e => e.branchId === branch.id
                    );
                    return (
                      <TableRow
                        key={branch.id}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/10 border-slate-50 dark:border-slate-900 h-28 transition-all cursor-pointer"
                      >
                        <TableCell>
                          <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-slate-200 group-hover:bg-primary/5 group-hover:text-primary transition-all shadow-inner">
                              <MapPin className="h-7 w-7" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 dark:text-slate-100 text-xl font-outfit uppercase italic tracking-tighter shadow-primary">
                                {branch.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] font-inter mt-1 italic opacity-60">
                                {branch.region} Hub
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-2xl font-black text-slate-950 dark:text-white font-outfit italic tracking-tighter">
                            {branchEmployees.length} Units
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex flex-col items-center gap-1.5 px-6 py-3 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 group-hover:border-primary/20 transition-all shadow-sm">
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest italic">
                              {branchEmployees.length * 3} Identities
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-2xl font-black text-slate-950 dark:text-white font-outfit italic tracking-tighter">
                              $48,203.00
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-5">
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-5 py-2.5 uppercase italic tracking-widest rounded-xl transition-all group-hover:bg-emerald-600 group-hover:text-white">
                              Active Node
                            </Badge>
                            <button className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl text-slate-200 group-hover:text-slate-600 transition-all">
                              <MoreHorizontal className="w-8 h-8" />
                            </button>
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

        {/* Directory Search & Cards */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 py-4 px-2">
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-outfit uppercase tracking-tighter italic">
                Personnel Grid
              </h3>
              <p className="text-xs font-black text-slate-400 italic opacity-80 uppercase tracking-widest">
                Active Hardware Mapping Data
              </p>
            </div>
            <div className="relative group max-w-xl w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-all" />
              <input
                placeholder="QUERY: Search hubs by name or employee ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-16 pr-8 h-16 w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] focus:outline-none focus:ring-[15px] focus:ring-primary/5 transition-all text-sm font-black uppercase tracking-widest shadow-inner placeholder:text-slate-100 dark:placeholder:text-slate-800"
              />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEmployees.map(emp => {
              const isExpanded = expandedEmployee === emp.id;
              const branch = branches.find(b => b.id === emp.branchId);
              return (
                <Card
                  key={emp.id}
                  className={`border-none shadow-sm dark:bg-slate-900/50 overflow-hidden transition-all duration-500 rounded-[2.5rem] ${isExpanded ? "ring-4 ring-primary/10 scale-[1.03] z-10" : "hover:scale-[1.01]"}`}
                >
                  <CardContent className="p-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-[1.5rem] premium-gradient text-white flex items-center justify-center font-black text-2xl font-outfit italic shadow-2xl shadow-primary/20">
                          {emp.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-outfit leading-none mb-1.5 uppercase italic tracking-tighter">
                            {emp.name}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter opacity-60 italic">
                            CODE: {emp.uniqueCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Worksite & Branch Info */}
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-4">
                          <div className="h-9 w-9 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-primary border border-white/5">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest italic truncate max-w-[120px]">
                            {branch?.name || "Unassigned"}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black border-slate-100 dark:border-slate-800 text-slate-300 uppercase italic px-4 py-1.5 rounded-xl"
                        >
                          {emp.role}
                        </Badge>
                      </div>

                      {emp.location && (
                        <div className="p-4 bg-primary/5 dark:bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase italic tracking-widest truncate">
                            {emp.location}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() =>
                        setExpandedEmployee(isExpanded ? null : emp.id)
                      }
                      variant="ghost"
                      className={`w-full h-16 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-between transition-all duration-500 ${isExpanded ? "bg-slate-900 text-primary italic" : "bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-950"}`}
                    >
                      {isExpanded ? (
                        <>
                          Collapse identity <ChevronUp className="h-6 w-6" />
                        </>
                      ) : (
                        <>
                          Audit Service Link <ChevronDown className="h-6 w-6" />
                        </>
                      )}
                    </Button>

                    {isExpanded && <EmployeeLines employeeId={emp.id} />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Global Hub Telemetry Footer */}
        <div className="p-20 rounded-[5rem] bg-slate-950 text-white relative overflow-hidden shadow-2xl mt-20">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] -translate-y-1/2 translate-x-1/2 pointer-events-none">
            <ShieldCheck className="h-96 w-96" />
          </div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="h-24 w-24 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                <Fingerprint className="h-12 w-12 text-white" />
              </div>
              <div className="space-y-8">
                <h4 className="text-6xl font-black font-outfit uppercase italic tracking-tighter text-white leading-none shadow-primary">
                  Multi-Node Integrity Hub
                </h4>
                <p className="text-xl text-slate-400 leading-relaxed font-medium font-inter italic opacity-80 max-w-2xl">
                  Consolidating the regional workforce across EcoCash, Omari,
                  OneMoney, and banking credentials into a unified executive
                  telemetry suite for the modern Zimbabwean economy.
                </p>
              </div>
              <div className="flex items-center gap-16">
                <div className="flex flex-col">
                  <span className="text-6xl font-black font-outfit text-white tracking-widest">
                    {employees.length}
                  </span>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mt-4 italic shadow-primary">
                    Personnel Nodes
                  </span>
                </div>
                <div className="h-24 w-px bg-white/10" />
                <div className="flex flex-col text-primary">
                  <span className="text-6xl font-black font-outfit text-primary tracking-widest">
                    721
                  </span>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mt-4 italic shadow-primary">
                    Audited Ties
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {[
                { label: "InnBucks", value: "182", color: "text-amber-500" },
                { label: "OneMoney", value: "204", color: "text-blue-500" },
                { label: "EcoCash", value: "220", color: "text-rose-500" },
                { label: "Omari", value: "115", color: "text-emerald-500" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-10 bg-white/5 border border-white/5 rounded-[3.5rem] space-y-6 group hover:bg-white/10 transition-all shadow-2xl shadow-black/20"
                >
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-50 group-hover:opacity-100 transition-opacity">
                    Cloud-Link: {stat.label}
                  </p>
                  <p
                    className={`text-5xl font-black font-outfit ${stat.color} italic tracking-tighter shadow-sm`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
