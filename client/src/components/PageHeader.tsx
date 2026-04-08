import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon, RefreshCw } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  category?: string;
  actions?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function PageHeader({
  title,
  subtitle,
  category = "Enterprise Operations",
  actions,
  refreshing = false,
  onRefresh,
}: PageHeaderProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 pb-3 border-b border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-primary/40 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-inter italic">
            {category} • Node Sync Active
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white font-outfit uppercase italic leading-none">
            {title}
          </h1>
          <p className="text-sm md:text-base font-semibold text-slate-600 dark:text-slate-400 font-inter uppercase tracking-widest italic">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
          <span className="text-[10px] h-4 font-black font-outfit uppercase tracking-widest text-slate-700 dark:text-white leading-none">
            {currentDate} Hub Live
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={refreshing}
              className="h-12 w-12 rounded-[1.25rem] border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 hover:text-primary transition-all active:scale-90 shadow-sm"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin text-primary" : ""}`}
              />
            </Button>
          )}
          {actions}
        </div>
      </div>

      {/* Visual Accent Decoration */}
      <div className="absolute -bottom-[2px] left-0 h-1 w-24 bg-primary/60 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
    </div>
  );
}
