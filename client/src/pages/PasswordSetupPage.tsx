import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Lock, 
  ChevronRight, 
  UserCircle2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function PasswordSetupPage() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const setupMutation = trpc.auth.setupPassword.useMutation();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("Security requirement not met", {
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mismatched Passcodes", {
        description: "Passwords do not match. Please verify.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await setupMutation.mutateAsync({
        code: code || "UNKNOWN",
        password: password,
      });
      
      setSuccess(true);
      toast.success("Identity Secured", {
        description: "Your login credentials have been created successfully.",
      });
      
      setTimeout(() => setLocation("/login"), 3000);
    } catch (err) {
      toast.error("Registration Hub Error", {
        description: "Could not link credentials at this time. Contact your supervisor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#020617]">
        <Card className="max-w-md w-full glass-card border-none bg-slate-900/80 text-white rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-500">
          <div className="h-24 w-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-emerald-sm">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black font-outfit uppercase tracking-tighter italic mb-4">Account Secured</h2>
          <p className="text-slate-400 mb-8 font-medium">
            Welcome to the Agent Network, agent <span className="text-white font-mono">{code}</span>. Your portal access is now synchronized.
          </p>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Redirecting to Login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

      <div className="max-w-[500px] w-full relative z-10 space-y-10">
        <div className="text-center space-y-4">
           <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <UserCircle2 className="h-10 w-10 text-emerald-400" />
           </div>
           <h1 className="text-3xl font-black font-outfit text-white uppercase tracking-tighter italic">Welcome to the Mesh</h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] italic">Securing identity for Agent ID: {code}</p>
        </div>

        <Card className="glass-card border-none bg-slate-900/80 text-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/5 backdrop-blur-xl">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-xl font-black font-outfit uppercase tracking-tight flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-500" /> Secure Your Workspace
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">
              Create a strong passcode to authorise your service transactions.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-10 pt-4">
            <form onSubmit={handleSetup} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-2 italic">
                    New Security Passcode
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-all" />
                    <Input
                      type="password"
                      placeholder="Min 6 characters..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-16 pl-16 bg-slate-950/50 border border-white/5 rounded-2xl text-white font-medium focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-2 italic">
                    Verify Passcode
                  </label>
                  <div className="relative group">
                    <CheckCircle2 className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-all" />
                    <Input
                      type="password"
                      placeholder="Repeat passcode..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-16 pl-16 bg-slate-950/50 border border-white/5 rounded-2xl text-white font-medium focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-200/80 leading-relaxed font-bold uppercase tracking-tight">
                  Your passcode is an internal authorisation tool for mobile money lines. Never share it with unauthorized personnel.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-18 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg uppercase tracking-widest shadow-22 shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 italic font-outfit"
              >
                {isSubmitting ? (
                  "SYNCHRONIZING..."
                ) : (
                  <>
                    Initialize Account <ChevronRight className="h-6 w-6" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mx-auto w-[1px] h-20 bg-gradient-to-b from-white/10 to-transparent" />
        <p className="text-center text-[10px] font-black text-slate-700 uppercase tracking-widest italic px-10">
          AgentTrack National Security Mesh v4.0 | Onboarding Module
        </p>
      </div>
    </div>
  );
}
