import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Transactions from "@/pages/Transactions";
import Reconciliation from "@/pages/Reconciliation";
import Floats from "@/pages/Floats";
import Alerts from "@/pages/Alerts";
import Commissions from "@/pages/Commissions";
import CSVImport from "@/pages/CSVImport";
import Reports from "@/pages/Reports";
import ProviderConfig from "@/pages/ProviderConfig";
import SMSConfig from "@/pages/SMSConfig";
import Nodes from "@/pages/Nodes";
import WorkerPortal from "@/pages/WorkerPortal";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/transactions"} component={Transactions} />
      <Route path={"/reconciliation"} component={Reconciliation} />
      <Route path={"/floats"} component={Floats} />
      <Route path={"/nodes"} component={Nodes} />
      <Route path={"/worker"} component={WorkerPortal} />
      <Route path={"/alerts"} component={Alerts} />
      <Route path={"/commissions"} component={Commissions} />
      <Route path={"/csv-import"} component={CSVImport} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/provider-config"} component={ProviderConfig} />
      <Route path={"/sms-config"} component={SMSConfig} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
