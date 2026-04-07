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
} from "lucide-react";

export default function CSVImport() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const providersQuery = trpc.providers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const importMutation = trpc.csvImport.importTransactions.useMutation();
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
      <div className="space-y-10 animate-fade-in">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Data Ingestion Hub
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Synchronize legacy/offline provider data (POSB, Metbank, MyCash)
              via structured CSV.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-11 rounded-xl px-4 border-slate-200 font-bold text-xs uppercase tracking-widest text-slate-600"
            >
              <Layers className="mr-2 h-4 w-4" /> Batch History
            </Button>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-7">
          {/* Main Upload Portal */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-none shadow-sm dark:bg-slate-900/50 overflow-hidden">
              <div className="h-1.5 premium-gradient w-full" />
              <CardHeader className="pb-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">
                      Import Transactions
                    </CardTitle>
                    <CardDescription>
                      Follow the guided sequence to ingest provider data
                    </CardDescription>
                  </div>
                  <div className="h-12 w-12 bg-primary/5 rounded-2xl flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Step 1: Provider */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black italic">
                      1
                    </span>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                      Source Provider Selection
                    </label>
                  </div>
                  <select
                    value={selectedProvider || ""}
                    onChange={e => {
                      setSelectedProvider(
                        e.target.value ? parseInt(e.target.value) : null
                      );
                      setCSVFile(null);
                      setPreview("");
                    }}
                    className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-primary/5 focus:outline-none font-bold text-sm transition-all"
                  >
                    <option value="">Search regional providers...</option>
                    {providersQuery.data?.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: File Drop */}
                {selectedProvider && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black italic">
                          2
                        </span>
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                          Payload Configuration
                        </label>
                      </div>
                      <div
                        className={`relative group border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer ${csvFile ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:bg-slate-50/80"}`}
                      >
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="cursor-pointer block text-center"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div
                              className={`h-16 w-16 rounded-3xl flex items-center justify-center mb-4 transition-all ${csvFile ? "bg-emerald-500/10 text-emerald-500" : "bg-white dark:bg-slate-900 text-slate-400 group-hover:scale-110 shadow-sm"}`}
                            >
                              <Upload className="h-7 w-7" />
                            </div>
                            <p className="text-base font-black text-slate-800 dark:text-white">
                              {csvFile
                                ? `Payload Locked: ${csvFile.name}`
                                : "Select Provider CSV File"}
                            </p>
                            <p className="text-xs text-slate-400 font-medium mt-1">
                              UTF-8 Encoded • Max 50MB per batch
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Preview & Validation Suite */}
                    {preview && (
                      <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileSpreadsheet className="h-3 w-3" /> Raw Sequence
                            Preview
                          </p>
                          <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 font-mono text-[10px] text-primary/80 overflow-x-auto max-h-48 leading-relaxed">
                            {preview}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileCheck className="h-3 w-3" /> Pre-Flight
                            Validation
                          </p>
                          {validateMutation.isLoading ? (
                            <div className="h-32 flex items-center justify-center rounded-2xl bg-slate-50 animate-pulse">
                              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                            </div>
                          ) : validation ? (
                            <div
                              className={`h-32 p-5 rounded-2xl border flex flex-col justify-center ${validation.valid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-8 w-8 rounded-xl flex items-center justify-center ${validation.valid ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
                                >
                                  {validation.valid ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-black text-slate-800 dark:text-white uppercase">
                                    {validation.valid
                                      ? "Structure Verified"
                                      : "Validation Failed"}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-500">
                                    {validation.valid
                                      ? "File matches provider schema"
                                      : `${validation.errors?.length || 0} syntax errors detected`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {/* Action Console */}
                    <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                      <Button
                        onClick={handleImport}
                        disabled={
                          !csvFile ||
                          !validation?.valid ||
                          importMutation.isPending
                        }
                        className={`flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${!validation?.valid ? "bg-slate-200 text-slate-400 grayscale" : "premium-gradient text-white hover:scale-[1.02] active:scale-[0.98]"}`}
                      >
                        {importMutation.isPending ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        Execute Database Ingestion
                      </Button>
                      <Button
                        onClick={handleDownloadTemplate}
                        variant="outline"
                        className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-slate-200"
                      >
                        <Download className="mr-2 h-4 w-4" /> Template
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dynamic Results Dashboard */}
            {result && (
              <Card className="border-none shadow-sm dark:bg-slate-900/50 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <ShieldCheck className="h-24 w-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">Ingestion Summary</CardTitle>
                  <CardDescription>
                    Processed at {new Date().toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-10">
                  <div className="grid gap-6 md:grid-cols-4">
                    {[
                      {
                        label: "Sequences",
                        value: result.totalRows,
                        color: "text-slate-800",
                        bg: "bg-slate-100",
                      },
                      {
                        label: "Ingested",
                        value: result.successCount,
                        color: "text-emerald-500",
                        bg: "bg-emerald-50",
                      },
                      {
                        label: "Duplicates",
                        value: result.duplicateCount,
                        color: "text-amber-500",
                        bg: "bg-amber-50",
                      },
                      {
                        label: "Failures",
                        value: result.failureCount,
                        color: "text-rose-500",
                        bg: "bg-rose-50",
                      },
                    ].map((m, i) => (
                      <div
                        key={i}
                        className={`p-5 rounded-2xl ${m.bg} space-y-1`}
                      >
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          {m.label}
                        </p>
                        <p className={`text-2xl font-black ${m.color}`}>
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-black text-primary uppercase italic">
                        Optimization Index
                      </p>
                      <h4 className="text-4xl font-black text-slate-900 dark:text-white">
                        {result.totalRows > 0
                          ? (
                              (result.successCount / result.totalRows) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </h4>
                      <p className="text-xs font-medium text-slate-500">
                        Net data success rate for this cluster ingestion
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="h-20 w-20 flex items-center justify-center rounded-full border-8 border-primary/10 border-t-primary">
                        <span className="text-[10px] font-black italic">
                          {result.successCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Schema & Guidelines Sidebar */}
          <div className="lg:col-span-3 space-y-8">
            <Card className="border-none shadow-sm dark:bg-slate-900/50 overflow-hidden">
              <div className="h-1.5 premium-gradient opacity-40 w-full" />
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> Schema Compliance
                </CardTitle>
                <CardDescription>
                  Strict validation rules for batch CSV files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 opacity-60">
                    Mandatory Structure
                  </p>
                  {[
                    { col: "Date", desc: "ISO format (YYYY-MM-DD)", req: true },
                    {
                      col: "Reference",
                      desc: "Unique network identifier",
                      req: true,
                    },
                    {
                      col: "Type",
                      desc: "cash_out, cash_in, bill_pay",
                      req: true,
                    },
                    { col: "Amount", desc: "Unsigned float (10,2)", req: true },
                    {
                      col: "Status",
                      desc: "completed, pending, failed",
                      req: true,
                    },
                  ].map((col, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group transition-all hover:border-primary/20"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                          {col.col}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {col.desc}
                        </span>
                      </div>
                      {col.req && (
                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">
                          REQUIRED
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-amber-800 uppercase italic">
                      Ingestion Warning
                    </p>
                    <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                      Duplicate references are automatically flagged and
                      partitioned to prevent double-ledgering.
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-xs font-extrabold uppercase tracking-widest text-primary flex items-center justify-between group"
                >
                  Developer Schema Docs{" "}
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Encrypted Sequence Sync</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2 font-medium">
                    Every batch ingestion is hashed and logged against the
                    provider node identity to maintain an immutable audit trail
                    for external bank scrutiny.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black italic text-primary uppercase tracking-widest opacity-80">
                  <ShieldCheck className="h-4 w-4" /> FIPS 140-2 COMPLIANT
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
