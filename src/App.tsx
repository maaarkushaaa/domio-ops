import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AppProvider, useApp } from "./contexts/AppContext";
import { NotificationProvider } from "./hooks/use-notifications";
import { ThemeProvider } from "./components/ui/theme-provider";
import { CommandPalette } from "./components/common/CommandPalette";
import { GlobalSearch } from "./components/search/GlobalSearch";
import { KeyboardShortcuts } from "./components/shortcuts/KeyboardShortcuts";
import { TaskHotkeys } from "./components/common/TaskHotkeys";
import { AIAssistantAdvanced } from "./components/ai/AIAssistantAdvanced";
import { NotificationContainer } from "./components/ui/NotificationContainer";
import { NotificationIntegration } from "./components/NotificationIntegration";
import { FinanceRealtimeProvider } from "./providers/FinanceRealtimeProvider";
import { NotificationSettingsPage } from "./pages/NotificationSettings";
import { useAppNotifications } from "./hooks/use-app-notifications";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Production from "./pages/Production";
import Materials from "./pages/Materials";
import Finance from "./pages/Finance";
import Procurement from "./pages/Procurement";
import Clients from "./pages/Clients";
import Documents from "./pages/Documents";
import Email from "./pages/Email";
import Knowledge from "./pages/Knowledge";
import Calendar from "./pages/Calendar";
import Wall from "./pages/Wall";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Features from "./pages/Features";
import VideoCalls from "./pages/VideoCalls";
import Automation from "./pages/Automation";
import Inventory from "./pages/Inventory";
import CRM from "./pages/CRM";
import { NotificationTestPage } from "./pages/NotificationTest";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { FeatureFlagsProvider } from "./contexts/FeatureFlags";
import { initSentry } from "@/integrations/monitoring/sentry";

const queryClient = new QueryClient();
initSentry({
  dsn: (import.meta as any)?.env?.VITE_SENTRY_DSN,
  environment: (import.meta as any)?.env?.MODE,
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoadingAuth } = useApp();
  
  console.log('🔐 ProtectedRoute check - User:', user ? `${user.email} (${user.role})` : 'Not authenticated', 'Loading:', isLoadingAuth);
  
  if (isLoadingAuth) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (!user) {
    console.log('🚪 Redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }
  
  console.log('✅ Access granted');
  return <>{children}</>;
};

const AppNotifications = () => {
  useAppNotifications();
  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider>
        <FinanceRealtimeProvider />
        <ThemeProvider defaultTheme="light">
        <AppProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <NotificationContainer />
              <NotificationIntegration />
              <AppNotifications />
              <BrowserRouter>
              <CommandPalette />
              <GlobalSearch />
              <KeyboardShortcuts />
              <TaskHotkeys />
              <AIAssistantAdvanced />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Tasks />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/wall" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Wall />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Calendar />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Projects />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/production" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Production />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/materials" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Materials />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/finance" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ErrorBoundary>
                        <Finance />
                      </ErrorBoundary>
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/procurement" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Procurement />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Clients />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/documents" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Documents />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/email" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Email />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/knowledge" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Knowledge />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Calendar />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Analytics />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Reports />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Admin />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/features" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Features />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/video-calls" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <VideoCalls />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/automation" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Automation />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Inventory />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/crm" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <CRM />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/notifications-test" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <NotificationTestPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/notification-settings" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <NotificationSettingsPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </NotificationProvider>
        </AppProvider>
        </ThemeProvider>
      </FeatureFlagsProvider>
    </QueryClientProvider>
  );
};

export default App;
