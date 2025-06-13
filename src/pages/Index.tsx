
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/components/LoginScreen";
import { Dashboard } from "@/components/Dashboard";
import CustomerDetail from "@/components/CustomerDetail";
import ProjectDetail from "@/components/ProjectDetail";
import { Customers } from "@/components/Customers";
import { ProjectsBoard } from "@/components/ProjectsBoard";
import { PlanningManagement } from "@/components/PlanningManagement";
import { TimeRegistration } from "@/components/TimeRegistration";
import { Receipts } from "@/components/Receipts";
import { Quotes } from "@/components/Quotes";
import { Invoicing } from "@/components/Invoicing";
import Personnel from "@/components/Personnel";
import { Users } from "@/components/Users";
import { Salary } from "@/components/Salary";
import { Reports } from "@/components/Reports";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { customerId, projectId } = useParams();
  const isMobile = useIsMobile();
  const { user, login, isLoading } = useAuth();

  // Update active tab based on URL params
  useEffect(() => {
    if (customerId) {
      setActiveTab("customers");
    } else if (projectId) {
      setActiveTab("projects");
    }
  }, [customerId, projectId]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
            alt="SMANS Logo" 
            className="mx-auto h-12 w-auto mb-4"
          />
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  const renderContent = () => {
    // Show customer detail if customerId is in URL
    if (customerId) {
      return <CustomerDetail />;
    }
    
    // Show project detail if projectId is in URL
    if (projectId) {
      return <ProjectDetail />;
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
      case "personnel":
        return <Personnel />;
      case "users":
        return <Users />;
      case "salary":
        return <Salary />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-lg font-semibold">SMANS CRM</h1>
          </header>
          
          <main className="flex-1 overflow-hidden">
            <div className={`h-full ${isMobile ? 'p-2' : 'p-6'} overflow-y-auto`}>
              {renderContent()}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
