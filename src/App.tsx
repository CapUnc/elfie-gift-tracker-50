import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GiftTracker from "./components/GiftTracker";
import Summary from "./components/Summary";
import Settings from "./components/Settings";
import RecipientsManager from "./components/settings/RecipientsManager";
import ProfileManager from "./components/settings/ProfileManager";
import HouseholdManager from "./components/settings/HouseholdManager";
import GiversPage from "./pages/GiversPage";
import TemplatesPage from "./pages/TemplatesPage";
import Welcome from "./components/Welcome";
import NotFound from "./pages/NotFound";
import TopNavigation from "./components/TopNavigation";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import JoinHousehold from "./components/JoinHousehold";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-subtle">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TopNavigation />
                  <Summary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gifts"
              element={
                <ProtectedRoute>
                  <TopNavigation />
                  <GiftTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <TopNavigation />
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/recipients"
              element={
                <ProtectedRoute>
                  <TopNavigation />
                  <RecipientsManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/profile"
              element={
                <ProtectedRoute>
                  <TopNavigation />
                  <ProfileManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/welcome"
              element={
                <ProtectedRoute>
                  <Welcome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/household"
              element={
                <ProtectedRoute>
                  <TopNavigation />
                  <HouseholdManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/givers"
              element={
                <ProtectedRoute>
                  <TopNavigation />
                  <GiversPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/templates"
              element={
                <ProtectedRoute>
                  <TopNavigation />
                  <TemplatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join-household"
              element={
                <ProtectedRoute>
                  <JoinHousehold />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
