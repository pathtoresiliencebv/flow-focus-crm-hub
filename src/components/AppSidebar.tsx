
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  children: React.ReactNode;
}

export function AppSidebar({ children }: AppSidebarProps) {
  const { user, logout, profile, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Main navigation links with React Router paths
  const mainLinks: {label: string, icon: React.ReactElement, path: string, permission: Permission | null}[] = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/",
      permission: null,
    },
    {
      label: "Klanten",
      icon: <Users className="h-5 w-5" />,
      path: "/customers",
      permission: "customers_view",
    },
    {
      label: "Projecten",
      icon: <FolderKanban className="h-5 w-5" />,
      path: "/projects",
      permission: "projects_view",
    },
    {
      label: "Planning",
      icon: <Calendar className="h-5 w-5" />,
      path: "/planning",
      permission: "planning_create",
    },
    {
      label: "Offertes",
      icon: <FileText className="h-5 w-5" />,
      path: "/quotes",
      permission: "invoices_view",
    },
    {
      label: "Facturatie",
      icon: <CreditCard className="h-5 w-5" />,
      path: "/invoices",
      permission: "invoices_view",
    },
  ];

  // Communication links
  const communicationLinks: {label: string, icon: React.ReactElement, path: string, permission: Permission | null}[] = [
    {
      label: "Postvak IN",
      icon: <Mail className="h-5 w-5" />,
      path: "/email",
      permission: null, // Everyone can access email
    },
    {
      label: "Webmail",
      icon: <Mail className="h-5 w-5" />,
      path: "/webmail",
      permission: null, // Everyone can access webmail
    },
    {
      label: "Chat",
      icon: <MessageCircle className="h-5 w-5" />,
      path: "/chat",
      permission: null,
    },
  ];

  // Personnel links (Personeel section)
  const personnelLinks: {label: string, icon: React.ReactElement, path: string, permission: Permission | null}[] = [
    {
      label: "Tijdregistratie",
      icon: <Clock className="h-5 w-5" />,
      path: "/time",
      permission: "projects_view",
    },
    {
      label: "Bonnetjes",
      icon: <Receipt className="h-5 w-5" />,
      path: "/receipts",
      // 🔧 Changed from invoices_view to projects_view so Installateurs CAN upload receipts!
      permission: "projects_view",
    },
    {
      label: "Personeel",
      icon: <UserCheck className="h-5 w-5" />,
      path: "/personnel",
      permission: "users_view",
    },
  ];

  // Settings submenu links
  const settingsLinks: {label: string, icon: React.ReactElement, path: string, permission: Permission | null}[] = [
    {
      label: "Rapportages",
      icon: <BarChart className="h-5 w-5" />,
      path: "/reports",
      permission: "reports_view",
    },
    {
      label: "Instellingen",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings",
      permission: "settings_edit",
    }
  ];

  // Filter links based on permissions and role
  const filteredMainLinks = mainLinks.filter(link => {
    // Hide Dashboard for Installateurs (monteurs)
    if (link.path === "/" && profile?.role === 'Installateur') {
      return false;
    }
    return link.permission === null || hasPermission(link.permission as Permission);
  });

  const filteredCommunicationLinks = communicationLinks.filter(link => {
    return link.permission === null || hasPermission(link.permission as Permission);
  });

  const filteredPersonnelLinks = personnelLinks.filter(link => {
    return link.permission === null || hasPermission(link.permission as Permission);
  });

  const filteredSettingsLinks = settingsLinks.filter(link => {
    // Hide Reports completely for Installateurs
    if (link.path === "/reports" && profile?.role === 'Installateur') {
      return false;
    }
    return link.permission === null || hasPermission(link.permission as Permission);
  });

  // Combine all links for the Sidebar component
  const allLinks = [...filteredMainLinks, ...filteredCommunicationLinks, ...filteredPersonnelLinks, ...filteredSettingsLinks];

  // Convert to the format expected by Sidebar component
  const links = allLinks.map(link => ({
    label: link.label,
    icon: link.icon,
    key: link.path,
    permission: link.permission
  }));

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Sidebar 
      activeTab={location.pathname}
      setActiveTab={handleNavigation}
    >
      {children}
    </Sidebar>
  );
}
