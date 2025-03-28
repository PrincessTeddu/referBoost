import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import Dashboard from "./pages/dashboard";
import Customers from "./pages/customers";
import Campaigns from "./pages/campaigns";
import Rewards from "./pages/rewards";
import Referrals from "./pages/referrals";
import Analytics from "./pages/analytics";
import Settings from "./pages/settings";
import MainLayout from "./components/layout/main-layout";

function Router() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        
        <ProtectedRoute path="/" component={() => (
          <MainLayout>
            <Dashboard />
          </MainLayout>
        )} />
        
        <ProtectedRoute path="/customers" component={() => (
          <MainLayout>
            <Customers />
          </MainLayout>
        )} />
        
        <ProtectedRoute path="/campaigns" component={() => (
          <MainLayout>
            <Campaigns />
          </MainLayout>
        )} />
        
        <ProtectedRoute path="/rewards" component={() => (
          <MainLayout>
            <Rewards />
          </MainLayout>
        )} />
        
        <ProtectedRoute path="/referrals" component={() => (
          <MainLayout>
            <Referrals />
          </MainLayout>
        )} />
        
        <ProtectedRoute path="/analytics" component={() => (
          <MainLayout>
            <Analytics />
          </MainLayout>
        )} />
        
        <ProtectedRoute path="/settings" component={() => (
          <MainLayout>
            <Settings />
          </MainLayout>
        )} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
