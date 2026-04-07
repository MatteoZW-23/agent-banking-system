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
import { getAuthConfigError, getLoginUrl } from "@/const";
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
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ArrowLeftRight, label: "Transactions", path: "/transactions" },
  { icon: ClipboardCheck, label: "Reconciliation", path: "/reconciliation" },
  { icon: Wallet, label: "Floats", path: "/floats" },
  { icon: Users2, label: "Workforce", path: "/nodes" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
  { icon: BadgePercent, label: "Commissions", path: "/commissions" },
  { icon: FileUp, label: "CSV Import", path: "/csv-import" },
  { icon: FileChartLine, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const loginUrl = getLoginUrl();
  const authConfigError = getAuthConfigError();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full glass-card rounded-2xl animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <div className="h-16 w-16 premium-gradient rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                AgentTrack
              </h1>
              <p className="text-sm text-muted-foreground max-w-sm">
                {authConfigError ??
                  "Secure gateway to your banking operations. Authentication required."}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              if (!loginUrl) return;
              window.location.href = loginUrl;
            }}
            size="lg"
            className="w-full premium-gradient text-white shadow-xl hover:scale-105 transition-all duration-300 h-12 rounded-xl"
            disabled={!loginUrl}
          >
            {loginUrl ? "Enter Dashboard" : "Maintenance Mode"}
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
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
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
    const handleMouseUp = () => setIsResizing(false);
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative group/sidebar" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-slate-200 dark:border-slate-800 glass shadow-sm"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-20 justify-center border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 px-3 w-full">
              <button
                onClick={toggleSidebar}
                className="h-10 w-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
              >
                <PanelLeft className="h-5 w-5 text-slate-500" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 animate-slide-in-right">
                  <div className="h-8 w-8 premium-gradient rounded-lg flex items-center justify-center shadow-md">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold tracking-tight text-lg text-slate-800 dark:text-white">
                    AgentTrack
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="py-6 px-3">
            <SidebarMenu className="space-y-1.5">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-11 rounded-xl transition-all duration-200 ${
                        isActive 
                        ? "bg-slate-100 dark:bg-slate-800 text-primary font-semibold shadow-sm" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${isActive ? "text-primary" : "text-slate-400"}`}
                      />
                      <span className="ml-2">{item.label}</span>
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all w-full text-left focus:outline-none group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-md">
                    <AvatarFallback className="premium-gradient text-white text-sm font-bold">
                      {user?.name?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 animate-slide-in-right">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate uppercase tracking-tight">
                        {user?.name || "Administrator"}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase truncate mt-0.5">
                        {user?.role || "Agent Lead"}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card rounded-xl p-1.5 shadow-2xl border-slate-200 dark:border-slate-800">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg h-10 font-medium transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* MJ Signature Credits */}
            {!isCollapsed && (
              <div className="mt-6 px-2 animate-fade-in">
                <div className="h-px w-full bg-slate-100 dark:bg-slate-800/60 mb-6 shadow-tiny" />
                <a 
                  href="https://linkedin.com/in/mathew-mabira-24861632b" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3.5 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl transition-all hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <Linkedin className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic mb-0.5 group-hover:text-primary/70 transition-colors">Designed & Built BY</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white font-outfit uppercase tracking-tighter italic shadow-primary-sm group-hover:tracking-widest transition-all">MJ</span>
                    </div>
                  </div>
                  <div className="h-6 w-6 rounded-lg bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    <LayoutDashboard className="h-3 w-3 text-primary rotate-45" />
                  </div>
                </a>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/40 transition-colors z-50 opacity-0 group-hover/sidebar:opacity-100"
            onMouseDown={() => setIsResizing(true)}
          />
        )}
      </div>

      <SidebarInset className="flex flex-col flex-1 overflow-hidden">
        {isMobile && (
          <header className="flex border-b border-slate-200 dark:border-slate-800 h-16 items-center justify-between bg-white/80 dark:bg-black/60 px-4 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 premium-gradient rounded flex items-center justify-center shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-slate-800 dark:text-white text-sm">
                  AgentTrack
                </span>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide animate-fade-in">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
