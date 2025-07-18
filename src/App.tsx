
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import PublicQuote from "@/pages/PublicQuote";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/customers/:customerId" element={<Index />} />
            <Route path="/projects/:projectId" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/quote/:token" element={<PublicQuote />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
