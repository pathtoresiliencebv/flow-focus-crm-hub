
import React from "react";
import { Sidebar } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  Clock,
  Receipt,
  FileText,
  CreditCard,
  UserCheck,
  BarChart,
  Settings,
  Mail,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Permission } from "@/types/permissions";
import { NotificationCenter } from "./NotificationCenter";

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export function AppSidebar({ activeTab, setActiveTab, children }: AppSidebarProps) {
  const { user, logout, profile, hasPermission } = useAuth();

  const allLinks: {label: string, icon: React.ReactElement, key: string, permission: Permission | null}[] = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      key: "dashboard",
      permission: null,
    },
    {
      label: "Klanten",
      icon: <Users className="h-5 w-5" />,
      key: "customers",
      permission: "customers_view",
    },
    {
      label: "Projecten",
      icon: <FolderKanban className="h-5 w-5" />,
      key: "projects",
      permission: "projects_view",
    },
    {
      label: "Klanten & Projecten",
      icon: <Users className="h-5 w-5" />,
      key: "customers-projects",
      permission: "customers_view",
    },
    {
      label: "Planning",
      icon: <Calendar className="h-5 w-5" />,
      key: "calendar",
      permission: "planning_create",
    },
    {
      label: "Tijdregistratie",
      icon: <Clock className="h-5 w-5" />,
      key: "time",
      permission: "projects_view",
    },
    {
      label: "Bonnetjes",
      icon: <Receipt className="h-5 w-5" />,
      key: "receipts",
      permission: "invoices_view",
    },
    {
      label: "Offertes",
      icon: <FileText className="h-5 w-5" />,
      key: "quotes",
      permission: "invoices_view",
    },
    {
      label: "Facturatie",
      icon: <CreditCard className="h-5 w-5" />,
      key: "invoicing",
      permission: "invoices_view",
    },
    {
      label: "Postvak IN",
      icon: <Mail className="h-5 w-5" />,
      key: "email",
      permission: null,
    },
    {
      label: "Chat",
      icon: <MessageCircle className="h-5 w-5" />,
      key: "chat",
      permission: null,
    },
    {
      label: "Personeel",
      icon: <UserCheck className="h-5 w-5" />,
      key: "personnel",
      permission: "users_view",
    },
    {
      label: "Rapportages",
      icon: <BarChart className="h-5 w-5" />,
      key: "reports",
      permission: "reports_view",
    },
    {
      label: "Instellingen",
      icon: <Settings className="h-5 w-5" />,
      key: "settings",
      permission: "settings_edit",
    }
  ];

  // Filter links based on permissions and role
  const links = allLinks.filter(link => {
    // Chat is available for all authenticated users now
    // Hide Reports completely for Installateurs
    if (link.key === "reports" && profile?.role === 'Installateur') {
      return false;
    }
    return link.permission === null || hasPermission(link.permission as Permission);
  });


  return (
    <Sidebar 
      links={links}
      user={user}
      profile={profile}
      logout={logout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {children}
    </Sidebar>
  );
}
