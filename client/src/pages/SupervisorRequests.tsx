import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2, XCircle, Clock, ShieldCheck, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function SupervisorRequests() {
  const floatRequests = trpc.nodes.listFloatRequests.useQuery({ status: "pending" });
  const employeesQuery = trpc.nodes.listEmployees.useQuery();
  const providersQuery = trpc.providers.list.useQuery();
  
  const processMutation = trpc.nodes.processRequest.useMutation({
    onSuccess: () => {
      floatRequests.refetch();
    },
  });

  const handleApprove = async (id: number) => {
    try {
      await processMutation.mutateAsync({
        id,
        status: "approved",
        adminNotes: "Verified by Supervisor",
      });
      toast.success("Request verified. Sent to admin for transfer.");
    } catch {
      toast.error("Could not verify request.");
    }
  };

  const handleDecline = async (id: number) => {
    try {
      await processMutation.mutateAsync({
        id,
        status: "declined",
        adminNotes: "Declined by Supervisor",
      });
      toast.info("Request declined.");
    } catch {
      toast.error("Could not decline request.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Approval Queue"
          subtitle="Screen and authorize float requests from your team."
          category="Supervisor"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-9 rounded-lg border-gray-200 font-medium text-xs px-4">
                <Filter className="mr-1.5 h-3.5 w-3.5" /> Filter
              </Button>
              <Button
                onClick={() => floatRequests.refetch()}
                className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          }
        />

        <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100 dark:border-slate-700">
                    <TableHead className="font-medium text-xs pl-6">Reference</TableHead>
                    <TableHead className="font-medium text-xs">Agent</TableHead>
                    <TableHead className="font-medium text-xs">Amount</TableHead>
                    <TableHead className="font-medium text-xs">Notes</TableHead>
                    <TableHead className="font-medium text-xs text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {floatRequests.data?.map((req: any) => {
                    const employee = employeesQuery.data?.find(e => e.id === req.employeeId);
                    const provider = providersQuery.data?.find(p => p.id === req.providerId);
                    return (
                      <TableRow key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-100 dark:border-slate-700 h-16">
                        <TableCell className="pl-6">
                          <Badge variant="outline" className="font-mono text-xs border-gray-200 text-gray-500">
                            #{req.id.toString().padStart(4, '0')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center font-semibold text-blue-600 text-xs">
                              {employee?.name?.[0] || "#"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">{employee?.name || `Agent #${req.employeeId}`}</p>
                              <p className="text-xs text-gray-400">{provider?.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">${parseFloat(req.amount).toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {req.workerNotes || "Routine top-up"}
                          </p>
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              onClick={() => handleApprove(req.id)}
                              disabled={processMutation.isPending}
                              size="sm"
                              className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                            >
                              Verify
                            </Button>
                            <Button 
                              onClick={() => handleDecline(req.id)}
                              disabled={processMutation.isPending}
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 rounded-md border-red-200 text-red-600 hover:bg-red-50 font-medium text-xs"
                            >
                              Decline
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {(!floatRequests.data || floatRequests.data.length === 0) && (
                <div className="p-16 text-center">
                  <ShieldCheck className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No pending requests</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
