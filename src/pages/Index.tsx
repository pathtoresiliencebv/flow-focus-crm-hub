
import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import CustomerDetail from "@/components/CustomerDetail";
import ProjectDetail from "@/components/ProjectDetail";
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const renderContent = () => {
    // Note: CustomerDetail and ProjectDetail components use React Router
    // for navigation and get their IDs from URL params, not props
    if (selectedCustomerId) {
      return <CustomerDetail />;
    }
    
    if (selectedProjectId) {
      return <ProjectDetail />;
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "customers":
        return <ProjectsBoard />;
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
