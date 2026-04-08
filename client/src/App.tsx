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
import Settings from "@/pages/Settings";
import LoginPage from "@/pages/LoginPage";
import PasswordSetupPage from "@/pages/PasswordSetupPage";
import SupervisorDashboard from "@/pages/SupervisorDashboard";
import SupervisorRequests from "@/pages/SupervisorRequests";
import SupervisorTeam from "@/pages/SupervisorTeam";
import SupervisorIntel from "@/pages/SupervisorIntel";
import ComponentsShowcase from "@/pages/ComponentsShowcase";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  const isAdmin = user?.role === "admin";
  const isSupervisor = user?.role === "supervisor";
  const isAgent = user?.role === "agent";
  const isManagement = isAdmin || isSupervisor;

  return (
    <Switch>
      {/* Root redirection based on role */}
      <Route path="/">
        {() => {
          if (!user) return <Redirect to="/login" />;
          if (isAdmin) return <Home />;
          if (isSupervisor) return <Redirect to="/supervisor" />;
          return <WorkerPortal />; 
        }}
      </Route>

      <Route path="/login" component={LoginPage} />

      <Route path="/setup-password/:code" component={PasswordSetupPage} />

      <Route path={"/worker"}>
        {() => isAgent ? <WorkerPortal /> : <Redirect to="/" />}
      </Route>

      <Route path={"/supervisor"}>
        {() => isSupervisor || isAdmin ? <SupervisorDashboard /> : <Redirect to="/" />}
      </Route>
      <Route path={"/supervisor/requests"}>
        {() => isSupervisor || isAdmin ? <SupervisorRequests /> : <Redirect to="/" />}
      </Route>
      <Route path={"/supervisor/team"}>
        {() => isSupervisor || isAdmin ? <SupervisorTeam /> : <Redirect to="/" />}
      </Route>
      <Route path={"/supervisor/intel"}>
        {() => isSupervisor || isAdmin ? <SupervisorIntel /> : <Redirect to="/" />}
      </Route>

      <Route path={"/settings"} component={Settings} />

      {/* Admin Only Routes - Strictly restricted */}
      <Route path={"/transactions"}>
        {() => isManagement ? <Transactions /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/reconciliation"}>
        {() => isManagement ? <Reconciliation /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/floats"}>
        {() => isAdmin ? <Floats /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/nodes"}>
        {() => isAdmin ? <Nodes /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/alerts"}>
        {() => isAdmin ? <Alerts /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/security"}>
        {() => isAdmin ? <Alerts /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/commissions"}>
        {() => isAdmin ? <Commissions /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/csv-import"}>
        {() => isAdmin ? <CSVImport /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/reports"}>
        {() => isAdmin ? <Reports /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/provider-config"}>
        {() => isAdmin ? <ProviderConfig /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/sms-config"}>
        {() => isAdmin ? <SMSConfig /> : <Redirect to="/404" />}
      </Route>
      <Route path={"/components"}>
        {() => isAdmin ? <ComponentsShowcase /> : <Redirect to="/404" />}
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      <Route path="/:rest*" component={NotFound} />
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
