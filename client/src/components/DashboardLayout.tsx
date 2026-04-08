import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  ArrowLeftRight,
  ClipboardCheck,
  Wallet,
  Bell,
  BadgePercent,
  FileUp,
  FileChartLine,
  Settings,
  MessageSquareShare,
  ShieldCheck,
  Building2,
  Users2,
  Linkedin
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ArrowLeftRight, label: "Transactions", path: "/transactions" },
  { icon: ClipboardCheck, label: "Reconciliation", path: "/reconciliation" },
  { icon: Wallet, label: "Manage Floats", path: "/floats" },
  { icon: Bell, label: "Operation Alerts", path: "/alerts" },
  { icon: BadgePercent, label: "Commissions", path: "/commissions" },
  { icon: ShieldCheck, label: "Security & Risk", path: "/security" },
  { icon: Users2, label: "Agent Network", path: "/nodes" },
  { icon: FileUp, label: "Import CSV", path: "/csv-import" },
  { icon: FileChartLine, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const workerMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/worker" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const supervisorMenuItems = [
  { icon: LayoutDashboard, label: "Operations Hub", path: "/supervisor" },
  { icon: Wallet, label: "Money Requests", path: "/supervisor/requests" },
  { icon: Users2, label: "Team Management", path: "/supervisor/team" },
  { icon: ShieldCheck, label: "Security Intel", path: "/supervisor/intel" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

import { FloatingAIAssistant } from "./FloatingAIAssistant";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              setLocation("/login");
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isWorker = user?.role === "agent";
  const isSupervisor = user?.role === "supervisor";

  const menuItems = isWorker
    ? workerMenuItems
    : isSupervisor
      ? supervisorMenuItems
      : adminMenuItems;
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative group/sidebar" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-slate-200 !bg-[#0F172A] shadow-xl"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-24 justify-center px-6">
            <div className="flex items-center gap-4 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-10 w-10 flex items-center justify-center prism-panel hover:bg-white/10 rounded-xl transition-all focus:outline-none shrink-0 group"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-white/10 shadow-lg overflow-hidden shrink-0">
                    <img src="/user_logo.jpg" alt="MJ Logo" className="w-full h-full object-cover scale-150" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xl font-black text-white italic tracking-tighter uppercase font-outfit">
                      Sovereign
                    </span>
                    <span className="text-[8px] font-mono text-blue-400 uppercase tracking-[0.4em]">Operations_01</span>
                  </div>
                </div>
              ) : (
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-white/10 shadow-lg overflow-hidden">
                  <img src="/user_logo.jpg" alt="MJ Logo" className="w-full h-full object-cover scale-150" />
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-4">
            <SidebarMenu className="gap-2 py-2">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-12 rounded-xl transition-all duration-300 ${isActive
                        ? "bg-[#1A56DB]/20 text-white font-black border border-[#1A56DB]/30"
                        : "text-slate-400 hover:text-white hover:bg-white/8"
                        }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary scale-110" : ""}`}
                      />
                      <span className={`text-[10px] uppercase tracking-widest ${isActive ? "font-black" : "font-bold"}`}>{item.label}</span>
                      {isActive && !isCollapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-4 rounded-2xl p-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none group">
                  <Avatar className="h-10 w-10 border-2 border-white/5 shrink-0 group-hover:border-primary transition-colors">
                    <AvatarFallback className="bg-slate-900 text-xs font-black text-primary font-outfit italic">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-xs font-black text-white uppercase italic tracking-tighter">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[8px] font-mono text-slate-500 truncate mt-1 tracking-widest">
                      {user?.email?.split('@')[0].toUpperCase()}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 prism-panel rounded-2xl p-2 shadow-4xl border-white/10">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-rose-500 font-black uppercase text-[10px] tracking-widest p-4 rounded-xl hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Secure Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* MJ Signature - Command Deck Edition */}
            {!isCollapsed && (
              <div className="pb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <a
                  href="https://linkedin.com/in/mathew-mabira-24861632b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col p-4 bg-white/5 border border-white/10 rounded-2xl transition-all hover:border-emerald-500/30 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] italic group-hover:text-emerald-400 transition-colors">Developer Verification</span>
                    <Linkedin className="h-3 w-3 text-slate-400 group-hover:text-emerald-400 transition-all opacity-50 group-hover:opacity-100" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-mono text-slate-300">DEV:</span>
                    <span className="text-2xl font-black text-white font-outfit uppercase tracking-tighter italic group-hover:text-gradient-emerald selection:bg-emerald-500/30">MJ</span>
                  </div>
                  <div className="h-[2px] w-0 bg-emerald-500 mt-2 group-hover:w-full transition-all duration-700 opacity-30" />
                </a>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-[-1px] w-[2px] h-full cursor-col-resize hover:bg-primary/40 transition-all group-hover/sidebar:opacity-100 opacity-0 ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-blue-50">
        {isMobile && (
          <header className="flex h-16 items-center justify-between bg-[#0F172A] px-4 border-b border-white/5 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-10 w-10 rounded-xl prism-panel" />
              <h2 className="text-xs font-black text-white font-outfit uppercase italic tracking-widest">{activeMenuItem?.label}</h2>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="min-h-screen p-6 lg:p-12 animate-in fade-in duration-1000">
            <div className="max-w-[1700px] mx-auto space-y-12">{children}</div>
          </div>
        </main>
      </SidebarInset>
      {!isWorker && <FloatingAIAssistant />}
    </>
  );
}
