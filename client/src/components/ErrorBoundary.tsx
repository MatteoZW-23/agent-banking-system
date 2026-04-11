import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/20 shadow-xl shadow-red-500/5">
          <div className="h-20 w-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          
          <div className="max-w-md space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Something went wrong</h1>
            <p className="text-gray-500 dark:text-gray-400">
              An unexpected error occurred in the banking interface. Your session is safe, but this view needs to be reloaded.
            </p>
          </div>

          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="rounded-lg h-11 px-6 border-red-200 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reload Page
            </Button>
            
            <Button 
              onClick={() => (window.location.href = "/")}
              className="rounded-lg h-11 px-6 bg-gray-900 text-white"
            >
              Back to Safety
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg text-left text-xs font-mono text-red-500 overflow-auto max-w-full">
              {this.state.error?.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
