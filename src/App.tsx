import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import PublicQuote from "@/pages/PublicQuote";
import NotFound from "@/pages/NotFound";
import { NewQuote } from "@/pages/NewQuote";
import { EditQuote } from "@/pages/EditQuote";
import { NewInvoice } from "@/pages/NewInvoice";
import { EditInvoice } from "@/pages/EditInvoice";
import { QuotePreview } from "@/pages/QuotePreview";
import { QuoteSend } from "@/pages/QuoteSend";
import { InvoiceDetailsPage } from "@/pages/InvoiceDetails";
import { InvoiceSend } from "@/pages/InvoiceSend";
import { CalendarPage } from "@/components/calendar/CalendarPage";
import { GmailCallbackHandler } from "@/components/email/GmailCallbackHandler";
import { ProjectDelivery } from "@/pages/ProjectDelivery";
import { AuthProvider } from "@/contexts/AuthContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nProvider>
            <TranslationProvider>
              <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/customers/:customerId" element={<Index />} />
                  <Route path="/projects/:projectId" element={<Index />} />
                  <Route path="/projects/:projectId/delivery" element={<ProjectDelivery />} />
                  <Route path="/customers-projects" element={<Index />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/quotes" element={<Index />} />
                  <Route path="/quotes/new" element={<NewQuote />} />
                  <Route path="/invoices" element={<Index />} />
                  <Route path="/invoices/new" element={<NewInvoice />} />
                  <Route path="/quotes/:id/edit" element={<EditQuote />} />
                  <Route path="/quotes/:quoteId/preview" element={<QuotePreview />} />
                  <Route path="/quotes/:quoteId/send" element={<QuoteSend />} />
                  <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
                  <Route path="/invoices/:id/edit" element={<EditInvoice />} />
                  <Route path="/invoices/:invoiceId/details" element={<InvoiceDetailsPage />} />
                  <Route path="/invoices/:invoiceId/send" element={<InvoiceSend />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/quote/:token" element={<PublicQuote />} />
                  <Route path="/api/auth/gmail/callback" element={<GmailCallbackHandler />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
                <Sonner />
              </div>
              </BrowserRouter>
            </TranslationProvider>
          </I18nProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;