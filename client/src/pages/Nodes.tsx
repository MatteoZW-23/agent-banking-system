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
  AlertCircle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

function EmployeeLines({ employeeId }: { employeeId: number }) {
  const linesQuery = trpc.nodes.getEmployeeLines.useQuery({ employeeId });
  const providersQuery = trpc.providers.list.useQuery();

  if (linesQuery.isLoading)
    return (
      <div className="h-4 w-full bg-gray-100 dark:bg-slate-800 animate-pulse rounded mt-2" />
    );

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide pl-1 mb-2">
        Assigned Lines
      </p>
      <div className="grid gap-1.5">
        {linesQuery.data?.map((line: any) => {
          const provider = providersQuery.data?.find(
            p => p.id === line.providerId
          );
          return (
            <div
              key={line.id}
              className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                  <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-700 dark:text-slate-200">
                    {provider?.name || "Unknown"}
                  </span>
                  <span className="font-mono text-[10px] text-gray-400 block">
                    {line.agentCode}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 border-gray-200 text-gray-400">
                Active
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ZIMBABWE_TOWNS = [
  "Harare", "Bulawayo", "Chitungwiza", "Mutare", "Epworth", "Gweru",
  "Kwekwe", "Kadoma", "Masvingo", "Chinhoyi", "Norton", "Marondera",
  "Ruwa", "Chegutu", "Zvishavane", "Bindura", "Beitbridge", "Redcliff",
  "Victoria Falls", "Hwange", "Rusape", "Chiredzi", "Kariba", "Karoi",
  "Chipinge", "Gokwe", "Shurugwi", "Gwanda", "Mashava", "Mazowe",
  "Glendale", "Penhalonga", "Mvurwi", "Lupane", "Plumtree", "Insiza",
  "Zaka", "Bikita", "Nkayi", "Centenary", "Mount Darwin",
];

export default function Nodes() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const branchesQuery = trpc.nodes.listBranches.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const employeesQuery = trpc.nodes.listEmployees.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });
  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createEmployeeMutation = trpc.nodes.createEmployee.useMutation();
  const updateEmployeeMutation = trpc.nodes.updateEmployee.useMutation();
  const registerLineMutation = trpc.nodes.registerLine.useMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [newRole, setNewRole] = useState("agent");
  const [activeServices, setActiveServices] = useState<Record<number, string>>({});
  const [tempCredentials, setTempCredentials] = useState<{ email: string; pass: string } | null>(null);

  const [isLocating, setIsLocating] = useState(false);

  const branches = branchesQuery.data || [];
  const employees = employeesQuery.data || [];

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const detectNearestBranch = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let nearestBranch: any = null;
        let minDistance = Infinity;

        branches.forEach((b: any) => {
          if (b.latitude && b.longitude) {
            const dist = getDistance(latitude, longitude, b.latitude, b.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              nearestBranch = b;
            }
          }
        });

        if (nearestBranch) {
          setNewBranchId(nearestBranch.id.toString());
          setNewLocation(nearestBranch.region || "");
          toast.success(`Detected proximity to ${nearestBranch.name} (${minDistance.toFixed(1)}km)`);
        }
        setIsLocating(false);
      },
      (error) => {
        toast.error("Failed to detect location", { description: error.message });
        setIsLocating(false);
      }
    );
  };

  const handleAddAgent = async () => {
    if (!newName || !newBranchId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const result = await createEmployeeMutation.mutateAsync({
        name: newName,
        email: newEmail,
        phone: newPhone,
        location: newLocation,
        branchId: parseInt(newBranchId),
        role: newRole as any,
      });

      if (result.tempPassword) {
        setTempCredentials({ 
          email: newEmail, 
          pass: (result as any).tempPassword 
        });
      }

      for (const [providerId, agentCode] of Object.entries(activeServices)) {
        if (agentCode) {
          await registerLineMutation.mutateAsync({
            employeeId: result.id,
            providerId: parseInt(providerId),
            agentCode: agentCode,
          });
        }
      }

      toast.success(`${newName} registered successfully`);
      employeesQuery.refetch();

      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewLocation("");
      setNewBranchId("");
      setNewRole("agent");
      setActiveServices({});
      
      if (!(result as any).tempPassword) {
        setIsDialogOpen(false);
      }
    } catch (err) {
      toast.error("Registration failed");
    }
  };

  if (!isAuthenticated) return null;

  const filteredEmployees = employees.filter(
    emp =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Staff Directory"
          subtitle="Manage agents, supervisors, and managers."
          category="Human Resources"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-9 rounded-lg px-4 border-gray-200 font-medium text-xs text-gray-500 hover:text-blue-600"
              >
                <Navigation className="mr-2 h-3.5 w-3.5" /> Map View
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 font-medium text-sm">
                    <UserPlus className="mr-2 h-3.5 w-3.5" /> Add Worker
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl rounded-xl border border-gray-200 shadow-lg p-0 bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="p-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                    <DialogHeader className="space-y-2">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <UserCog className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <DialogTitle className="text-xl font-bold">New Worker</DialogTitle>
                          <DialogDescription className="text-sm text-gray-500">
                            Register a new team member
                          </DialogDescription>
                        </div>
                        {!tempCredentials && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={detectNearestBranch}
                            disabled={isLocating}
                            className="h-8 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                          >
                            {isLocating ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <MapPin className="h-3 w-3" />
                            )}
                            {isLocating ? "Detecting..." : "Detect Nearest"}
                          </Button>
                        )}
                      </div>
                    </DialogHeader>
                  </div>

                  {tempCredentials ? (
                    <div className="p-6 space-y-6">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-5 text-center">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center mx-auto mb-3">
                          <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h4 className="text-emerald-900 dark:text-emerald-100 font-bold">Enrollment Successful</h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">Credentials generated for employee</p>
                      </div>

                      <div className="space-y-3">
                        <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Email Address</p>
                          <p className="text-sm font-mono font-medium">{tempCredentials.email}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Temporary Password</p>
                            <p className="text-lg font-mono font-bold text-blue-600 tracking-widest">{tempCredentials.pass}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              navigator.clipboard.writeText(tempCredentials.pass);
                              toast.success("Password copied");
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                          <strong>Security Note:</strong> Please share these credentials securely. The employee will be forced to change this password upon their first login.
                        </p>
                      </div>

                      <Button 
                        className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 h-11 rounded-lg font-bold"
                        onClick={() => {
                          setTempCredentials(null);
                          setIsDialogOpen(false);
                        }}
                      >
                        Done & Close
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Full Name *</label>
                            <input
                              placeholder="e.g. Tendai"
                              value={newName}
                              onChange={e => setNewName(e.target.value)}
                              className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Branch *</label>
                            <select
                              value={newBranchId}
                              onChange={e => {
                                const bId = e.target.value;
                                setNewBranchId(bId);
                                const b = branches.find(curr => curr.id.toString() === bId);
                                if (b && !newLocation) {
                                  setNewLocation(b.region || "");
                                }
                              }}
                              className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md font-medium text-sm outline-none focus:border-blue-500"
                            >
                              <option value="">Select branch...</option>
                              {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Role</label>
                            <select
                              value={newRole}
                              onChange={e => setNewRole(e.target.value)}
                              className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md font-medium text-sm outline-none focus:border-blue-500"
                            >
                              <option value="agent">Field Agent</option>
                              <option value="supervisor">Supervisor</option>
                              <option value="manager">Manager</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Email</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                placeholder="email@company.co.zw"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                className="w-full h-10 pl-10 pr-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Phone</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                placeholder="+263 7..."
                                value={newPhone}
                                onChange={e => setNewPhone(e.target.value)}
                                className="w-full h-10 pl-10 pr-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                              value={newLocation}
                              onChange={e => {
                                const loc = e.target.value;
                                setNewLocation(loc);
                                const matchingBranch = branches.find(b => 
                                  b.name.toLowerCase().includes(loc.toLowerCase()) || 
                                  loc.toLowerCase().includes(b.name.toLowerCase())
                                );
                                if (matchingBranch && !newBranchId) {
                                  setNewBranchId(matchingBranch.id.toString());
                                }
                              }}
                              className="w-full h-10 pl-10 pr-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md font-medium text-sm focus:border-blue-500 outline-none"
                            >
                              <option value="">Select town/city...</option>
                              {ZIMBABWE_TOWNS.map(town => (
                                <option key={town} value={town}>{town}</option>
                              ))}
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                              Provider Lines
                            </h4>
                            <Layers className="h-3.5 w-3.5 text-blue-400 opacity-40" />
                          </div>

                          <div className="grid gap-2">
                            {providersQuery.data?.map((p: any) => (
                              <div
                                key={p.id}
                                className="p-3 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-100 dark:border-slate-700 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-md flex items-center justify-center ${activeServices[p.id] ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "bg-white dark:bg-slate-700 text-gray-300"}`}>
                                    <Smartphone className="h-4 w-4" />
                                  </div>
                                  <span className={`text-sm font-medium ${activeServices[p.id] ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                                    {p.name}
                                  </span>
                                </div>
                                <input
                                  placeholder="Agent ID..."
                                  value={activeServices[p.id] || ""}
                                  onChange={e =>
                                    setActiveServices({
                                      ...activeServices,
                                      [p.id]: e.target.value,
                                    })
                                  }
                                  className="w-36 h-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded px-2.5 text-xs font-mono text-center focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex flex-col items-center gap-3">
                        <Button
                          onClick={handleAddAgent}
                          className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          Save Worker <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          }
          onRefresh={() => {
            employeesQuery.refetch();
            branchesQuery.refetch();
            providersQuery.refetch();
            toast.success("Refreshed");
          }}
        />

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Staff", value: employees.length.toString(), icon: Users2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Active Lines", value: "0", icon: Smartphone, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
            { label: "Uptime", value: "100%", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Total Float", value: "$0.00", icon: Wallet, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          ].map((stat, i) => (
            <Card key={i} className="border border-gray-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-5">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-300" />
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400 opacity-30 w-full" />
          <CardHeader className="flex flex-row items-center justify-between pt-6 px-6 pb-4">
            <div>
              <CardTitle className="text-xl">Branches</CardTitle>
              <CardDescription>Agent distribution by branch</CardDescription>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-none px-3 py-1 font-medium text-xs">
              All Active
            </Badge>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100 dark:border-slate-700">
                    <TableHead className="font-medium text-xs">Branch</TableHead>
                    <TableHead className="font-medium text-xs text-center">Staff</TableHead>
                    <TableHead className="font-medium text-xs text-center">Lines</TableHead>
                    <TableHead className="font-medium text-xs text-right">Float</TableHead>
                    <TableHead className="font-medium text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch: any) => {
                    const branchEmployees = employees.filter(e => e.branchId === branch.id);
                    return (
                      <TableRow key={branch.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-100 dark:border-slate-700 h-16">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800 dark:text-slate-100 text-base">
                                {branch.name}
                              </span>
                              <span className="text-xs text-gray-500 block mt-0.5">
                                {branch.region}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {branchEmployees.length}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-slate-300 px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-md">
                            {branchEmployees.length * 3} lines
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            $48,203.00
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Badge className="bg-emerald-50 text-emerald-700 border-none font-medium text-xs">
                              Active
                            </Badge>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
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

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Staff List</h3>
              <p className="text-sm text-gray-500 mt-0.5">Active worker profiles</p>
            </div>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEmployees.map(emp => {
              const isExpanded = expandedEmployee === emp.id;
              const branch = branches.find(b => b.id === emp.branchId);
              return (
                <Card
                  key={emp.id}
                  className={`border border-gray-200 dark:border-slate-700 shadow-sm transition-all ${isExpanded ? "ring-2 ring-blue-300" : ""}`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                        {emp.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <span className="text-base font-semibold text-gray-900 dark:text-white block">
                          {emp.name}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {emp.uniqueCode}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-md flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-xs font-medium text-gray-600 dark:text-slate-300 truncate max-w-[120px]">
                            {branch?.name || "Unassigned"}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-medium border-gray-200 text-gray-400 capitalize">
                          {emp.role}
                        </Badge>
                      </div>

                      {emp.location && (
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/10 rounded-md flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-xs font-medium text-gray-600 dark:text-slate-300 truncate">
                            {emp.location}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setExpandedEmployee(isExpanded ? null : emp.id)}
                        variant="ghost"
                        className={`flex-1 h-9 rounded-md text-xs font-medium flex items-center justify-between ${isExpanded ? "bg-gray-900 dark:bg-slate-700 text-blue-400" : "bg-gray-50 dark:bg-slate-800 text-gray-500 hover:bg-gray-100"}`}
                      >
                        {isExpanded ? (
                          <>Hide details <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>View details <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-9 w-9 p-0 border-gray-200 dark:border-slate-700">
                            <ShieldCheck className="h-4 w-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-2 border-b border-gray-100 dark:border-slate-800 mb-1">
                            Disciplinary Actions
                          </p>
                          <DropdownMenuItem 
                            onClick={async () => {
                              try {
                                await updateEmployeeMutation.mutateAsync({ id: emp.id, status: "suspended" });
                                toast.warning(`${emp.name} has been SUSPENDED`);
                                employeesQuery.refetch();
                              } catch(err) { toast.error("Failed to update status"); }
                            }}
                            className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer text-xs font-semibold p-2.5"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" /> Suspend Operative
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={async () => {
                              try {
                                await updateEmployeeMutation.mutateAsync({ id: emp.id, status: "inactive" });
                                toast.error(`${emp.name} access REVOKED`);
                                employeesQuery.refetch();
                              } catch(err) { toast.error("Failed to update status"); }
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer text-xs font-semibold p-2.5"
                          >
                            <XCircle className="h-4 w-4 mr-2" /> Deactivate Account
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={async () => {
                              try {
                                await updateEmployeeMutation.mutateAsync({ id: emp.id, status: "active" });
                                toast.success(`${emp.name} restored to ACTIVE`);
                                employeesQuery.refetch();
                              } catch(err) { toast.error("Failed to update status"); }
                            }}
                            className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer text-xs font-semibold p-2.5"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Restore Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {isExpanded && <EmployeeLines employeeId={emp.id} />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="p-8 rounded-xl bg-gray-900 text-white mt-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h4 className="text-2xl font-bold text-white">
                Network Overview
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
                Your agent network spans EcoCash, OneMoney, and banking channels across Zimbabwe.
              </p>
              <div className="flex items-center gap-8 pt-2">
                <div>
                  <span className="text-3xl font-bold">{employees.length}</span>
                  <span className="text-xs text-gray-500 block mt-1">Staff</span>
                </div>
                <div className="h-10 w-px bg-gray-700" />
                <div>
                  <span className="text-3xl font-bold">...</span>
                  <span className="text-xs text-gray-500 block mt-1">Lines Assigned</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "InnBucks", value: "182", color: "text-amber-400" },
                { label: "OneMoney", value: "204", color: "text-blue-400" },
                { label: "EcoCash", value: "220", color: "text-red-400" },
                { label: "Omari", value: "115", color: "text-emerald-400" },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>...</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
