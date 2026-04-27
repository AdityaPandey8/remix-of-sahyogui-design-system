import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/useAuth";
import { CrisisProvider } from "@/contexts/CrisisContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardNGO from "./pages/DashboardNGO";
import DashboardVolunteer from "./pages/DashboardVolunteer";
import DashboardPublic from "./pages/DashboardPublic";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import DataProtection from "./pages/DataProtection";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <CrisisProvider>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole="admin"><DashboardAdmin /></ProtectedRoute>} />
              <Route path="/dashboard/ngo" element={<ProtectedRoute requiredRole="ngo"><DashboardNGO /></ProtectedRoute>} />
              <Route path="/dashboard/volunteer" element={<ProtectedRoute requiredRole="volunteer"><DashboardVolunteer /></ProtectedRoute>} />
              <Route path="/dashboard/public" element={<ProtectedRoute requiredRole="public"><DashboardPublic /></ProtectedRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/data-protection" element={<DataProtection />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </CrisisProvider>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
