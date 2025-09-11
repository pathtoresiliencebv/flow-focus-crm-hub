import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import PublicQuote from "@/pages/PublicQuote";
import NotFound from "@/pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import { TranslationProvider } from "@/contexts/TranslationContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TranslationProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/customers/:customerId" element={<Index />} />
                <Route path="/projects/:projectId" element={<Index />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/quote/:token" element={<PublicQuote />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TranslationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;