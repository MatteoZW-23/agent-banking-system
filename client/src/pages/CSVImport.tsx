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
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Upload,
  FileSpreadsheet,
  Download,
  Info,
  RefreshCw,
  ArrowUpRight,
  Layers,
  Database,
  ArrowRight,
  FileCheck,
  ShieldCheck,
  XCircle,
  History,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";

export default function CSVImport() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const importMutation = trpc.csvImport.importTransactions.useMutation({
    onSuccess: () => {
      toast.success("Import successful");
    },
    onError: (err) => {
      toast.error(`Import failed: ${err.message}`);
    }
  });

  const validateMutation = trpc.csvImport.validateCSV.useQuery(
    { providerId: selectedProvider || 0, csvContent: preview || "" },
    { enabled: selectedProvider !== null && preview.length > 0 }
  );
  
  const templateQuery = trpc.csvImport.getTemplate.useQuery(
    { providerId: selectedProvider || 0 },
    { enabled: selectedProvider !== null }
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    setCSVFile(file);
    const content = await file.text();
    setPreview(content.split("\n").slice(0, 5).join("\n"));
  };

  const handleImport = async () => {
    if (!csvFile || !selectedProvider) return;
    const content = await csvFile.text();
    await importMutation.mutateAsync({
      providerId: selectedProvider,
      csvContent: content,
    });
  };

  const handleDownloadTemplate = async () => {
    if (!selectedProvider) return;
    const template = templateQuery.data;
    if (!template) return;

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(template)
    );
    element.setAttribute(
      "download",
      `${providersQuery.data?.find(p => p.id === selectedProvider)?.name || "provider"}-template.csv`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isAuthenticated) return null;

  const result = importMutation.data;
  const validation = validateMutation.data;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        <PageHeader 
          title="Import Data"
          subtitle="Upload transaction records from external providers via CSV."
          category="Data Management"
          actions={
            <Button variant="outline" className="h-9 rounded-lg border-gray-200 font-medium text-xs">
              <History className="mr-2 h-4 w-4" /> Import History
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="pb-6 border-b border-gray-50 dark:border-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">CSV Upload</CardTitle>
                    <CardDescription>Follow steps to import provider records</CardDescription>
                  </div>
                  <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Step 1: Provider */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Select Provider</label>
                  </div>
                  <select
                    value={selectedProvider || ""}
                    onChange={e => {
                      setSelectedProvider(e.target.value ? parseInt(e.target.value) : null);
                      setCSVFile(null);
                      setPreview("");
                    }}
                    className="w-full h-11 px-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select a regional provider...</option>
                    {providersQuery.data?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Step 2: File upload */}
                {selectedProvider && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Select CSV File</label>
                      </div>
                      
                      <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${csvFile ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600"}`}>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center">
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-3 ${csvFile ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-600" : "bg-white dark:bg-slate-800 text-gray-400 shadow-sm"}`}>
                              <Upload className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {csvFile ? csvFile.name : "Choose CSV File"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">UTF-8 Encoded • Max 50MB</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Preview/Validation */}
                    {preview && (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                            <FileSpreadsheet className="h-3.5 w-3.5" /> File Preview (Top 5 lines)
                          </p>
                          <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 font-mono text-[10px] text-gray-400 overflow-x-auto max-h-40 leading-relaxed">
                            <pre>{preview}</pre>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                            <FileCheck className="h-3.5 w-3.5" /> Validation Status
                          </p>
                          {validateMutation.isLoading ? (
                            <div className="h-32 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                            </div>
                          ) : validation ? (
                            <div className={`h-32 p-4 rounded-lg border flex flex-col justify-center ${validation.valid ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800" : "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800"}`}>
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${validation.valid ? "bg-emerald-600" : "bg-red-600"} text-white`}>
                                  {validation.valid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {validation.valid ? "Format Valid" : "Format Error"}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {validation.valid ? "Schema check passed" : `${validation.errors?.length || 0} errors detected`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                      <Button
                        onClick={handleImport}
                        disabled={!csvFile || !validation?.valid || importMutation.isPending}
                        className="flex-1 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
                      >
                        {importMutation.isPending ? (
                          <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                        ) : (
                          "Execute Import"
                        )}
                      </Button>
                      <Button
                        onClick={handleDownloadTemplate}
                        variant="outline"
                        className="h-11 px-6 rounded-lg border-gray-200 text-sm font-medium"
                      >
                        <Download className="mr-2 h-4 w-4" /> Template
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {result && (
              <Card className="border border-gray-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="text-lg">Process Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3 md:grid-cols-4">
                    {[
                      { label: "Total Rows", val: result.totalRows, color: "text-gray-900", bg: "bg-gray-50" },
                      { label: "Success", val: result.successCount, color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Duplicates", val: result.duplicateCount, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Failures", val: result.failureCount, color: "text-red-600", bg: "bg-red-50" },
                    ].map((m, i) => (
                      <div key={i} className={`p-4 rounded-xl ${m.bg} flex flex-col`}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{m.label}</p>
                        <p className={`text-xl font-bold ${m.color}`}>{m.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 rounded-xl border border-blue-50 bg-blue-50/30 dark:bg-blue-900/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-tight mb-1">Import Efficiency</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {result.totalRows > 0 ? ((result.successCount / result.totalRows) * 100).toFixed(1) : 0}%
                        </span>
                        <span className="text-xs text-gray-400 font-medium">success rate</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full border-4 border-blue-100 flex items-center justify-center border-t-blue-600 text-sm font-bold text-blue-600">
                      {result.successCount}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="border border-gray-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-base">Schema Requirements</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {[
                  { col: "Date", desc: "ISO (YYYY-MM-DD)" },
                  { col: "Reference", desc: "Unique TXN number" },
                  { col: "Type", desc: "cash_out, cash_in, etc" },
                  { col: "Amount", desc: "10,2 decimal format" },
                  { col: "Status", desc: "completed/failed" },
                ].map((col, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg">
                    <div>
                      <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{col.col}</span>
                      <p className="text-[10px] text-gray-500">{col.desc}</p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] font-bold">REQ</Badge>
                  </div>
                ))}
                
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 flex gap-3 mt-4">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Duplicate transaction references will be skipped to prevent double entry.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-gray-900 rounded-xl text-white">
              <div className="space-y-4">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Audit Proof Ingestion</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-2">
                    Every import is logged and hashed to maintain a verified chain of records for bank scrutiny.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1.5 opacity-80">
                  <FileCheck className="h-3.5 w-3.5" /> FIPS COMPLIANT
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
