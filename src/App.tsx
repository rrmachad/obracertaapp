import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { PageTransition } from "@/components/PageTransition";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { ObraDetails } from "./pages/ObraDetails";
import { AdminPanel } from "./pages/AdminPanel";
import { PortalCliente } from "./pages/PortalCliente";
import { ComprasPage } from "./pages/ComprasPage";
import { LucratividadePage } from "./pages/LucratividadePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function DynamicTitle() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.title = `${t('brand.name')} - ${t('app.tagline')}`;
  }, [t, i18n.language]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <DynamicTitle />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PageTransition>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/portal/:token" element={<PortalCliente />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/obra/:id" element={
                  <ProtectedRoute>
                    <ObraDetails />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                <Route path="/compras" element={
                  <ProtectedRoute>
                    <ComprasPage />
                  </ProtectedRoute>
                } />
                <Route path="/lucratividade" element={
                  <ProtectedRoute>
                    <LucratividadePage />
                  </ProtectedRoute>
                } />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
