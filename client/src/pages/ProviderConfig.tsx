import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Settings, Plus, Edit2, Trash2 } from "lucide-react";

export default function ProviderConfig() {
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
    setFormData({ name: "", type: "mobile_money", apiEndpoint: "", webhookUrl: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Provider Configuration</h1>
            <p className="text-muted-foreground">Manage provider integrations and credentials</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Provider</CardTitle>
              <CardDescription>Configure a new payment provider integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Provider Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., EcoCash"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Provider Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank">Bank</option>
                  <option value="fintech">Fintech</option>
                  <option value="aggregator">Aggregator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Endpoint</label>
                <input
                  type="url"
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="https://api.provider.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="https://yourapp.com/webhooks/provider"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Provider</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {providers.data?.map((provider) => (
            <Card key={provider.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{provider.category}</p>
                    {provider.apiEndpoint && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Endpoint: <code className="bg-muted px-2 py-1 rounded">{provider.apiEndpoint}</code>
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(provider.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {providers.data?.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No providers configured yet</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                Add Your First Provider
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
