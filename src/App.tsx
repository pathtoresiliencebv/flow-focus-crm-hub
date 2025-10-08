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
                      <Route path="/" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><DashboardPage /></Suspense>} />
                      <Route path="/customers" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><CustomersPage /></Suspense>} />
                      <Route path="/customers/:customerId" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><CustomerDetailPage /></Suspense>} />
                      <Route path="/projects" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><ProjectsPage /></Suspense>} />
                      <Route path="/projects/:projectId" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><ProjectDetailPage /></Suspense>} />
                      <Route path="/planning" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><PlanningPage /></Suspense>} />
                      <Route path="/time" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><TimePage /></Suspense>} />
                      <Route path="/receipts" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><ReceiptsPage /></Suspense>} />
                      <Route path="/quotes" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><QuotesPage /></Suspense>} />
                      <Route path="/invoices" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><InvoicesPage /></Suspense>} />
                      <Route path="/personnel" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><PersonnelPage /></Suspense>} />
                      <Route path="/users" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><UsersPage /></Suspense>} />
                      <Route path="/email" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><EmailPage /></Suspense>} />
                      <Route path="/chat" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><ChatPage /></Suspense>} />
                      <Route path="/settings" element={<Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}><SettingsPage /></Suspense>} />
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