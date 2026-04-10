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
  { icon: Bell, label: "Alerts", path: "/alerts" },
  { icon: BadgePercent, label: "Commissions", path: "/commissions" },
  { icon: ShieldCheck, label: "Security", path: "/security" },
  { icon: Users2, label: "Staff Directory", path: "/nodes" },
  { icon: FileUp, label: "Import CSV", path: "/csv-import" },
  { icon: FileChartLine, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const workerMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/worker" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const supervisorMenuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/supervisor" },
  { icon: Wallet, label: "Requests", path: "/supervisor/requests" },
  { icon: Users2, label: "Team", path: "/supervisor/team" },
  { icon: ShieldCheck, label: "Security Feed", path: "/supervisor/intel" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

import { FloatingAIAssistant } from "./FloatingAIAssistant";
import { TermsModal } from "./TermsModal";

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
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isWorker = user?.role === "agent";
  const isSupervisorOrManager = user?.role === "supervisor" || user?.role === "manager";

  const menuItems = isWorker
    ? workerMenuItems
    : isSupervisorOrManager
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
                      Sovereign Finance
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Agent Banking
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

          <SidebarContent className="gap-0 px-3">
            <SidebarMenu className="gap-1 py-2">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 rounded-lg transition-colors ${isActive
                        ? "bg-blue-600/15 text-white font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-blue-400" : ""}`} />
                      <span className="text-sm">{item.label}</span>
                      {isActive && !isCollapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
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
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg p-1">
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
              <h2 className="text-sm font-semibold text-white">{activeMenuItem?.label}</h2>
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
    </>
  );
}
