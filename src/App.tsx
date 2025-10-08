import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/components/LoginScreen";

// Layout
import { Layout } from "@/components/Layout";

// Pages
import DashboardPage from "@/pages/DashboardPage";
import CustomersPage from "@/pages/CustomersPage";
import CustomerDetailPage from "@/pages/CustomerDetailPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import PlanningPage from "@/pages/PlanningPage";
import TimePage from "@/pages/TimePage";
import ReceiptsPage from "@/pages/ReceiptsPage";
import QuotesPage from "@/pages/QuotesPage";
import InvoicesPage from "@/pages/InvoicesPage";
import PersonnelPage from "@/pages/PersonnelPage";
import UsersPage from "@/pages/UsersPage";
import EmailPage from "@/pages/EmailPage";
import ChatPage from "@/pages/ChatPage";
import SettingsPage from "@/pages/SettingsPage";
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
import { ProjectDelivery } from "@/pages/ProjectDelivery";
import { MobileDashboard } from "@/components/mobile/MobileDashboard";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const isMobile = useIsMobile();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show mobile interface for mechanics on mobile devices
  if (isMobile && profile?.role === 'Installateur') {
    return <MobileDashboard />;
  }

  return <>{children}</>;
}

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
                    {/* Public routes */}
                    <Route path="/quote/:token" element={<PublicQuote />} />
                    
                    {/* Protected routes with Layout */}
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/customers" element={<CustomersPage />} />
                      <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                      <Route path="/planning" element={<PlanningPage />} />
                      <Route path="/time" element={<TimePage />} />
                      <Route path="/receipts" element={<ReceiptsPage />} />
                      <Route path="/quotes" element={<QuotesPage />} />
                      <Route path="/invoices" element={<InvoicesPage />} />
                      <Route path="/personnel" element={<PersonnelPage />} />
                      <Route path="/users" element={<UsersPage />} />
                      <Route path="/email" element={<EmailPage />} />
                      <Route path="/chat" element={<ChatPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Route>

                    {/* Other protected routes without Layout */}
                    <Route path="/projects/:projectId/delivery" element={<ProtectedRoute><ProjectDelivery /></ProtectedRoute>} />
                    <Route path="/quotes/new" element={<ProtectedRoute><NewQuote /></ProtectedRoute>} />
                    <Route path="/quotes/:id/edit" element={<ProtectedRoute><EditQuote /></ProtectedRoute>} />
                    <Route path="/quotes/:quoteId/preview" element={<ProtectedRoute><QuotePreview /></ProtectedRoute>} />
                    <Route path="/quotes/:quoteId/send" element={<ProtectedRoute><QuoteSend /></ProtectedRoute>} />
                    <Route path="/invoices/new" element={<ProtectedRoute><NewInvoice /></ProtectedRoute>} />
                    <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetailsPage /></ProtectedRoute>} />
                    <Route path="/invoices/:id/edit" element={<ProtectedRoute><EditInvoice /></ProtectedRoute>} />
                    <Route path="/invoices/:invoiceId/details" element={<ProtectedRoute><InvoiceDetailsPage /></ProtectedRoute>} />
                    <Route path="/invoices/:invoiceId/send" element={<ProtectedRoute><InvoiceSend /></ProtectedRoute>} />
                    
                    {/* 404 */}
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