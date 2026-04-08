import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  ShieldCheck,
  Smartphone,
  Moon,
  Sun,
  Palette,
  User,
  Lock,
  Database,
  Cloud,
  ChevronRight,
  Zap,
  Fingerprint,
  RefreshCw,
} from "lucide-react";
import ProviderConfig from "./ProviderConfig";
import SMSConfig from "./SMSConfig";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

function MFAConfig({ user }: { user: any }) {
  const utils = trpc.useUtils();
  const [showSetup, setShowSetup] = useState(false);
  const [token, setToken] = useState("");
  
  const setupQuery = trpc.mfa.setup.useQuery(undefined, {
    enabled: showSetup && !user?.mfaEnabled,
    refetchOnWindowFocus: false
  });

  const enableMutation = trpc.mfa.enable.useMutation({
    onSuccess: () => {
      toast.success("Multifactor Authentication Active", {
        description: "Your account is now protected by a secondary identity node."
      });
      setShowSetup(false);
      setToken("");
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const disableMutation = trpc.mfa.disable.useMutation({
    onSuccess: () => {
      toast.success("MFA Disabled", {
        description: "Security protocols have been reverted to single-factor."
      });
      setShowSetup(false);
      setToken("");
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  if (user?.mfaEnabled) {
    return (
      <div className="space-y-4">
        <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex items-center justify-between group">
           <div className="flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                 <Smartphone className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-lg font-black font-outfit uppercase italic tracking-tighter text-slate-900 dark:text-white">Multifactor Active</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Account secured by terminal-sync token</p>
              </div>
           </div>
           <Button 
            variant="ghost" 
            onClick={() => setShowSetup(!showSetup)}
            className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-50"
           >
              {showSetup ? "Cancel" : "Disable Protocol"}
           </Button>
        </div>

        {showSetup && (
          <div className="p-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-8 animate-in zoom-in-95 duration-300">
             <div className="space-y-2">
                <h5 className="text-sm font-black uppercase text-slate-900 dark:text-white italic">Confirm Deactivation</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">Enter your 6-digit backup code or current token to disable MFA.</p>
             </div>
             
             <div className="flex justify-center">
                <InputOTP maxLength={6} value={token} onChange={setToken}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
             </div>

             <Button 
              onClick={() => disableMutation.mutate({ token })}
              disabled={token.length !== 6 || disableMutation.isPending}
              className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest transition-all"
             >
                Confirm Security Revocation
             </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() => setShowSetup(!showSetup)}
        className="w-full h-16 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between px-8 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all font-black text-xs uppercase tracking-widest"
      >
        <span className="flex items-center gap-4">
          <Smartphone className="w-4 h-4 text-primary" /> MFA
          Node Configuration
        </span>
        <Badge className="bg-slate-100 text-slate-400 border-none">
          INACTIVE
        </Badge>
      </Button>

      {showSetup && (
        <div className="p-10 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[3rem] space-y-10 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-6 border-b border-slate-50 dark:border-slate-900 pb-8">
              <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20">
                 <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-xl font-black font-outfit uppercase italic tracking-tighter text-slate-900 dark:text-white">Secure Account Node</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">Scan via Google Authenticator or Microsoft Auth</p>
              </div>
           </div>

           {setupQuery.isLoading ? (
             <div className="h-48 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
             </div>
           ) : setupQuery.data && (
              <div className="space-y-10">
                 <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-2xl">
                       <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupQuery.data.uri)}`}
                        alt="MFA QR Code"
                        className="w-40 h-40"
                       />
                    </div>
                    <div className="flex-1 space-y-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Manual Setup Secret</label>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono text-sm font-bold text-center tracking-widest border border-slate-100 dark:border-slate-800">
                             {setupQuery.data.secret}
                          </div>
                       </div>
                       <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                          Scan the code with your authentication app and enter the 6-digit sync token provided to finalize the handshake.
                       </p>
                    </div>
                 </div>

                 <div className="space-y-6 pt-6 border-t border-slate-50 dark:border-slate-900 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-4 block">Verification Handshake</label>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={token} onChange={setToken}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <Button 
                      onClick={() => enableMutation.mutate({ secret: setupQuery.data!.secret, token })}
                      disabled={token.length !== 6 || enableMutation.isPending}
                      className="w-full h-16 rounded-[1.5rem] premium-gradient text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all mt-6"
                    >
                      {enableMutation.isPending ? "Validating Protocol..." : "Activate Security Node"}
                    </Button>
                 </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const isSystemAdmin = user?.role === "admin";
  const isManagement = isSystemAdmin || user?.role === "manager" || user?.role === "supervisor";

  return (
    <DashboardLayout>
      <div className="space-y-12 animate-fade-in pb-20 px-4 lg:px-0">
        {/* Core Config Header Node */}
        <PageHeader
          title="Settings"
          subtitle={isManagement ? "Manage your payments, SMS, and security settings." : "Manage your personal profile and appearance."}
          category="System"
          actions={isSystemAdmin && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-[1.25rem] px-6 border-slate-200 dark:border-slate-800 font-black text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-all"
              >
                <Database className="mr-3 h-4 w-4" /> Cloud Backup
              </Button>
              <Button className="h-12 rounded-[1.25rem] premium-gradient text-white px-8 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all">
                <RefreshCw className="mr-3 h-4 w-4" /> Restart
              </Button>
            </div>
          )}
        />

        <Tabs defaultValue="general" className="w-full space-y-10">
          <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 h-16 rounded-[2rem] border border-slate-200 dark:border-slate-800/50 gap-2 mb-10 overflow-x-auto scrollbar-hide max-w-full">
            <TabsTrigger
              value="general"
              className="rounded-2xl px-8 h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
            >
              <User className="w-4 h-4 mr-3" /> General
            </TabsTrigger>
            {isSystemAdmin && (
              <>
                <TabsTrigger
                  value="gateways"
                  className="rounded-2xl px-8 h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <Cloud className="w-4 h-4 mr-3" /> Gateways
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="rounded-2xl px-8 h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <Bell className="w-4 h-4 mr-3" /> Alerts
                </TabsTrigger>
              </>
            )}
            <TabsTrigger
              value="appearance"
              className="rounded-2xl px-8 h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Palette className="w-4 h-4 mr-3" /> Appearance
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-2xl px-8 h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
            >
              <ShieldCheck className="w-4 h-4 mr-3" /> Security
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent
            value="general"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-none shadow-sm dark:bg-slate-900/50 rounded-[2.5rem] overflow-hidden group">
                <CardHeader className="pt-10 px-10 pb-6">
                  <CardTitle className="text-2xl font-black font-outfit uppercase italic tracking-tighter">
                    {isSystemAdmin ? "Organization Profile" : "Personal Profile"}
                  </CardTitle>
                  <CardDescription className="text-xs uppercase font-bold text-slate-400 tracking-[0.2em] italic">
                    {isSystemAdmin ? "Identity nodes for receipts & reporting" : "Your agent identification & corporate identity"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                      {isSystemAdmin ? "Enterprise Name" : "Full Name"}
                    </label>
                    <input
                      readOnly={!isSystemAdmin}
                      defaultValue={isSystemAdmin ? "AgentTrack Global" : user?.name}
                      className="w-full h-14 px-6 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-sm transition-all focus:ring-8 focus:ring-primary/5 focus:border-primary/20 outline-none text-slate-800 dark:text-white font-outfit shadow-inner"
                    />
                  </div>
                  {isSystemAdmin && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                        Headquarters City
                      </label>
                      <select className="w-full h-14 px-6 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs transition-all appearance-none outline-none focus:border-primary/40 text-slate-800 dark:text-white shadow-inner">
                        <option>Harare CBD</option>
                        <option>Bulawayo Node</option>
                        <option>Johannesburg Global</option>
                      </select>
                    </div>
                  )}
                  <Button disabled={!isSystemAdmin} className="w-full h-14 rounded-2xl premium-gradient text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                    Update Profile
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm dark:bg-slate-900/50 rounded-[2.5rem] overflow-hidden group">
                <CardHeader className="pt-10 px-10 pb-6">
                  <CardTitle className="text-2xl font-black font-outfit uppercase italic tracking-tighter">
                    {isSystemAdmin ? "Regional Formatting" : "Session Identity"}
                  </CardTitle>
                  <CardDescription className="text-xs uppercase font-bold text-slate-400 tracking-[0.2em] italic">
                    {isSystemAdmin ? "Currency & date localized telemetry" : "Your active identity for current sessions"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12 space-y-8">
                  {isSystemAdmin ? (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                          Base Currency
                        </label>
                        <select className="w-full h-14 px-6 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs transition-all outline-none focus:border-primary/40 text-slate-800 dark:text-white">
                          <option>USD ($)</option>
                          <option>ZAR (R)</option>
                          <option>ZiG (G)</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                          Timezone
                        </label>
                        <select className="w-full h-14 px-6 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs transition-all outline-none focus:border-primary/40 text-slate-800 dark:text-white">
                          <option>GMT+2 (Harare)</option>
                          <option>GMT+1 (Lagos)</option>
                          <option>GMT+0 (London)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-inter italic">
                        Authorized Role
                      </label>
                      <div className="w-full h-14 px-6 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center font-black text-primary text-xs uppercase tracking-[0.2em]">
                        {user?.role} Access Profile
                      </div>
                    </div>
                  )}
                  {isSystemAdmin && (
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter italic">
                          Signature Branding
                        </p>
                        <p className="text-sm font-black text-slate-800 dark:text-white font-outfit uppercase italic tracking-tighter">
                          Show "Built by MJ" Credits
                        </p>
                      </div>
                      <div className="h-8 w-14 bg-primary rounded-full p-1 relative flex items-center shadow-inner cursor-pointer">
                        <div className="h-6 w-6 bg-white rounded-full shadow-md ml-auto" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gateways Tab (Nested ProviderConfig logic) */}
          <TabsContent
            value="gateways"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="bg-slate-50/30 dark:bg-slate-950/10 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm shadow-inner">
              <ProviderConfig />
            </div>
          </TabsContent>

          {/* Alerts Tab (Nested SMSConfig logic) */}
          <TabsContent
            value="alerts"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="bg-slate-50/30 dark:bg-slate-950/10 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm shadow-inner">
              <SMSConfig />
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent
            value="appearance"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-none shadow-sm dark:bg-slate-900/50 rounded-[2.5rem] overflow-hidden group">
                <CardHeader className="pt-10 px-10 pb-6">
                  <CardTitle className="text-2xl font-black font-outfit uppercase italic tracking-tighter">
                    Visual Interface Mode
                  </CardTitle>
                  <CardDescription className="text-xs uppercase font-bold text-slate-400 tracking-[0.2em] italic">
                    Telemetry node visibility preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme("light")}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${theme === "light" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 opacity-40 hover:opacity-100"}`}
                    >
                      <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                        <Sun className="h-6 w-6 text-amber-500" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] font-inter italic">
                        Light Node
                      </span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${theme === "dark" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 opacity-40 hover:opacity-100"}`}
                    >
                      <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                        <Moon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] font-inter italic">
                        Dark Core
                      </span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm dark:bg-slate-900/50 rounded-[2.5rem] overflow-hidden group">
                <CardHeader className="pt-10 px-10 pb-6">
                  <CardTitle className="text-2xl font-black font-outfit uppercase italic tracking-tighter">
                    UI Acceleration
                  </CardTitle>
                  <CardDescription className="text-xs uppercase font-bold text-slate-400 tracking-[0.2em] italic">
                    Render & animation performance nodes
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-12 space-y-6">
                  {[
                    {
                      label: "Hardware Acceleration",
                      desc: "GPU assisted graphics rendering",
                      icon: Zap,
                    },
                    {
                      label: "Motion Synthesis",
                      desc: "Fluid UI transitions & micro-animations",
                      icon: Palette,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-800">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white font-outfit uppercase italic leading-none">
                            {item.label}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60 italic">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="h-7 w-12 bg-primary rounded-full p-1 relative flex items-center shadow-inner cursor-pointer">
                        <div className="h-5 w-5 bg-white rounded-full shadow-md ml-auto" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent
            value="security"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <Card className="border-none shadow-sm dark:bg-slate-900/50 rounded-[3rem] overflow-hidden">
              <CardHeader className="pt-12 px-12 pb-8">
                <CardTitle className="text-3xl font-black font-outfit uppercase tracking-tighter italic">
                  Access Integrity Portal
                </CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 tracking-[0.25em] italic">
                  Manage administrative nodes & identity verification
                </CardDescription>
              </CardHeader>
              <CardContent className="px-12 pb-16">
                <div className="grid gap-12 lg:grid-cols-2">
                  <div className="space-y-8">
                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] italic mb-6">
                      Identity Protocols
                    </h4>
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        className="w-full h-16 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between px-8 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all font-black text-xs uppercase tracking-widest"
                      >
                        <span className="flex items-center gap-4">
                          <ShieldCheck className="w-4 h-4 text-primary" /> Modify
                          Account Password
                        </span>
                        <ChevronRight className="w-4 h-4 opacity-30" />
                      </Button>
                      <MFAConfig user={user} />
                      <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6 group hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                              <Fingerprint className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                {isSystemAdmin ? "Strict KYC Enforcement" : "Verified Identity Node"}
                              </h5>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                {isSystemAdmin ? "Mandatory ID for TX > $500" : "Your KYC Status: AUTHENTICATED"}
                              </p>
                            </div>
                          </div>
                          {isSystemAdmin && (
                            <div className="h-6 w-12 rounded-full bg-primary p-1 flex justify-end items-center cursor-pointer">
                              <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic border-t border-slate-100 dark:border-slate-800 pt-4">
                          {isSystemAdmin 
                            ? "When enabled, agents will be blocked from processing high-value transactions without a scanned ID record."
                            : "Your identity has been verified by the Hub Supervisor for active terminal operation."}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isSystemAdmin && (
                    <div className="space-y-8">
                      <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] italic mb-6">
                        Data Governance
                      </h4>
                      <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-all duration-700">
                          <Database className="h-48 w-48" />
                        </div>
                        <div className="relative z-10 space-y-6">
                          <h5 className="text-2xl font-black font-outfit uppercase italic leading-none">
                            Auto-Sync Backups
                          </h5>
                          <p className="text-xs text-slate-400 font-medium font-inter italic opacity-80">
                            Encryption nodes securely vault all transaction
                            telemetry to regional cloud buckets hourly.
                          </p>
                          <Button className="w-full h-12 rounded-xl bg-white text-slate-950 hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-widest">
                            Download Hub Manifest
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MJ Signature Credit Node */}
        <div className="pt-20 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">
            System Core Version 1.0.4-LATEST
          </p>
          <a
            href="https://linkedin.com/in/mathew-mabira-24861632b"
            target="_blank"
            className="flex items-center gap-3 group"
          >
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-primary transition-all">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-sm font-black text-slate-800 dark:text-white font-outfit uppercase italic tracking-tighter">
              Designed with Integrity by MJ
            </span>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
