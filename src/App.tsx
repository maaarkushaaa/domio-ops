import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AppProvider, useApp } from "./contexts/AppContext";
import { ThemeProvider } from "./components/ui/theme-provider";
import { CommandPalette } from "./components/common/CommandPalette";
import { GlobalSearch } from "./components/search/GlobalSearch";
import { KeyboardShortcuts } from "./components/shortcuts/KeyboardShortcuts";
import { AIAssistantAdvanced } from "./components/ai/AIAssistantAdvanced";
import { InteractiveTour } from "./components/onboarding/InteractiveTour";
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Production from "./pages/Production";
import Finance from "./pages/Finance";
import Procurement from "./pages/Procurement";
import Clients from "./pages/Clients";
import Documents from "./pages/Documents";
import Email from "./pages/Email";
import Knowledge from "./pages/Knowledge";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Features from "./pages/Features";
import VideoCalls from "./pages/VideoCalls";
import Automation from "./pages/Automation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useApp();
  
  console.log('🔐 ProtectedRoute check - User:', user ? 'Authenticated' : 'Not authenticated');
  
  if (!user) {
    console.log('🚪 Redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }
  
  console.log('✅ Access granted');
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CommandPalette />
              <GlobalSearch />
              <KeyboardShortcuts />
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
                <Route path="/production" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Production />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/finance" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Finance />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
