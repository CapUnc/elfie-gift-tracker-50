import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import GiftTracker from "./components/GiftTracker";
import Summary from "./components/Summary";
import Settings from "./components/Settings";
import RecipientsManager from "./components/settings/RecipientsManager";
import ProfileManager from "./components/settings/ProfileManager";
import HouseholdManager from "./components/settings/HouseholdManager";
import Welcome from "./components/Welcome";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";
import JoinHousehold from "./components/JoinHousehold";
import { AuthProvider } from "./contexts/AuthContext";
import { HouseholdProvider } from "./contexts/HouseholdContext";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <HouseholdProvider>
              <div className="min-h-screen bg-gradient-subtle">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  {/* Routes with TopNavigation */}
                  <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<Summary />} />
                    <Route path="/gifts" element={<GiftTracker />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/recipients" element={<RecipientsManager />} />
                    <Route path="/settings/buyers" element={<ProfileManager />} />
                    <Route path="/settings/household" element={<HouseholdManager />} />
                  </Route>
                  {/* Routes without TopNavigation */}
                  <Route
                    path="/welcome"
                    element={
                      <ProtectedRoute>
                        <Welcome />
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </HouseholdProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
