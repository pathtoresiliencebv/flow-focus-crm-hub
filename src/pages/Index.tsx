
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { Customers } from "@/components/Customers";
import { ProjectsBoard } from "@/components/ProjectsBoard";
import { PlanningManagement } from "@/components/PlanningManagement";
import { TimeRegistration } from "@/components/TimeRegistration";
import { Receipts } from "@/components/Receipts";
import { Quotes } from "@/components/Quotes";
import { Invoicing } from "@/components/Invoicing";
import { Email } from "@/components/Email";
import Personnel from "@/components/Personnel";
import UserManagement from "@/components/UserManagement";
import { Salary } from "@/components/Salary";
import { Reports } from "@/components/Reports";
import Settings from "@/pages/Settings";
import { useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/components/LoginScreen";
import { useParams, useNavigate } from "react-router-dom";
import CustomerDetail from "@/components/CustomerDetail";
import ProjectDetail from "@/components/ProjectDetail";
import { Permission } from "@/types/permissions";
import { ShieldAlert } from "lucide-react";
import { MobileDashboard } from "@/components/mobile/MobileDashboard";
import { MobileEnhancedChatView } from "@/components/mobile/MobileEnhancedChatView";
import { MobileBottomNavigation } from "@/components/mobile/MobileBottomNavigation";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { ChatWidget } from "@/components/ChatWidget";
import { useIsMobile } from "@/hooks/use-mobile";


const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-4">
    <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
    <h1 className="text-2xl font-bold">Geen toegang</h1>
    <p className="text-muted-foreground">U heeft niet de juiste rechten om deze pagina te bekijken.</p>
  </div>
);

const Index = () => {
  const { isAuthenticated, isLoading, hasPermission, profile } = useAuth();
  const { customerId, projectId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState(() => {
    if (customerId) return "customers";
    if (projectId) return "projects";
    return "dashboard";
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const handleSetActiveTab = (tab: string) => {
    if (customerId) navigate('/');
    if (projectId) navigate('/');
    setActiveTab(tab);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show mobile interface for mechanics on mobile devices
  if (isMobile && profile?.role === 'Installateur' && !customerId && !projectId) {
    return <MobileDashboard />;
  }
  
  const tabPermissions: Record<string, Permission | null> = {
    dashboard: null,
    customers: "customers_view",
    projects: "projects_view",
    calendar: "projects_view",
    time: "projects_view",
    receipts: "invoices_view",
    quotes: "invoices_view",
    invoicing: "invoices_view",
    email: null,
    personnel: "users_view",
    users: "users_view",
    salary: "users_view",
    reports: "reports_view",
    settings: "settings_edit",
  };

  const renderContent = () => {
    if (customerId && !projectId) {
      if (!hasPermission("customers_view")) return <AccessDenied />;
      return <CustomerDetail />;
    }
    if (projectId) {
      if (!hasPermission("projects_view")) return <AccessDenied />;
      return <ProjectDetail />;
    }

    const requiredPermission = tabPermissions[activeTab];
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return <AccessDenied />;
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "customers":
        return <Customers />;
      case "projects":
        return <ProjectsBoard />;
      case "calendar":
        return <PlanningManagement />;
      case "time":
        return <TimeRegistration />;
      case "receipts":
        return <Receipts />;
      case "quotes":
        return <Quotes />;
      case "invoicing":
        return <Invoicing />;
      case "email":
        return <Email />;
      case "chat":
        return <MobileEnhancedChatView onBack={() => setActiveTab("dashboard")} />;
      case "personnel":
        return <Personnel />;
      case "users":
        return <UserManagement />;
      case "salary":
        return <Salary />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        <MobileHeader 
          title={customerId ? "Klantdossier" : projectId ? "Project Details" : undefined}
          showBack={!!(customerId || projectId)}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        {/* Mobile Sidebar Overlay - Enhanced */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsSidebarOpen(false)}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div 
              className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-background shadow-2xl border-r border-border transform transition-transform duration-300"
              onClick={e => e.stopPropagation()}
              style={{ transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
            >
              <AppSidebar activeTab={activeTab} setActiveTab={(tab) => {
                handleSetActiveTab(tab);
                setIsSidebarOpen(false);
              }}>
                <div></div>
              </AppSidebar>
            </div>
          </div>
        )}
        
        {/* Main Content - Mobile optimized */}
        <div className="px-4 py-6 max-w-full overflow-x-hidden">
          {renderContent()}
        </div>
        <MobileBottomNavigation activeTab={activeTab} onTabChange={handleSetActiveTab} />
        <ChatWidget />
      </div>
    );
  }

  return (
    <AppSidebar activeTab={activeTab} setActiveTab={handleSetActiveTab}>
      {renderContent()}
      <ChatWidget />
    </AppSidebar>
  );
};

export default Index;
