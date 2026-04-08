import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert as Lock,
  Mail,
  ChevronRight,
  Building2,
  AlertCircle,
  Smartphone,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Role = "admin" | "supervisor" | "manager" | "agent";

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "supervisor", label: "Super." },
  { value: "manager", label: "Manager" },
  { value: "agent", label: "Agent" },
];

const DEV_CREDS: Record<Role, string> = {
  admin: "admin@agent.co.zw / admin123",
  supervisor: "takudzwa@agent.co.zw / supervisor123",
  manager: "admin@agent.co.zw / admin123",
  agent: "agent@agent.co.zw / agent123",
};

export default function LoginPage() {
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState("");

  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your credentials");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginMutation.mutateAsync({
        email,
        password,
        role,
        mfaToken: mfaRequired ? mfaToken : undefined,
      });

      if (res.mfaRequired) {
        setMfaRequired(true);
        toast.info("2-Factor Verification Required", {
          description: "Enter the 6-digit code from your authenticator app.",
        });
        return;
      }

      const roleName =
        role === "admin"
          ? "Administrator"
          : role === "supervisor"
            ? "Regional Supervisor"
            : role === "manager"
              ? "Manager"
              : "Field Agent";

      toast.success(`Welcome back — signed in as ${roleName}`);
      window.location.href = "/";
    } catch (err: any) {
      const message = err.message || "Login failed";
      if (message.includes("Access Denied")) {
        toast.error("Access Denied", {
          description:
            "Ensure you have selected the correct portal for your credentials.",
          icon: <AlertCircle className="h-5 w-5 text-rose-500" />,
        });
      } else {
        toast.error("Authentication Error", {
          description: message || "Invalid email or password. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC]">
      {/* Visual Branding Section (Left Side) - Only visible on larger screens */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0F172A]">
        <img
          src="/sovereign_banking_bg_1775680448297.png"
          alt="Sovereign Financial Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A56DB]/80 to-transparent" />

        <div className="relative z-10 w-full h-full p-20 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center border border-white/20 shadow-lg overflow-hidden">
              <img src="/user_logo.jpg" alt="MJ Logo" className="w-full h-full object-cover scale-150" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-3xl font-black uppercase tracking-tighter leading-none font-outfit">
                SOVEREIGN<span className="text-amber-400">FINANCE</span>
              </h1>
              <span className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.4em]">Corporate Nodes</span>
            </div>
          </div>

          <div className="max-w-md space-y-6">
            <h2 className="text-6xl font-black text-white leading-tight font-outfit uppercase italic tracking-tighter">
              Secure <br />
              Infrastructure <br />
              <span className="text-blue-300">Simplified.</span>
            </h2>
            <p className="text-blue-100/70 text-lg">
              Empowering financial agents with enterprise-grade capital management and real-time network intelligence.
            </p>
          </div>

          <div className="flex items-center gap-8 text-white/40">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">PCI-DSS Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">TLS 1.3 Encryption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Section (Right Side) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Subtle Background Decoration */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-50" />

        <div className="w-full max-w-[460px] relative z-10">
          <div className="mb-12 space-y-2">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
                <img src="/user_logo.jpg" alt="MJ Logo" className="w-full h-full object-cover scale-150" />
              </div>
              <h1 className="text-[#0F172A] text-2xl font-black uppercase tracking-tight font-outfit">SOVEREIGN</h1>
            </div>
            <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none font-outfit">Control Center</h3>
            <p className="text-slate-400 text-sm font-medium">Please authenticate to access your financial workstation</p>
          </div>

          {/* Role Switcher */}
          <div className="mb-10 grid grid-cols-4 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${role === r.value
                    ? "bg-white text-[#1A56DB] shadow-lg shadow-blue-900/5 border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {!mfaRequired ? (
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identity</label>
                  <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Corporate Email</span>
                </div>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#1A56DB] transition-all" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@sovereign.co.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-16 pl-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#1A56DB] text-slate-900 placeholder:text-slate-300 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security Key</label>
                  <button type="button" className="text-[9px] text-slate-400 font-bold uppercase tracking-widest hover:text-[#1A56DB] transition-colors">Forgot?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#1A56DB] transition-all" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-16 pl-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#1A56DB] text-slate-900 placeholder:text-slate-300 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-[#1A56DB] hover:bg-[#0F172A] text-white font-bold text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 flex items-center justify-center gap-3 active:scale-95 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin relative z-10" />
                  ) : (
                    <span className="flex items-center gap-3 relative z-10">
                      Authorize Access <ChevronRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </div>

              {/* Dev Hint */}
              <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-200/50 flex flex-col items-center text-center space-y-2 group hover:bg-white hover:border-[#1A56DB]/20 transition-all duration-500">
                <div className="h-1 w-8 bg-blue-200 rounded-full mb-1 group-hover:w-16 transition-all duration-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Developer System Override</p>
                <code className="text-[11px] text-blue-600 font-bold font-mono bg-blue-50 px-3 py-1 rounded-lg">
                  {DEV_CREDS[role]}
                </code>
              </div>
            </form>
          ) : (
            /* MFA Step */
            <form
              onSubmit={handleLogin}
              className="space-y-10 animate-in slide-in-from-bottom-8 duration-500"
            >
              <div className="text-center space-y-6">
                <div className="mx-auto h-20 w-20 rounded-3xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-inner">
                  <Smartphone className="h-10 w-10 text-[#1A56DB]" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-[#0F172A] uppercase font-outfit tracking-tighter italic">Security Sync</h4>
                  <p className="text-sm text-slate-400 mt-2 font-medium">Verify your identity with the generated token</p>
                </div>
              </div>

              <div className="flex justify-center py-4">
                <InputOTP
                  maxLength={6}
                  value={mfaToken}
                  onChange={setMfaToken}
                  autoFocus
                >
                  <InputOTPGroup className="gap-3">
                    <InputOTPSlot index={0} className="h-16 w-12 rounded-xl text-xl font-bold border-slate-200 bg-slate-50 focus:bg-white" />
                    <InputOTPSlot index={1} className="h-16 w-12 rounded-xl text-xl font-bold border-slate-200 bg-slate-50 focus:bg-white" />
                    <InputOTPSlot index={2} className="h-16 w-12 rounded-xl text-xl font-bold border-slate-200 bg-slate-50 focus:bg-white" />
                  </InputOTPGroup>
                  <div className="w-4 h-px bg-slate-300 mx-2" />
                  <InputOTPGroup className="gap-3">
                    <InputOTPSlot index={3} className="h-16 w-12 rounded-xl text-xl font-bold border-slate-200 bg-slate-50 focus:bg-white" />
                    <InputOTPSlot index={4} className="h-16 w-12 rounded-xl text-xl font-bold border-slate-200 bg-slate-50 focus:bg-white" />
                    <InputOTPSlot index={5} className="h-16 w-12 rounded-xl text-xl font-bold border-slate-200 bg-slate-50 focus:bg-white" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-4">
                <Button
                  id="mfa-submit-btn"
                  type="submit"
                  disabled={isSubmitting || mfaToken.length !== 6}
                  className="w-full h-16 rounded-2xl bg-[#1A56DB] hover:bg-[#0F172A] text-white font-bold text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>Confirm Verification <ChevronRight className="h-5 w-5" /></>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false);
                    setMfaToken("");
                  }}
                  className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-[#1A56DB] transition-all group py-2"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Credential Selection
                </button>
              </div>
            </form>
          )}

          <div className="mt-16 text-center">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em]">
              © 2026 Sovereign Financial Network
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
