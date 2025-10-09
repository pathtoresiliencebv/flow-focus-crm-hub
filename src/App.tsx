import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/components/LoginScreen";

// Layout
import { Layout } from "@/components/Layout";

// Lazy load all pages for code splitting
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const CustomersPage = lazy(() => import("@/pages/CustomersPage"));
const CustomerDetailPage = lazy(() => import("@/pages/CustomerDetailPage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage"));
const PlanningPage = lazy(() => import("@/pages/PlanningPage"));
const TimePage = lazy(() => import("@/pages/TimePage"));
const ReceiptsPage = lazy(() => import("@/pages/ReceiptsPage"));
const QuotesPage = lazy(() => import("@/pages/QuotesPage"));
const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));
const PersonnelPage = lazy(() => import("@/pages/PersonnelPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const EmailPage = lazy(() => import("@/pages/EmailPage"));
const WebmailPage = lazy(() => import("@/pages/WebmailPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const PublicQuote = lazy(() => import("@/pages/PublicQuote"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const NewQuote = lazy(() => import("@/pages/NewQuote"));
const EditQuote = lazy(() => import("@/pages/EditQuote"));
const NewInvoice = lazy(() => import("@/pages/NewInvoice"));
const EditInvoice = lazy(() => import("@/pages/EditInvoice"));
const QuotePreview = lazy(() => import("@/pages/QuotePreview"));
const QuoteSend = lazy(() => import("@/pages/QuoteSend"));
const InvoiceDetailsPage = lazy(() => import("@/pages/InvoiceDetails"));
const InvoiceSend = lazy(() => import("@/pages/InvoiceSend"));
const ProjectDelivery = lazy(() => import("@/pages/ProjectDelivery"));
const MobileDashboard = lazy(() => import("@/components/mobile/MobileDashboard"));
import { useIsMobile } from "@/hooks/use-mobile";
import '@/utils/buttonDiagnostics'; // Button diagnostics for debugging

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
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticatie controleren...</p>
        </div>
      </div>
    );
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
                      <Route path="/webmail" element={<WebmailPage />} />
                      <Route path="/chat" element={<ChatPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Route>

                    {/* Other protected routes without Layout */}
                    <Route path="/projects/:projectId/delivery" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><ProjectDelivery /></Suspense></ProtectedRoute>} />
                    <Route path="/quotes/new" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><NewQuote /></Suspense></ProtectedRoute>} />
                    <Route path="/quotes/:id/edit" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><EditQuote /></Suspense></ProtectedRoute>} />
                    <Route path="/quotes/:quoteId/preview" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><QuotePreview /></Suspense></ProtectedRoute>} />
                    <Route path="/quotes/:quoteId/send" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><QuoteSend /></Suspense></ProtectedRoute>} />
                    <Route path="/invoices/new" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><NewInvoice /></Suspense></ProtectedRoute>} />
                    <Route path="/invoices/:id" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><InvoiceDetailsPage /></Suspense></ProtectedRoute>} />
                    <Route path="/invoices/:id/edit" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><EditInvoice /></Suspense></ProtectedRoute>} />
                    <Route path="/invoices/:invoiceId/details" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><InvoiceDetailsPage /></Suspense></ProtectedRoute>} />
                    <Route path="/invoices/:invoiceId/send" element={<ProtectedRoute><Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><InvoiceSend /></Suspense></ProtectedRoute>} />
                    
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