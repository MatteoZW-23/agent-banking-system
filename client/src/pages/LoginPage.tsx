import { useState } from "react";
import { useLocation } from "wouter";
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
  Users2, 
  ShieldAlert as Lock, 
  Mail, 
  ChevronRight, 
  Building2,
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"admin" | "agent" | "supervisor">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter credentials");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginMutation.mutateAsync({
        email,
        password,
        role,
      });
      
      const roleName = role === "admin" ? "Administrator" : role === "supervisor" ? "Regional Supervisor" : "Field Agent";
      toast.success(`Successfully signed in as ${roleName}`);
      
      // Force reload to update auth context and trigger routing
      window.location.href = "/";
    } catch (err: any) {
      const message = err.message || "Login failed";
      
      if (message.includes("Access Denied")) {
        toast.error(message, {
          description: "Please ensure you have selected the correct portal for your credentials.",
          icon: <AlertCircle className="h-5 w-5 text-rose-500" />
        });
      } else {
        toast.error("Authentication Error", {
          description: "Invalid email or password. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden">
      {/* Left Visual Command Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 border-r border-slate-100">
        <img 
          src={`/high_end_banking_login_bg_1775661074480.png`}
          alt="Financial Banking Environment"
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        <div className="relative z-10 w-full h-full p-20 flex flex-col justify-between text-white">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <Building2 className="h-9 w-9" />
            </div>
            <h1 className="text-4xl font-black font-outfit uppercase tracking-tighter italic flex flex-col leading-none">
              SOVEREIGN<span className="text-primary not-italic">FINANCE</span>
            </h1>
          </div>

          <div className="space-y-12 max-w-xl">
             <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/20 backdrop-blur-md rounded-full border border-primary/30">
                   <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em]">Node Sync Active</span>
                </div>
                <h2 className="text-7xl font-black font-outfit leading-[0.9] tracking-tighter uppercase italic">
                   Secure <br />
                   <span className="text-primary">Capital</span> <br />
                   Infrastructure.
                </h2>
             </div>
             
             <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
                <div className="space-y-3">
                   <ShieldCheck className="h-8 w-8 text-primary" />
                   <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">Enterprise Grade <br />Security Protocols</p>
                </div>
                <div className="space-y-3">
                   <Users2 className="h-8 w-8 text-white/60" />
                   <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed text-white/60">Distributed <br />Agent Network</p>
                </div>
             </div>
          </div>

          <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] italic">
             © 2026 Sovereign Finance Professional | Branch Asset tracking
          </div>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative bg-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[500px] w-full space-y-16">
          <div className="space-y-4 text-center lg:text-left">
            <h3 className="text-5xl font-black font-outfit text-slate-900 tracking-tighter uppercase italic leading-none">Access My Office</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Identity Verification Required to proceed</p>
          </div>

          <div className="space-y-12">
            {/* Role Tab Grid */}
            <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-50 border border-slate-100 rounded-3xl">
               {(['admin', 'agent', 'supervisor'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      role === r 
                        ? "bg-white text-primary shadow-xl shadow-slate-200 border border-slate-100" 
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {r === 'supervisor' ? 'Manager' : r}
                  </button>
               ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-6 italic">Corporate Identity</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-all" />
                    <Input
                      type="email"
                      placeholder="e.g. employee.name@sovereign.co.zw"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-20 pl-16 bg-slate-50/50 border border-slate-100 rounded-[2rem] font-black text-slate-900 focus:bg-white focus:ring-primary/5 focus:border-primary/40 transition-all placeholder:text-slate-200 placeholder:italic shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-6 italic">Security Keyphrase</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-all" />
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-20 pl-16 bg-slate-50/50 border border-slate-100 rounded-[2rem] font-black text-slate-900 focus:bg-white focus:ring-primary/5 focus:border-primary/40 transition-all placeholder:text-slate-200 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-24 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-6 italic font-outfit"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  ) : (
                    <>Authorize Session <ChevronRight className="h-8 w-8" /></>
                  )}
                </Button>

                <div className="bg-slate-50 p-6 rounded-3xl border border-dotted border-slate-200 text-center space-y-2">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Developer Pass-thru active</p>
                   <div className="text-[10px] text-slate-400 font-mono font-bold">
                     {role === 'admin' ? 'admin@agent.co.zw / admin123' : 
                      role === 'supervisor' ? 'takudzwa@agent.co.zw / supervisor123' : 
                      'agent@agent.co.zw / agent123'}
                   </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
