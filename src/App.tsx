import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GiftTracker from "./components/GiftTracker";
import Summary from "./components/Summary";
import Settings from "./components/Settings";
import NotFound from "./pages/NotFound";
import TopNavigation from "./components/TopNavigation";
import { DataProvider } from "./components/providers/DataProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-subtle">
            <TopNavigation />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Summary />} />
                <Route path="/gifts" element={<GiftTracker />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
