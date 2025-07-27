
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
import { useAuth } from "@/hooks/useAuth";
import { Permission } from "@/types/permissions";
import { NotificationCenter } from "./NotificationCenter";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export function AppSidebar({ activeTab, setActiveTab, children }: AppSidebarProps) {
  const { user, logout, profile, hasPermission } = useAuth();
  
  // Only use chat unread count if user has chat access
  const shouldUseChatCount = ['Administrator', 'Administratie', 'Installateur'].includes(profile?.role || '');
  const { totalUnreadCount } = shouldUseChatCount ? useChatUnreadCount() : { totalUnreadCount: 0 };

  const allLinks: {label: string, icon: React.ReactElement, key: string, permission: Permission | null, badge?: number}[] = [
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
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
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

  const links = allLinks.filter(link => {
    // Hide Reports completely for Installateurs
    if (link.key === "reports" && profile?.role === 'Installateur') {
      return false;
    }
    // Show Chat only for Administrator, Administratie, and Installateur
    if (link.key === "chat" && !['Administrator', 'Administratie', 'Installateur'].includes(profile?.role || '')) {
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
