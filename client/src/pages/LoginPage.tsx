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
  AlertCircle,
  Smartphone,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useLocation } from "wouter";

type Role = "admin" | "supervisor" | "manager" | "agent";

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "supervisor", label: "Supervisor" },
  { value: "manager", label: "Manager" },
  { value: "agent", label: "Agent" },
];

const getPostLoginPath = (role: Role) => {
  if (role === "agent") return "/worker";
  if (role === "supervisor" || role === "manager") return "/supervisor";
  return "/";
};



export default function LoginPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation();

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
        toast.info("Two-factor authentication required", {
          description: "Enter the 6-digit code from your authenticator app.",
        });
        return;
      }

      const signedInRole = (res.role as Role | undefined) ?? role;

      const roleName =
        signedInRole === "admin"
          ? "Administrator"
          : signedInRole === "supervisor"
            ? "Regional Supervisor"
            : signedInRole === "manager"
              ? "Manager"
              : "Field Agent";

      if (res.mustChangePassword) {
        toast.info("Security update required", {
          description: "Please set a fresh password to secure your account for the first time."
        });
        setTimeout(() => {
          window.location.href = `/setup-password/${email}`;
        }, 1500);
        return;
      }

      toast.success(`Signed in as ${roleName}`);
      const destination = getPostLoginPath(signedInRole);

      await utils.auth.me.invalidate();

      let hasSession = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const me = await utils.auth.me.fetch();
          if (me) {
            hasSession = true;
            break;
          }
        } catch (_error) {
          // Allow a short retry window so cookie/session propagation can settle.
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (hasSession) {
        setLocation(destination);
      } else {
        window.location.href = destination;
      }
    } catch (err: any) {
      const message = err.message || "Login failed";
      if (message.includes("Access Denied")) {
        toast.error("Access Denied", {
          description:
            "Ensure you have selected the correct portal for your credentials.",
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        });
      } else {
        toast.error("Authentication failed", {
          description: message || "Invalid email or password.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast.error("Email required", { description: "Please enter your registered email." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPasswordMutation.mutateAsync({ email: forgotPasswordEmail });
      if (res.resetCode) {
        toast.success("Identity verified", {
          description: "A secure access code has been generated for your account.",
        });
        setTimeout(() => {
          window.location.href = `/setup-password/${res.resetCode}`;
        }, 2000);
      } else {
        toast.success("Request processed", {
          description: "If an account is associated with this email, you will receive reset instructions.",
        });
        setIsForgotPassword(false);
      }
    } catch (err: any) {
      toast.error("Verification failed", {
        description: err.message || "We couldn't find an account with that email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0F172A]">
        <img
          src="/sovereign_banking_bg_1775680448297.png"
          alt="Banking Background"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 to-transparent" />

        <div className="relative z-10 w-full h-full p-16 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-white flex items-center justify-center overflow-hidden">
              <img src="/user_logo.jpg" alt="Logo" className="w-full h-full object-cover scale-150" />
            </div>
            <div>
                <h1 className="text-white text-xl font-bold">Limitless Money Junction Track</h1>
                <span className="text-blue-300 text-xs text-center">All your agents. One hub.</span>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="text-5xl font-bold text-white leading-tight tracking-tight">
              Secure Banking<br />
              <span className="text-blue-300">Infrastructure.</span>
            </h2>
            <p className="text-blue-200/60 text-base">
              Limitless Money Junction Track: Protecting Zimbabwean mobile money agents by tracking every transaction across all platforms in one real-time dashboard.
            </p>
          </div>

          <div className="flex items-center gap-6 text-white/35 text-xs">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>PCI-DSS Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              <span>TLS 1.3 Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center border border-gray-200 overflow-hidden">
                <img src="/user_logo.jpg" alt="Logo" className="w-full h-full object-cover scale-150" />
              </div>
              <span className="text-lg font-bold text-gray-900">Limitless Money Junction Track</span>
              <p className="text-xs text-blue-600 font-bold">All your agents. One hub.</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Sign in to your account</h3>
            <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the dashboard</p>
          </div>

          {/* Role selector */}
          <div className="mb-8 grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-lg">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`h-9 rounded-md text-xs font-medium transition-all ${role === r.value
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsForgotPassword(false)}
                  className="p-0 h-auto text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </Button>
                <h4 className="text-xl font-bold text-gray-900">Reset your password</h4>
                <p className="text-sm text-gray-500">Enter your email and we'll verify your agent identity.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="agent@apex.co.zw"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="h-11 pl-11 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Verify Identity <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>
          ) : mfaRequired ? (
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Two-factor verification</h4>
                  <p className="text-sm text-gray-500 mt-1">Enter the code from your authenticator app</p>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <InputOTP
                  maxLength={6}
                  value={mfaToken}
                  onChange={setMfaToken}
                  autoFocus
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="h-12 w-10 rounded-lg text-lg font-semibold border-gray-200" />
                    <InputOTPSlot index={1} className="h-12 w-10 rounded-lg text-lg font-semibold border-gray-200" />
                    <InputOTPSlot index={2} className="h-12 w-10 rounded-lg text-lg font-semibold border-gray-200" />
                  </InputOTPGroup>
                  <div className="w-3 h-px bg-gray-300 mx-1" />
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={3} className="h-12 w-10 rounded-lg text-lg font-semibold border-gray-200" />
                    <InputOTPSlot index={4} className="h-12 w-10 rounded-lg text-lg font-semibold border-gray-200" />
                    <InputOTPSlot index={5} className="h-12 w-10 rounded-lg text-lg font-semibold border-gray-200" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-3">
                <Button
                  id="mfa-submit-btn"
                  type="submit"
                  disabled={isSubmitting || mfaToken.length !== 6}
                  className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Verify <ChevronRight className="h-4 w-4 ml-1" /></>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false);
                    setMfaToken("");
                  }}
                  className="w-full text-sm text-gray-500 flex items-center justify-center gap-1.5 hover:text-blue-600 transition-colors py-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="user@agent.co.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-11 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-11 pr-11 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 text-gray-900 placeholder:text-gray-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-md transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Sign in <ChevronRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-12 text-center">
            <p className="text-xs text-gray-400">
              © 2026 Limitless Money Junction Group
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
