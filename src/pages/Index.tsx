
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
import { Email } from "@/components/Email";
import Settings from "@/pages/Settings";
import { AppSidebar } from "@/components/AppSidebar";
import { ResizableChatWidget } from "@/components/ResizableChatWidget";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { customerId, projectId } = useParams();
  const { user, login, isLoading } = useAuth();
  const isMobile = useIsMobile();

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
      case "email":
        return <Email />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className={`h-full ${isMobile ? 'p-2' : 'p-6'}`}>
          {renderContent()}
        </div>
      </AppSidebar>
      <ResizableChatWidget />
    </>
  );
};

export default Index;
