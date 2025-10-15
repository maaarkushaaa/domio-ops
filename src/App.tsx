import { lazy, Suspense } from "react";
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
import { NotificationContainer } from "./components/ui/NotificationContainer";
import { NotificationIntegration } from "./components/NotificationIntegration";
import { FinanceRealtimeProvider } from "./providers/FinanceRealtimeProvider";
import { useAppNotifications } from "./hooks/use-app-notifications";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { FeatureFlagsProvider } from "./contexts/FeatureFlags";
import { initSentry } from "@/integrations/monitoring/sentry";
import { Loader2 } from "lucide-react";

// Lazy load страниц для оптимизации
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Projects = lazy(() => import("./pages/Projects"));
const Production = lazy(() => import("./pages/Production"));
const Materials = lazy(() => import("./pages/Materials"));
const Finance = lazy(() => import("./pages/Finance"));
const Procurement = lazy(() => import("./pages/Procurement"));
const Clients = lazy(() => import("./pages/Clients"));
const Documents = lazy(() => import("./pages/Documents"));
const Email = lazy(() => import("./pages/Email"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Wall = lazy(() => import("./pages/Wall"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const VideoCalls = lazy(() => import("./pages/VideoCalls"));
const Automation = lazy(() => import("./pages/Automation"));
const CRM = lazy(() => import("./pages/CRM"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Security = lazy(() => import("./pages/Security"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettings"));
const NotificationTestPage = lazy(() => import("./pages/NotificationTest"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Оптимизированный QueryClient с кешированием
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      cacheTime: 10 * 60 * 1000, // 10 минут
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

initSentry({
  dsn: (import.meta as any)?.env?.VITE_SENTRY_DSN,
  environment: (import.meta as any)?.env?.MODE || 'development',
  enabled: (import.meta as any)?.env?.PROD,
});

// Компонент загрузки
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}

// Обёртка для lazy-loaded страниц
function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppNotifications() {
  useAppNotifications();
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="domio-theme">
          <TooltipProvider>
            <AppProvider>
              <NotificationProvider>
                <FeatureFlagsProvider>
                  <FinanceRealtimeProvider>
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
                      <Routes>
                        <Route path="/auth" element={
                          <LazyPage>
                            <Auth />
                          </LazyPage>
                        } />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Dashboard />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/tasks" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Tasks />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/projects" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Projects />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/production" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Production />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/materials" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Materials />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/finance" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Finance />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/procurement" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Procurement />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/clients" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Clients />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/documents" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Documents />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/email" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Email />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/knowledge" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Knowledge />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/calendar" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <ErrorBoundary>
                                <LazyPage>
                                  <Calendar />
                                </LazyPage>
                              </ErrorBoundary>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/wall" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Wall />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/analytics" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Analytics />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/reports" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Reports />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Settings />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/video-calls" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <VideoCalls />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/automation" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Automation />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/crm" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <CRM />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/integrations" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Integrations />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/security" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Security />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/notification-settings" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <NotificationSettingsPage />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <Admin />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/notification-test" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <LazyPage>
                                <NotificationTestPage />
                              </LazyPage>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="*" element={
                          <LazyPage>
                            <NotFound />
                          </LazyPage>
                        } />
                      </Routes>
                    </BrowserRouter>
                  </FinanceRealtimeProvider>
                </FeatureFlagsProvider>
              </NotificationProvider>
            </AppProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
