import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Link2,
  ShieldCheck,
  Smartphone,
  Building2,
  Layers,
  CircleDot,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ProviderConfigContent() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const providers = trpc.providers.list.useQuery();

  const [formData, setFormData] = useState({
    name: "",
    type: "mobile_money" as const,
    apiEndpoint: "",
    webhookUrl: "",
  });

  const handleSave = () => {
    console.log("Saving provider config:", formData);
    setShowForm(false);
    setFormData({
      name: "",
      type: "mobile_money",
      apiEndpoint: "",
      webhookUrl: "",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "mobile_money":
        return <Smartphone className="w-5 h-5" />;
      case "bank":
        return <Building2 className="w-5 h-5" />;
      case "fintech":
        return <Globe className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "mobile_money":
        return "bg-blue-500/10 text-blue-600";
      case "bank":
        return "bg-emerald-500/10 text-emerald-600";
      case "fintech":
        return "bg-indigo-500/10 text-indigo-600";
      default:
        return "bg-slate-500/10 text-slate-600";
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gateway Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Configure and maintain security credentials for all integrated
            providers.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-11 rounded-xl premium-gradient text-white px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          Provision New Gateway
        </Button>
      </div>

      {showForm && (
        <Card className="border-none shadow-2xl dark:bg-slate-900/80 overflow-hidden ring-1 ring-primary/20 animate-fade-in">
          <div className="h-2 premium-gradient w-full" />
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl">Configuration Portal</CardTitle>
            <CardDescription>
              Establishing a secure link to a third-party banking API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 max-w-3xl">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Friendly Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  placeholder="e.g., EcoCash Production"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Gateway Classification
                </label>
                <select
                  value={formData.type}
                  onChange={e =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                >
                  <option value="mobile_money">Mobile Money Network</option>
                  <option value="bank">Commercial Bank</option>
                  <option value="fintech">Fintech Aggregator</option>
                  <option value="aggregator">Universal Switch</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Link2 className="w-3 h-3" /> REST API Endpoint
              </label>
              <input
                type="url"
                value={formData.apiEndpoint}
                onChange={e =>
                  setFormData({ ...formData, apiEndpoint: e.target.value })
                }
                className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm uppercase"
                placeholder="HTTPS://API.PROVIDER.COM/V1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" /> Secure Webhook Callback
              </label>
              <input
                type="url"
                value={formData.webhookUrl}
                onChange={e =>
                  setFormData({ ...formData, webhookUrl: e.target.value })
                }
                className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm opacity-60"
                placeholder="https://your-domain.com/callbacks/v1"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="h-11 px-8 rounded-xl font-bold uppercase tracking-widest text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="h-11 px-8 rounded-xl premium-gradient text-white font-bold shadow-lg shadow-primary/20"
              >
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Providers Registry */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.data?.map(provider => (
          <Card
            key={provider.id}
            className="hover-lift border-none shadow-sm dark:bg-slate-900/50 group overflow-hidden"
          >
            <CardContent className="pt-8 relative">
              <div className="absolute top-0 right-0 p-4">
                <Badge
                  variant="outline"
                  className={`border-none ${provider.isActive ? "text-emerald-500" : "text-slate-300"} font-bold text-[10px] uppercase flex items-center gap-1.5`}
                >
                  <CircleDot
                    className={`w-2 h-2 ${provider.isActive ? "animate-pulse bg-emerald-500" : "bg-slate-300"} rounded-full`}
                  />
                  {provider.isActive ? "Live" : "Inactive"}
                </Badge>
              </div>

              <div className="flex flex-col items-start gap-5">
                <div
                  className={`p-4 rounded-2xl ${getCategoryColor(provider.category)}`}
                >
                  {getCategoryIcon(provider.category)}
                </div>

                <div className="space-y-1.5 w-full">
                  <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center justify-between group-hover:text-primary transition-colors">
                    {provider.name}
                    <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {provider.category.replace("_", " ")}
                  </p>
                </div>

                <div className="w-full space-y-4 pt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1.5">
                      Primary API Cluster
                    </p>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                      <span className="truncate">
                        {(provider as any).apiEndpoint || "CLUSTER_01.AWS.PROD"}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-2 opacity-40" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 rounded-lg border-slate-200 font-bold text-[10px] uppercase"
                      onClick={() => setEditingId(provider.id)}
                    >
                      <Settings className="w-3 h-3 mr-2" /> Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 rounded-lg border-slate-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* New Provider Placeholder */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="group flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-500 min-h-[300px]"
          >
            <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all">
              <Plus className="w-6 h-6 text-slate-400 group-hover:text-primary transition-all" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800 dark:text-white">
                Provision New Gateway
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Connect another regional banking node
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Empty State Management */}
      {providers.data?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-slate-900/50 rounded-3xl border-2 border-slate-50 dark:border-slate-800">
          <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
            <Smartphone className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
            Registry Empty
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mt-2 font-medium">
            No operational gateways detected. Start by provisioning your first
            mobile money or bank integration.
          </p>
          <Button
            className="mt-8 h-12 px-8 rounded-xl premium-gradient text-white font-bold shadow-xl shadow-primary/20"
            onClick={() => setShowForm(true)}
          >
            Build Integration Cluster
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProviderConfig() {
  return (
    <DashboardLayout>
      <ProviderConfigContent />
    </DashboardLayout>
  );
}
