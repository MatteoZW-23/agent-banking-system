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
  PlusCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";

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
    // TODO: Implement persistent provider configuration mutation
    console.log("Saving provider:", formData);
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
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "bank":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "fintech":
        return "bg-purple-50 text-purple-600 border-purple-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader 
        title="Payment Providers"
        subtitle="Manage and configure your mobile money and bank integrations."
        category="Admin"
        actions={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Provider
          </Button>
        }
      />

      {showForm && (
        <Card className="border border-gray-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-6 border-b border-gray-50 dark:border-slate-800/50">
            <CardTitle className="text-lg">Provider Configuration</CardTitle>
            <CardDescription>
              Configure the API connection for a new payment gateway.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 max-w-3xl">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Provider Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  placeholder="e.g., EcoCash Zimbabwe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Provider Type
                </label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank">Commercial Bank</option>
                  <option value="fintech">Fintech Gateway</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> API Endpoint
              </label>
              <input
                type="url"
                value={formData.apiEndpoint}
                onChange={e => setFormData({ ...formData, apiEndpoint: e.target.value })}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                placeholder="https://api.provider.com/v1"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Webhook URL
              </label>
              <input
                type="url"
                value={formData.webhookUrl}
                onChange={e => setFormData({ ...formData, webhookUrl: e.target.value })}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                placeholder="https://your-domain.com/hooks/provider"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="h-9 px-6 rounded-lg text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="h-9 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm"
              >
                Save Provider
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.data?.map(provider => (
          <Card
            key={provider.id}
            className="border border-gray-200 dark:border-slate-800 shadow-sm hover:border-blue-300 transition-colors group overflow-hidden"
          >
            <CardContent className="pt-6 relative">
              <div className="absolute top-4 right-4">
                <Badge
                  variant="outline"
                  className={`border-none ${provider.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"} font-medium text-[10px] px-2 py-0.5`}
                >
                  {provider.isActive ? "Active" : "Disabled"}
                </Badge>
              </div>

              <div className="flex flex-col items-start gap-4">
                <div className={`p-3 rounded-lg border ${getCategoryColor(provider.category)}`}>
                  {getCategoryIcon(provider.category)}
                </div>

                <div className="space-y-1 w-full">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center justify-between group-hover:text-blue-600 transition-colors">
                    {provider.name}
                    <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                  </h3>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-tight">
                    {provider.category.replace("_", " ")}
                  </p>
                </div>

                <div className="w-full space-y-4 pt-2">
                  <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-lg border border-gray-100 dark:border-slate-800">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight mb-1">
                      Endpoint
                    </p>
                    <div className="flex items-center justify-between text-xs font-mono text-gray-500">
                      <span className="truncate">
                        {(provider as any).apiEndpoint || "Not configured"}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-2 opacity-40" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 rounded-md text-xs font-medium border-gray-200"
                      onClick={() => setEditingId(provider.id)}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5" /> Config
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-md border-gray-200 text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="group flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all min-h-[260px]"
          >
            <div className="h-12 w-12 rounded-lg bg-gray-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-gray-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-white">Add New Provider</p>
              <p className="text-xs text-gray-400 mt-1">Connect a mobile money gateway</p>
            </div>
          </button>
        )}
      </div>

      {providers.data?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
          <Smartphone className="h-12 w-12 text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No Providers Found</h3>
          <p className="text-sm text-gray-500 max-w-xs mt-2">
            Start by adding your first mobile money or bank integration.
          </p>
          <Button
            className="mt-6 h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
            onClick={() => setShowForm(true)}
          >
            Add First Provider
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
