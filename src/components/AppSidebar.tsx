import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
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
  LogOut,
  Bell,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsMenu } from "@/components/NotificationsMenu";

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "dashboard"
    },
    {
      label: "Klanten",
      href: "#",
      icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "customers"
    },
    {
      label: "Projecten",
      href: "#",
      icon: <FolderKanban className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "projects"
    },
    {
      label: "Planning",
      href: "#",
      icon: <Calendar className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "calendar"
    },
    {
      label: "Tijdregistratie",
      href: "#",
      icon: <Clock className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "time"
    },
    {
      label: "Bonnetjes",
      href: "#",
      icon: <Receipt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "receipts"
    },
    {
      label: "Offertes",
      href: "#",
      icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "quotes"
    },
    {
      label: "Facturatie",
      href: "#",
      icon: <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "invoicing"
    },
    {
      label: "Personeel",
      href: "#",
      icon: <UserCheck className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "personnel"
    },
    {
      label: "Gebruikers",
      href: "#",
      icon: <Shield className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "users"
    },
    {
      label: "Salaris",
      href: "#",
      icon: <DollarSign className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "salary"
    },
    {
      label: "Rapportages",
      href: "#",
      icon: <BarChart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "reports"
    },
    {
      label: "Instellingen",
      href: "#",
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      key: "settings"
    }
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink
                key={idx}
                link={link}
                className={cn(
                  "hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md px-2",
                  activeTab === link.key && "bg-smans-primary/10 text-smans-primary"
                )}
                onClick={() => setActiveTab(link.key)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center">
            <NotificationsMenu />
          </div>
          <SidebarLink
            link={{
              label: "Uitloggen",
              href: "#",
              icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            }}
            className="hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md px-2 text-red-600"
            onClick={logout}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
      <img 
        src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
        alt="SMANS Logo" 
        className="h-8 w-auto flex-shrink-0"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-smans-primary whitespace-pre"
      >
        SMANS CRM
      </motion.span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
      <img 
        src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
        alt="SMANS Logo" 
        className="h-8 w-auto flex-shrink-0"
      />
    </div>
  );
};
