import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Professionals from "@/pages/professionals";
import Services from "@/pages/services";
import Timeslots from "@/pages/timeslots";
import NewTimeslot from "@/pages/timeslots/new";

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  
  if (user.role === "admin") return <Redirect to="/dashboard" />;
  return <Redirect to="/timeslots" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clients" component={Clients} />
      <Route path="/professionals" component={Professionals} />
      <Route path="/services" component={Services} />
      
      <Route path="/timeslots" component={Timeslots} />
      <Route path="/timeslots/new" component={NewTimeslot} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
