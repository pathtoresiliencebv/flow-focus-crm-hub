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


const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { customerId, projectId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    if (customerId) return "customers";
    if (projectId) return "projects";
    return "dashboard";
  });
  
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

  const renderContent = () => {
    if (customerId && !projectId) return <CustomerDetail />;
    if (projectId) return <ProjectDetail />;

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

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar activeTab={activeTab} setActiveTab={handleSetActiveTab}>
        <div>
          {renderContent()}
        </div>
      </AppSidebar>
    </div>
  );
};

export default Index;
