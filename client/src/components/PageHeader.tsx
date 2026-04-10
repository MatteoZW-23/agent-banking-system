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
  category = "Operations",
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
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-slate-700">
      <div>
        <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
          {category}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-600 dark:text-slate-300">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium">{currentDate}</span>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            className="h-10 w-10 rounded-lg"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
