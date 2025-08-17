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
import BuyersManager from "./components/settings/BuyersManager";
import NotFound from "./pages/NotFound";
import TopNavigation from "./components/TopNavigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-subtle">
          <TopNavigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Summary />} />
              <Route path="/gifts" element={<GiftTracker />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/recipients" element={<RecipientsManager />} />
              <Route path="/settings/buyers" element={<BuyersManager />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
