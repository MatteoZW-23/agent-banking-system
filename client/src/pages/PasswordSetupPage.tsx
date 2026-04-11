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
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function PasswordSetupPage() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setupMutation = trpc.auth.setupPassword.useMutation();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please verify both entries match.",
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
      toast.success("Account secured", {
        description: "Your login credentials have been created successfully.",
      });
      
      setTimeout(() => setLocation("/login"), 3000);
    } catch (err) {
      toast.error("Setup failed", {
        description: "Could not create credentials. Contact your supervisor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gray-50">
        <Card className="max-w-md w-full border border-gray-200 shadow-sm text-center p-8">
          <div className="h-16 w-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Secured</h2>
          <p className="text-sm text-gray-500 mb-6">
            Welcome, agent <span className="text-gray-900 font-mono font-medium">{code}</span>. Your access is now active.
          </p>
          <p className="text-xs text-blue-600 font-medium">Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-[440px] w-full space-y-8">
        <div className="text-center space-y-3">
           <div className="h-14 w-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
              <UserCircle2 className="h-7 w-7 text-blue-600" />
           </div>
           <h1 className="text-2xl font-bold text-gray-900">Set Up Your Account</h1>
           <p className="text-sm text-gray-500">Creating credentials for agent <span className="font-mono font-medium text-gray-700">{code}</span></p>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Create Password
            </CardTitle>
            <CardDescription>
              Choose a strong password for your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSetup} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-11 pr-11 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 text-gray-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-md transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat password..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-11 pl-11 pr-11 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 text-gray-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-md transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Never share your password with anyone. This is your personal authorization key for all transactions.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Setting up...</>
                ) : (
                  <>Create Account <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Sovereign Financial Network · Agent Onboarding
        </p>
      </div>
    </div>
  );
}
