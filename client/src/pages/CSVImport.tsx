import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Upload } from "lucide-react";

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

    // Validation is handled by query, no need to manually call
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
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(template));
    element.setAttribute("download", `${providersQuery.data?.find((p) => p.id === selectedProvider)?.name || "provider"}-template.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isAuthenticated) {
    return null;
  }

  const result = importMutation.data;
  const validation = validateMutation.data;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CSV Import</h1>
          <p className="text-muted-foreground mt-2">
            Import transactions from offline providers (Metbank, POSB, Agribank, MyCash)
          </p>
        </div>

        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>Import Transactions</CardTitle>
            <CardDescription>Upload CSV file with transactions from offline providers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Selection */}
            <div>
              <label className="text-sm font-medium">Select Provider</label>
              <select
                value={selectedProvider || ""}
                onChange={(e) => {
                  setSelectedProvider(e.target.value ? parseInt(e.target.value) : null);
                  setCSVFile(null);
                  setPreview("");
                }}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">Choose a provider...</option>
                {providersQuery.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            {selectedProvider && (
              <>
                <div className="border-2 border-dashed rounded-lg p-6">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer block">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="font-medium">Click to upload CSV file</p>
                      <p className="text-xs text-muted-foreground">or drag and drop</p>
                    </div>
                  </label>
                </div>

                {csvFile && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      ✓ File selected: {csvFile.name}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Size: {(csvFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                {/* Validation Results */}
                {validateMutation.data && (
                  <div className={`p-3 border rounded-lg ${validateMutation.data?.valid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex items-center gap-2">
                      {validateMutation.data?.valid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <p className={`font-medium ${validateMutation.data?.valid ? "text-green-900" : "text-red-900"}`}>
                        {validateMutation.data?.valid ? "CSV format is valid" : "CSV validation failed"}
                      </p>
                    </div>
                    {validateMutation.data && !validateMutation.data?.valid && validateMutation.data?.errors && (
                      <ul className="mt-2 space-y-1">
                        {validateMutation.data?.errors.map((error: string, idx: number) => (
                          <li key={idx} className="text-xs text-red-700">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* CSV Preview */}
                {preview && (
                  <div>
                    <p className="text-sm font-medium mb-2">Preview</p>
                    <pre className="p-3 bg-gray-50 border rounded-lg text-xs overflow-x-auto max-h-40">
                      {preview}
                    </pre>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={!csvFile || !validateMutation.data?.valid || importMutation.isPending}
                    className="flex-1"
                  >
                    {importMutation.isPending ? "Importing..." : "Import Transactions"}
                  </Button>
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    disabled={templateQuery.isLoading}
                  >
                    {templateQuery.isLoading ? "..." : "Download Template"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Import Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                  <p className="text-2xl font-bold">{result.totalRows}</p>
                </div>
                <div className="p-3 border rounded-lg bg-green-50">
                  <p className="text-xs text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                </div>
                <div className="p-3 border rounded-lg bg-orange-50">
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                  <p className="text-2xl font-bold text-orange-600">{result.duplicateCount}</p>
                </div>
                <div className="p-3 border rounded-lg bg-red-50">
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{result.failureCount}</p>
                </div>
              </div>

              {/* Success Rate */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">Success Rate</p>
                    <p className="text-sm text-blue-700">
                      {result.totalRows > 0
                        ? ((result.successCount / result.totalRows) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {result.successCount}/{result.totalRows}
                  </div>
                </div>
              </div>

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Errors</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.errors.slice(0, 10).map((error: any, idx: number) => (
                      <div key={idx} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-900">Row {error.row}</p>
                            <p className="text-xs text-red-700">{error.error}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        ... and {result.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-sm mb-2">Required Columns</p>
              <div className="space-y-1 text-sm">
                <p>• <span className="font-mono">Date</span> - Transaction date (YYYY-MM-DD)</p>
                <p>• <span className="font-mono">Reference</span> - Unique transaction reference</p>
                <p>• <span className="font-mono">Type</span> - Transaction type (cash_out, cash_in, send_money, etc.)</p>
                <p>• <span className="font-mono">Amount</span> - Transaction amount (numeric)</p>
                <p>• <span className="font-mono">Status</span> - Transaction status (completed, pending, failed)</p>
              </div>
            </div>
            <div>
              <p className="font-medium text-sm mb-2">Optional Columns</p>
              <div className="space-y-1 text-sm">
                <p>• <span className="font-mono">Fee</span> - Transaction fee</p>
                <p>• <span className="font-mono">Description</span> - Additional notes</p>
                <p>• <span className="font-mono">EmployeeCode</span> - Employee identifier</p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 Download the CSV template for your provider to ensure correct format
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
