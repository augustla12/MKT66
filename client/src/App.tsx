import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleOAuthProvider } from '@react-oauth/google';

import Layout from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import Creatives from "@/pages/creatives";
import Budget from "@/pages/budget";
import LandingPagesPage from "@/pages/landingpages";
import WhatsApp from "@/pages/whatsapp";
import Copy from "@/pages/copy";
import Funnel from "@/pages/funnel";
import Metrics from "@/pages/metrics";
import Alerts from "@/pages/alerts";
import Export from "@/pages/export";
import Integrations from "@/pages/integrations";
import SchedulePage from "@/pages/schedule";
import NotFound from "@/pages/not-found";
import { useAuthStore } from "@/lib/auth";
import { useEffect } from "react";
import { FloatingMCPAgent } from "@/components/mcp/FloatingMCPAgent";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthChecked } = useAuthStore();
  const [, navigate] = useLocation();

  // Bypass de autenticação para desenvolvimento local
  const forceBypass = import.meta.env.VITE_FORCE_AUTH_BYPASS === 'true';

  useEffect(() => {
    if (!forceBypass && isAuthChecked && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthChecked, isAuthenticated, navigate, forceBypass]);

  if (!forceBypass && !isAuthChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!forceBypass && !isAuthenticated) {
    return null;
  }

  return <Layout>{children}</Layout>;
}

// Seu componente que define a estrutura das rotas
function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/"><ProtectedRoute><Dashboard /></ProtectedRoute></Route>
      <Route path="/dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></Route>
      <Route path="/campaigns"><ProtectedRoute><Campaigns /></ProtectedRoute></Route>
      <Route path="/schedule"><ProtectedRoute><SchedulePage /></ProtectedRoute></Route>
      <Route path="/creatives"><ProtectedRoute><Creatives /></ProtectedRoute></Route>
      <Route path="/budget"><ProtectedRoute><Budget /></ProtectedRoute></Route>
      <Route path="/landingpages"><ProtectedRoute><LandingPagesPage /></ProtectedRoute></Route>
      <Route path="/whatsapp"><ProtectedRoute><WhatsApp /></ProtectedRoute></Route>
      <Route path="/copy"><ProtectedRoute><Copy /></ProtectedRoute></Route>
      <Route path="/funnel"><ProtectedRoute><Funnel /></ProtectedRoute></Route>
      <Route path="/metrics"><ProtectedRoute><Metrics /></ProtectedRoute></Route>
      <Route path="/alerts"><ProtectedRoute><Alerts /></ProtectedRoute></Route>
      <Route path="/export"><ProtectedRoute><Export /></ProtectedRoute></Route>
      <Route path="/integrations"><ProtectedRoute><Integrations /></ProtectedRoute></Route>
      <Route><NotFound /></Route>
    </Switch>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const forceBypass = import.meta.env.VITE_FORCE_AUTH_BYPASS === 'true';
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Se o bypass está ativado, usar um client ID padrão
  const clientId = !googleClientId ? 'bypass-client-id' : googleClientId;

  if (!forceBypass && !googleClientId) {
    console.error("VITE_GOOGLE_CLIENT_ID não está definido no arquivo .env");
    return <div className="text-red-500 p-4">Erro de configuração: VITE_GOOGLE_CLIENT_ID não encontrado.</div>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
            {/* O componente WouterRouter deve envolver todos os componentes que usam o roteamento. */}
            <WouterRouter>
              <Toaster />
              <AppRoutes /> {/* Seu componente com as rotas */}
              <FloatingMCPAgent />
            </WouterRouter>
            {/* ======================== FIM DA CORREÇÃO ========================= */}
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
