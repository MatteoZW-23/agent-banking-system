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
import { trpc } from "@/lib/trpc";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const adminMenuGroups = [
  {
    label: "Core Operations",
    items: [
      { icon: LayoutDashboard, label: "Admin Console", path: "/" },
      { icon: ArrowLeftRight, label: "Live Transactions", path: "/transactions" },
      { icon: ClipboardCheck, label: "Reconciliation", path: "/reconciliation" },
    ]
  },
  {
    label: "Network Management",
    items: [
      { icon: Wallet, label: "Float Command", path: "/floats" },
      { icon: Users2, label: "Operative Directory", path: "/nodes" },
      { icon: Building2, label: "Branch Oversight", path: "/supervisor" },
      { icon: Wallet, label: "Top-up Queue", path: "/supervisor/requests" },
    ]
  },
  {
    label: "Security & Intel",
    items: [
      { icon: ShieldCheck, label: "Security Radar", path: "/security" },
      { icon: ShieldCheck, label: "System Intel", path: "/supervisor/intel" },
      { icon: Users2, label: "Team Audit", path: "/supervisor/team" },
    ]
  },
  {
    label: "Administrative",
    items: [
      { icon: FileUp, label: "Batch CSV Import", path: "/csv-import" },
      { icon: FileChartLine, label: "Network Reports", path: "/reports" },
      { icon: BadgePercent, label: "Commission Logic", path: "/commissions" },
      { icon: Settings, label: "System Config", path: "/settings" },
    ]
  }
];

const workerMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/worker" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const supervisorMenuGroups = [
  {
    label: "Frontline Control",
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/supervisor" },
      { icon: Wallet, label: "Requests", path: "/supervisor/requests" },
    ]
  },
  {
    label: "Management",
    items: [
      { icon: Users2, label: "Team", path: "/supervisor/team" },
      { icon: ShieldCheck, label: "Security Feed", path: "/supervisor/intel" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ]
  }
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

import { FloatingAIAssistant } from "./FloatingAIAssistant";
import { TermsModal } from "./TermsModal";
import { DeveloperCreditsModal } from "./DeveloperCreditsModal";
import { BadgeInfo } from "lucide-react";

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
  const utils = trpc.useUtils();
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    if (user && !user.agreedToTerms) {
      setShowTerms(true);
    } else {
      setShowTerms(false);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Access to this dashboard requires authentication.
            </p>
          </div>
          <Button
            onClick={() => {
              setLocation("/login");
            }}
            size="lg"
            className="w-full"
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
  const utils = trpc.useUtils();
  const [showTerms, setShowTerms] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !(user as any).agreedToTerms) {
      setShowTerms(true);
    } else {
      setShowTerms(false);
    }
  }, [user]);

  const isWorker = user?.role === "agent";
  const isSupervisorOrManager = user?.role === "supervisor" || user?.role === "manager";

  const renderMenuItems = (items: { icon: any; label: string; path: string }[]) => (
    <SidebarMenu className="gap-1 py-1">
      {items.map(item => {
        const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              isActive={isActive}
              onClick={() => setLocation(item.path)}
              tooltip={item.label}
              className={`h-9 rounded-lg transition-all duration-200 ${isActive
                ? "bg-blue-600 shadow-lg shadow-blue-500/20 text-white font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : ""}`} />
              <span className="text-[13px] tracking-tight truncate">{item.label}</span>
              {isActive && !isCollapsed && (
                <div className="ml-auto flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  const activeLabel = isWorker 
    ? "Worker Hub" 
    : isSupervisorOrManager 
      ? "Manager Command" 
      : "Admin Console";

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
          className="border-r border-slate-800 !bg-[#0F172A]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-20 justify-center px-5">
            <div className="flex items-center gap-3 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-slate-400" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/user_logo.jpg" alt="Logo" className="w-full h-full object-cover scale-150" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-tight">
                      Limitless Junction
                    </span>
                    <span className="text-[11px] text-slate-500">
                      All your agents. One hub.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                  <img src="/user_logo.jpg" alt="Logo" className="w-full h-full object-cover scale-150" />
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-6 px-3 py-6 custom-scrollbar overflow-y-auto">
            {isWorker ? (
               renderMenuItems(workerMenuItems)
            ) : isSupervisorOrManager ? (
               supervisorMenuGroups.map(group => (
                 <div key={group.label} className="space-y-2">
                   {!isCollapsed && (
                     <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                       {group.label}
                     </p>
                   )}
                   {renderMenuItems(group.items)}
                 </div>
               ))
            ) : (
              adminMenuGroups.map(group => (
                <div key={group.label} className="space-y-2">
                  {!isCollapsed && (
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] opacity-50 mb-1">
                      {group.label}
                    </p>
                  )}
                  {renderMenuItems(group.items)}
                </div>
              ))
            )}
          </SidebarContent>

          <SidebarFooter className="p-3 gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg p-2.5 bg-slate-800/60 hover:bg-slate-700/60 transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-slate-700 text-xs font-semibold text-blue-400">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                      Limitless Junction · All your agents. One hub.
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg p-1">
                <DropdownMenuItem
                  onClick={() => setShowCredits(true)}
                  className="cursor-pointer text-blue-500 font-medium text-sm p-2.5 rounded-md"
                >
                  <BadgeInfo className="mr-2 h-4 w-4" />
                  <span>Developer Credits</span>
                </DropdownMenuItem>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-1" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-500 font-medium text-sm p-2.5 rounded-md"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>


          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-[-1px] w-[2px] h-full cursor-col-resize hover:bg-blue-500/40 transition-all group-hover/sidebar:opacity-100 opacity-0 ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-gray-50 dark:bg-slate-900">
        {isMobile && (
          <header className="flex h-14 items-center justify-between bg-[#0F172A] px-4 border-b border-slate-800 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-slate-800" />
              <h2 className="text-sm font-semibold text-white">{activeLabel}</h2>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-screen p-5 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">{children}</div>
          </div>
        </main>
      </SidebarInset>
      {!isWorker && <FloatingAIAssistant />}
      <TermsModal 
        isOpen={showTerms} 
        onAgreed={() => {
          setShowTerms(false);
          utils.auth.me.invalidate();
        }} 
      />
      <DeveloperCreditsModal 
        isOpen={showCredits}
        onClose={() => setShowCredits(false)}
      />
    </>
  );
}
