import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/components/LoginScreen";

// Layout
import { Layout } from "@/components/Layout";

// Lazy load all pages for code splitting with error handling
const DashboardPage = lazy(() => import("@/pages/DashboardPage").catch(() => ({ default: () => <div>Error loading Dashboard</div> })));
const CustomersPage = lazy(() => import("@/pages/CustomersPage").catch(() => ({ default: () => <div>Error loading Customers</div> })));
const CustomerDetailPage = lazy(() => import("@/pages/CustomerDetailPage").catch(() => ({ default: () => <div>Error loading Customer Detail</div> })));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage").catch(() => ({ default: () => <div>Error loading Projects</div> })));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage").catch(() => ({ default: () => <div>Error loading Project Detail</div> })));
const PlanningPage = lazy(() => import("@/pages/PlanningPage").catch(() => ({ default: () => <div>Error loading Planning</div> })));
const TimePage = lazy(() => import("@/pages/TimePage").catch(() => ({ default: () => <div>Error loading Time</div> })));
const ReceiptsPage = lazy(() => import("@/pages/ReceiptsPage").catch(() => ({ default: () => <div>Error loading Receipts</div> })));
const QuotesPage = lazy(() => import("@/pages/QuotesPage").catch(() => ({ default: () => <div>Error loading Quotes</div> })));
const InvoicesPage = lazy(() => import("@/pages/InvoicesPage").catch(() => ({ default: () => <div>Error loading Invoices</div> })));
const PersonnelPage = lazy(() => import("@/pages/PersonnelPage").catch(() => ({ default: () => <div>Error loading Personnel</div> })));
const UsersPage = lazy(() => import("@/pages/UsersPage").catch(() => ({ default: () => <div>Error loading Users</div> })));
const EmailPage = lazy(() => import("@/pages/EmailPage").catch(() => ({ default: () => <div>Error loading Email</div> })));
const WebmailPage = lazy(() => import("@/pages/WebmailPage").catch(() => ({ default: () => <div>Error loading Webmail</div> })));
const ChatPage = lazy(() => import("@/pages/ChatPage").catch(() => ({ default: () => <div>Error loading Chat</div> })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").catch(() => ({ default: () => <div>Error loading Settings</div> })));
const PublicQuote = lazy(() => import("@/pages/PublicQuote").catch(() => ({ default: () => <div>Error loading Public Quote</div> })));
const NotFound = lazy(() => import("@/pages/NotFound").catch(() => ({ default: () => <div>Error loading 404</div> })));
const NewQuote = lazy(() => import("@/pages/NewQuote").catch(() => ({ default: () => <div>Error loading New Quote</div> })));
const EditQuote = lazy(() => import("@/pages/EditQuote").catch(() => ({ default: () => <div>Error loading Edit Quote</div> })));
const NewInvoice = lazy(() => import("@/pages/NewInvoice").catch(() => ({ default: () => <div>Error loading New Invoice</div> })));
const EditInvoice = lazy(() => import("@/pages/EditInvoice").catch(() => ({ default: () => <div>Error loading Edit Invoice</div> })));
const QuotePreview = lazy(() => import("@/pages/QuotePreview").catch(() => ({ default: () => <div>Error loading Quote Preview</div> })));
const QuoteSend = lazy(() => import("@/pages/QuoteSend").catch(() => ({ default: () => <div>Error loading Quote Send</div> })));
const InvoiceDetailsPage = lazy(() => import("@/pages/InvoiceDetails").catch(() => ({ default: () => <div>Error loading Invoice Details</div> })));
const InvoiceSend = lazy(() => import("@/pages/InvoiceSend").catch(() => ({ default: () => <div>Error loading Invoice Send</div> })));
const ProjectDelivery = lazy(() => import("@/pages/ProjectDelivery").catch(() => ({ default: () => <div>Error loading Project Delivery</div> })));
const MobileDashboard = lazy(() => import("@/components/mobile/MobileDashboard").catch(() => ({ default: () => <div>Error loading Mobile Dashboard</div> })));
const MobileApp = lazy(() => import("@/components/mobile/MobileApp").then(m => ({ default: m.MobileApp })).catch(() => ({ default: () => <div>Error loading Mobile App</div> })));
import { useIsMobile } from "@/hooks/use-mobile";
import '@/utils/buttonDiagnostics'; // Button diagnostics for debugging

import { AuthProvider } from "@/contexts/AuthContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminSectionWrapper } from "@/components/AdminSectionWrapper";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false, // Voorkomt onnodige refetches en auth loops
      refetchOnMount: true,
      staleTime: 5 * 60 * 1000, // ✅ 5 minuten cache - voorkomt volledige herlaad bij refresh
      gcTime: 10 * 60 * 1000, // ✅ 10 minuten in memory - houdt data beschikbaar
    },
  },
});

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, profile, user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Show loading state ONLY while auth is actively loading
  // Once loading is complete, proceed to auth checks below
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticatie laden...</p>
        </div>
      </div>
    );
  }

  // Hard redirect only if explicitly not authenticated
  // Note: We removed the session check to allow optimistic rendering with cached auth
  if (!isAuthenticated || !user) {
    console.log('🔐 Not authenticated, redirecting to login');
    return <LoginScreen />;
  }

  // Show mobile interface for Installateurs (monteurs) on mobile devices
  if (isMobile && profile?.role === 'Installateur') {
    return <MobileApp />;
  }

  // Redirect monteurs from Dashboard to Projects
  // Monteurs should not see dashboard, they start directly with projects
  if (profile?.role === 'Installateur' && location.pathname === '/') {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes - NO AUTH REQUIRED */}
              <Route path="/quote/:token" element={<PublicQuote />} />
              <Route path="/404" element={<NotFound />} />
              
              {/* Protected routes with auth */}
              <Route path="/*" element={
                <AuthProvider>
                  <I18nProvider>
                    <TranslationProvider>
                      <Routes>
                        {/* Protected routes with Layout */}
                        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/customers" element={
                        <AdminSectionWrapper section="customers" title="Klanten">
                          <CustomersPage />
                        </AdminSectionWrapper>
                      } />
                      <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
                      <Route path="/projects" element={
                        <ErrorBoundary>
                          <AdminSectionWrapper section="projects" title="Projecten">
                            <ProjectsPage />
                          </AdminSectionWrapper>
                        </ErrorBoundary>
                      } />
                      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                      <Route path="/planning" element={
                        <AdminSectionWrapper section="planning" title="Planning">
                          <PlanningPage />
                        </AdminSectionWrapper>
                      } />
                      <Route path="/time" element={
                        <AdminSectionWrapper section="timeRegistration" title="Tijdregistratie">
                          <TimePage />
                        </AdminSectionWrapper>
                      } />
                      <Route path="/receipts" element={
                        <AdminSectionWrapper section="receipts" title="Bonnetjes">
                          <ReceiptsPage />
                        </AdminSectionWrapper>
                      } />
                      <Route path="/quotes" element={
                        <AdminSectionWrapper section="quotes" title="Offertes">
                          <QuotesPage />
                        </AdminSectionWrapper>
                      } />
                      <Route path="/invoices" element={<InvoicesPage />} />
                      <Route path="/personnel" element={
                        <AdminSectionWrapper section="personnel" title="Personeel">
                          <PersonnelPage />
                        </AdminSectionWrapper>
                      } />
                      <Route path="/users" element={
                        <AdminSectionWrapper section="users" title="Gebruikers">
                          <UsersPage />
                        </AdminSectionWrapper>
                      } />
                      <Route path="/email" element={
                        <AdminSectionWrapper section="email" title="Email">
                          <EmailPage />
                        </AdminSectionWrapper>
                      } />
                      <Route path="/webmail" element={<WebmailPage />} />
                      <Route path="/chat" element={
                        <AdminSectionWrapper section="chat" title="Chat">
                          <ChatPage />
                        </AdminSectionWrapper>
                      } />
                      <Route path="/settings" element={
                        <AdminSectionWrapper section="settings" title="Instellingen">
                          <SettingsPage />
                        </AdminSectionWrapper>
                      } />
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
                    </TranslationProvider>
                  </I18nProvider>
                </AuthProvider>
              } />
            </Routes>
            <Toaster />
            <Sonner />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;