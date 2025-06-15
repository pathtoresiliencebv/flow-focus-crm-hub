
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
  Shield,
  DollarSign,
  BarChart,
  Settings,
  Mail
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const { user, logout, profile } = useAuth();

  const links = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      key: "dashboard"
    },
    {
      label: "Klanten",
      icon: <Users className="h-5 w-5" />,
      key: "customers"
    },
    {
      label: "Projecten",
      icon: <FolderKanban className="h-5 w-5" />,
      key: "projects"
    },
    {
      label: "Planning",
      icon: <Calendar className="h-5 w-5" />,
      key: "calendar"
    },
    {
      label: "Tijdregistratie",
      icon: <Clock className="h-5 w-5" />,
      key: "time"
    },
    {
      label: "Bonnetjes",
      icon: <Receipt className="h-5 w-5" />,
      key: "receipts"
    },
    {
      label: "Offertes",
      icon: <FileText className="h-5 w-5" />,
      key: "quotes"
    },
    {
      label: "Facturatie",
      icon: <CreditCard className="h-5 w-5" />,
      key: "invoicing"
    },
    {
      label: "Postvak IN",
      icon: <Mail className="h-5 w-5" />,
      key: "email"
    },
    {
      label: "Personeel",
      icon: <UserCheck className="h-5 w-5" />,
      key: "personnel"
    },
    {
      label: "Gebruikers",
      icon: <Shield className="h-5 w-5" />,
      key: "users"
    },
    {
      label: "Salaris",
      icon: <DollarSign className="h-5 w-5" />,
      key: "salary"
    },
    {
      label: "Rapportages",
      icon: <BarChart className="h-5 w-5" />,
      key: "reports"
    },
    {
      label: "Instellingen",
      icon: <Settings className="h-5 w-5" />,
      key: "settings"
    }
  ];

  return (
    <Sidebar 
      links={links}
      user={user}
      profile={profile}
      logout={logout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}
