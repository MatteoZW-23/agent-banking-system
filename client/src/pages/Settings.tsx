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
      toast.success("MFA enabled", {
        description: "Your account is now protected with two-factor authentication."
      });
      setShowSetup(false);
      setToken("");
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  const disableMutation = trpc.mfa.disable.useMutation({
    onSuccess: () => {
      toast.success("MFA disabled", {
        description: "Two-factor authentication has been removed from your account."
      });
      setShowSetup(false);
      setToken("");
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });

  if (user?.mfaEnabled) {
    return (
      <div className="space-y-3">
        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                 <Smartphone className="h-5 w-5" />
              </div>
              <div>
                 <h4 className="text-sm font-semibold text-gray-900 dark:text-white">MFA Enabled</h4>
                 <p className="text-xs text-gray-500 mt-0.5">Your account is secured with two-factor authentication</p>
              </div>
           </div>
           <Button 
            variant="ghost" 
            onClick={() => setShowSetup(!showSetup)}
            className="h-9 px-4 rounded-md text-xs font-medium text-red-500 hover:bg-red-50"
           >
              {showSetup ? "Cancel" : "Disable"}
           </Button>
        </div>

        {showSetup && (
          <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg space-y-5">
             <div>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Confirm deactivation</h5>
                <p className="text-xs text-gray-500 mt-1">Enter your current 6-digit code to disable MFA.</p>
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
              className="w-full h-10 rounded-md bg-gray-900 text-white font-medium text-sm"
             >
                Confirm Disable
             </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={() => setShowSetup(!showSetup)}
        className="w-full h-12 rounded-lg border-gray-200 dark:border-slate-700 flex items-center justify-between px-5 hover:bg-gray-50 transition-colors font-medium text-sm"
      >
        <span className="flex items-center gap-3">
          <Smartphone className="w-4 h-4 text-blue-600" /> Two-factor authentication
        </span>
        <Badge className="bg-gray-100 text-gray-400 border-none text-xs">
          Inactive
        </Badge>
      </Button>

      {showSetup && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg space-y-6">
           <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-700 pb-5">
              <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                 <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                 <h4 className="text-base font-semibold text-gray-900 dark:text-white">Set Up MFA</h4>
                 <p className="text-xs text-gray-500 mt-0.5">Scan with Google Authenticator or Microsoft Authenticator</p>
              </div>
           </div>

           {setupQuery.isLoading ? (
             <div className="h-40 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
             </div>
           ) : setupQuery.data && (
              <div className="space-y-6">
                 <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                       <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupQuery.data.uri)}`}
                        alt="MFA QR Code"
                        className="w-36 h-36"
                       />
                    </div>
                    <div className="flex-1 space-y-4">
                       <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Manual entry key</label>
                          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-md font-mono text-sm font-medium text-center border border-gray-200 dark:border-slate-700">
                             {setupQuery.data.secret}
                          </div>
                       </div>
                       <p className="text-xs text-gray-500 leading-relaxed">
                          Scan the QR code with your authenticator app, then enter the 6-digit verification code below.
                       </p>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-700 text-center">
                    <label className="text-xs font-medium text-gray-500 block">Verification code</label>
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
                      className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm mt-4"
                    >
                      {enableMutation.isPending ? "Verifying..." : "Enable MFA"}
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
      <div className="space-y-8 pb-16">
        <PageHeader
          title="Settings"
          subtitle={isManagement ? "Manage payments, SMS, and security settings." : "Manage your profile and preferences."}
          category="System"
          actions={isSystemAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-9 rounded-lg px-4 border-gray-200 font-medium text-xs text-gray-500 hover:text-blue-600"
              >
                <Database className="mr-2 h-3.5 w-3.5" /> Backup
              </Button>
              <Button className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 font-medium text-xs">
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Restart
              </Button>
            </div>
          )}
        />

        <Tabs defaultValue="general" className="w-full space-y-6">
          <TabsList className="bg-gray-100 dark:bg-slate-800 p-1 h-11 rounded-lg border border-gray-200 dark:border-slate-700 gap-1 overflow-x-auto max-w-full">
            <TabsTrigger
              value="general"
              className="rounded-md px-4 h-full font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 mr-2" /> General
            </TabsTrigger>
            {isSystemAdmin && (
              <>
                <TabsTrigger
                  value="gateways"
                  className="rounded-md px-4 h-full font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  <Cloud className="w-4 h-4 mr-2" /> Gateways
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="rounded-md px-4 h-full font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  <Bell className="w-4 h-4 mr-2" /> Alerts
                </TabsTrigger>
              </>
            )}
            <TabsTrigger
              value="appearance"
              className="rounded-md px-4 h-full font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <Palette className="w-4 h-4 mr-2" /> Appearance
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-md px-4 h-full font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 mr-2" /> Security
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isSystemAdmin ? "Organization Profile" : "Personal Profile"}
                  </CardTitle>
                  <CardDescription>
                    {isSystemAdmin ? "Company identity for receipts & reporting" : "Your identification details"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      {isSystemAdmin ? "Company Name" : "Full Name"}
                    </label>
                    <input
                      readOnly={!isSystemAdmin}
                      defaultValue={isSystemAdmin ? "Sovereign Finance Global" : (user?.name || "")}
                      className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                  {isSystemAdmin && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                        Headquarters
                      </label>
                      <select className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md font-medium text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white">
                        <option>Harare CBD</option>
                        <option>Bulawayo</option>
                        <option>Johannesburg</option>
                      </select>
                    </div>
                  )}
                  <Button disabled={!isSystemAdmin} className="w-full h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isSystemAdmin ? "Regional Formatting" : "Session Info"}
                  </CardTitle>
                  <CardDescription>
                    {isSystemAdmin ? "Currency and timezone configuration" : "Your current active session"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {isSystemAdmin ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Currency</label>
                        <select className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md font-medium text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white">
                          <option>USD ($)</option>
                          <option>ZAR (ZAR)</option>
                          <option>ZiG (ZiG)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Timezone</label>
                        <select className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md font-medium text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white">
                          <option>GMT+2 (Harare)</option>
                          <option>GMT+1 (Lagos)</option>
                          <option>GMT+0 (London)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Role</label>
                      <div className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md flex items-center font-medium text-sm text-blue-600 capitalize">
                        {user?.role}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gateways */}
          <TabsContent value="gateways">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
              <ProviderConfig />
            </div>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
              <SMSConfig />
            </div>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Theme</CardTitle>
                  <CardDescription>Choose your preferred appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme("light")}
                      className={`p-5 rounded-lg border-2 transition-all flex flex-col items-center gap-3 ${theme === "light" ? "border-blue-500 bg-blue-50/50" : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 opacity-50 hover:opacity-100"}`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow border border-gray-200">
                        <Sun className="h-5 w-5 text-amber-500" />
                      </div>
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-5 rounded-lg border-2 transition-all flex flex-col items-center gap-3 ${theme === "dark" ? "border-blue-500 bg-blue-50/50" : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 opacity-50 hover:opacity-100"}`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center shadow">
                        <Moon className="h-5 w-5 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Performance</CardTitle>
                  <CardDescription>Animation and rendering options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      label: "Hardware acceleration",
                      desc: "Use GPU for graphics rendering",
                      icon: Zap,
                    },
                    {
                      label: "Animations",
                      desc: "Enable UI transitions and animations",
                      icon: Palette,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-blue-600 border border-gray-200 dark:border-slate-700">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="h-6 w-11 bg-blue-600 rounded-full p-0.5 relative flex items-center cursor-pointer">
                        <div className="h-5 w-5 bg-white rounded-full shadow-sm ml-auto" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card className="border border-gray-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Security Settings</CardTitle>
                <CardDescription>
                  Manage authentication and access controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-5">
                    <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      Authentication
                    </h4>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-lg border-gray-200 dark:border-slate-700 flex items-center justify-between px-5 hover:bg-gray-50 font-medium text-sm"
                      >
                        <span className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-blue-600" /> Change Password
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Button>
                      <MFAConfig user={user} />
                      <div className="p-5 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                              <Fingerprint className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                {isSystemAdmin ? "KYC Enforcement" : "Identity Verified"}
                              </h5>
                              <p className="text-xs text-gray-500">
                                {isSystemAdmin ? "Require ID for transactions > $500" : "Status: Verified"}
                              </p>
                            </div>
                          </div>
                          {isSystemAdmin && (
                            <div className="h-6 w-11 rounded-full bg-blue-600 p-0.5 flex justify-end items-center cursor-pointer">
                              <div className="h-5 w-5 rounded-full bg-white shadow-sm" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-200 dark:border-slate-700 pt-3">
                          {isSystemAdmin 
                            ? "When enabled, agents cannot process high-value transactions without a scanned ID record."
                            : "Your identity has been verified by the branch supervisor."}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isSystemAdmin && (
                    <div className="space-y-5">
                      <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        Data & Backups
                      </h4>
                      <div className="p-6 bg-gray-900 rounded-xl text-white">
                        <div className="space-y-4">
                          <h5 className="text-lg font-semibold">
                            Automated Backups
                          </h5>
                          <p className="text-sm text-gray-400 leading-relaxed">
                            All transaction data is encrypted and backed up to regional cloud storage every hour.
                          </p>
                          <Button className="w-full h-10 rounded-lg bg-white text-gray-900 hover:bg-blue-600 hover:text-white transition-colors font-medium text-sm">
                            Download Backup
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

        {/* Footer */}
        <div className="pt-12 border-t border-gray-200 dark:border-slate-700 flex flex-col items-center gap-3 opacity-40">
          <p className="text-xs text-gray-400">
            Version 1.0.4
          </p>
          <p className="text-xs text-gray-500">
            Sovereign Finance Network &copy; 2026
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
