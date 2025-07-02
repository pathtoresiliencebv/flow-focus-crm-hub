
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PWAPrompt } from "@/components/PWAPrompt";
import Index from "./pages/Index";
import CustomerDetail from "./components/CustomerDetail";
import ProjectDetail from "./components/ProjectDetail";

const PublicQuote = lazy(() => import("./pages/PublicQuote"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PWAPrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/customers/:customerId" element={<Index />} />
            <Route path="/projects/:projectId" element={<Index />} />
            <Route 
              path="/quote/:token" 
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <PublicQuote />
                </Suspense>
              } 
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
