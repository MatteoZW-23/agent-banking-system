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
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.05] pointer-events-none">
        <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      </div>

      <div className="max-w-[1000px] w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Branding Panel */}
        <div className="hidden lg:flex flex-col gap-8 text-slate-900">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black font-outfit uppercase tracking-tighter italic">
              Agent<span className="text-primary">Track</span>
            </h1>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl font-black font-outfit leading-[1.1] tracking-tighter">
              Manage Your <br />
              <span className="text-primary">Financial Network.</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed max-w-md font-medium">
              Professional money management and agent network tracking for your daily banking operations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <ShieldCheck className="h-8 w-8 text-primary mb-4" />
              <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900">Professional</h4>
              <p className="text-[10px] text-slate-500 mt-2 uppercase font-black">Secure Banking System</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <Users2 className="h-8 w-8 text-emerald-600 mb-4" />
              <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900">Agent Network</h4>
              <p className="text-[10px] text-slate-500 mt-2 uppercase font-black">Real-time daily reporting</p>
            </div>
          </div>
        </div>

        {/* Right Login Form */}
        <Card className="border-none bg-white text-slate-900 rounded-[3rem] shadow-2xl overflow-hidden shadow-slate-200/50">
          <CardHeader className="p-10 pb-6 text-center">
            <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black font-outfit uppercase tracking-tighter italic">
              Staff Login
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2">
              Select your role and enter your details.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-10 pt-4 space-y-10">
            {/* Role Selection */}
            <div className="grid grid-cols-3 gap-3 p-2 bg-slate-50 rounded-[1.5rem] border border-slate-100">
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex items-center justify-center gap-2 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  role === "admin" 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </button>
              <button
                type="button"
                onClick={() => setRole("agent")}
                className={`flex items-center justify-center gap-2 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  role === "agent" 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Users2 className="h-4 w-4" /> Agent
              </button>
              <button
                type="button"
                onClick={() => setRole("supervisor")}
                className={`flex items-center justify-center gap-2 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  role === "supervisor" 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Lock className="h-4 w-4" /> Manager
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-2 italic">
                    Corporate Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-all" />
                    <Input
                      type="email"
                      placeholder="e.g. admin@agent.co.zw"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-16 pl-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-8 focus:ring-primary/5 focus:border-primary/40 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-2 italic">
                    Security Passcode
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-all" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-16 pl-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-8 focus:ring-primary/5 focus:border-primary/40 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-18 rounded-[1.5rem] premium-gradient text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 italic font-outfit overflow-hidden"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      Login To My Office <ChevronRight className="h-6 w-6" />
                    </>
                  )}
                </Button>
                
                <div className="text-center space-y-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Development Mode Credentials
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    Admin: admin@agent.co.zw / admin123 <br />
                    Supervisor: takudzwa@agent.co.zw / supervisor123 <br />
                    Agent: agent@agent.co.zw / agent123
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="absolute bottom-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
        © 2026 AgentTrack Professional | Zimbabwe Financial Network
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
