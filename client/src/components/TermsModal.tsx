import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShieldCheck, FileText, Scale, Lock } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onAgreed: () => void;
}

export function TermsModal({ isOpen, onAgreed }: TermsModalProps) {
  const [checked, setChecked] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/login";
    }
  });

  const agreeMutation = trpc.auth.agreeToTerms.useMutation({
    onSuccess: () => {
      toast.success("Terms accepted successfully");
      onAgreed();
    },
    onError: (err) => {
      toast.error("Failed to save agreement", {
        description: err.message
      });
    }
  });

  const handleAgree = () => {
    if (checked) {
      agreeMutation.mutate();
    }
  };

  const handleDecline = () => {
    logoutMutation.mutate();
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
        <DialogHeader className="p-8 bg-blue-600 text-white">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <ShieldCheck className="h-7 w-7 text-white" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">Terms of Service</DialogTitle>
                <DialogDescription className="text-blue-100 font-medium opacity-90">
                  Please review and accept our operational guidelines
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-8 py-6">
          <div className="flex items-center gap-3 mb-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
             <Scale className="h-5 w-5 text-amber-600 shrink-0" />
             <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                You must accept these terms to access the Sovereign Finance Agent Banking portal.
             </p>
          </div>

          <div className="flex-1 min-h-0 mb-4 border rounded-xl border-gray-100 dark:border-slate-800 overflow-hidden">
            <ScrollArea className="h-[400px] w-full p-4">
              <div className="space-y-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <section className="space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     <Lock className="h-4 w-4 text-blue-600" /> 1. Professional Conduct
                  </h3>
                  <p>
                    As an authorized user of Sovereign Finance, you agree to maintain the highest standards of financial integrity. This includes strictly following KYC (Know Your Customer) and AML (Anti-Money Laundering) requirements for every transaction.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     <FileText className="h-4 w-4 text-blue-600" /> 2. Security Obligations
                  </h3>
                  <p>
                    You are responsible for the confidentiality of your credentials. Sharing account access or attempting to bypass security protocols (including MFA) will result in immediate suspension and disciplinary action.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Passwords must be rotated every 90 days.</li>
                    <li>Concurrent logins from multiple locations are prohibited.</li>
                    <li>Always sign out when leaving your terminal.</li>
                  </ul>
                </section>

                <section className="space-y-2 bg-blue-50/50 dark:bg-blue-900/5 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4 text-blue-600" /> 3. Data Privacy & GDPR Compliance
                  </h3>
                  <p>
                    In accordance with Global Data Protection Regulations (GDPR) and regional data laws:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li><strong>Data Collection:</strong> We collect personal data (Name, Email, Device ID, IP Address) solely for authentication, security auditing, and financial reconciliation.</li>
                    <li><strong>Purpose Limitation:</strong> Your data will not be shared with third parties for marketing. It is used only for operational system integrity.</li>
                    <li><strong>Your Rights:</strong> You have the right to access, rectify, or request the deletion of your personal data, subject to financial record-keeping laws.</li>
                    <li><strong>Data Retention:</strong> Audit logs are retained for 7 years as required by financial regulations, after which they are securely purged.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">4. Data Usage & Monitoring</h3>
                  <p>
                    All activity within this portal is monitored by the Sovereign Finance Security Engine. We use automated risk analysis to detect suspicious patterns. By using this system, you consent to the collection of telemetry for security and reconciliation purposes.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">5. Transaction Integrity</h3>
                  <p>
                    Manual adjustment of reconciliation states is only permitted for supervisors. Agents must not attempt to verify their own float requests. Any detected collusion between agents and supervisors will be reported to central compliance.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">6. Discrepancy Reporting</h3>
                  <p>
                    All cash discrepancies must be reported at the point of check-in via the workforce portal. Failure to report shortages immediately is a violation of the agent agreement.
                  </p>
                </section>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                  <p className="text-[10px] text-gray-400 italic">
                    Last Updated: April 10, 2026. Version 1.0.4 Compliance Bundle (GDPR/AML/KYC Sync).
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>

          <div 
            className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 cursor-pointer"
            onClick={() => setChecked(!checked)}
          >
            <Checkbox 
              id="terms" 
              checked={checked} 
              onCheckedChange={(val) => setChecked(!!val)}
              className="border-gray-300 dark:border-slate-700" 
            />
            <label
              htmlFor="terms"
              className="text-xs font-semibold text-gray-700 dark:text-slate-300 leading-none cursor-pointer"
            >
              I have read and agree to the Terms of Service and Operational Guidelines.
            </label>
          </div>
        </div>

        <DialogFooter className="px-8 pb-8 pt-0 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={logoutMutation.isPending || agreeMutation.isPending}
            className="flex-1 h-12 rounded-xl border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
          >
            {logoutMutation.isPending ? "Signing out..." : "Decline & Logout"}
          </Button>
          <Button
            onClick={handleAgree}
            disabled={!checked || agreeMutation.isPending || logoutMutation.isPending}
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            {agreeMutation.isPending ? "Saving Agreement..." : "Accept & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
