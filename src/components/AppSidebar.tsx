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
  Settings,
  Mail,
  Inbox,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsMenu } from "@/components/NotificationsMenu";

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface MenuGroup {
  label: string;
  items: {
    label: string;
    key: string;
    icon: React.JSX.Element;
  }[];
}

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['dashboard', 'crm', 'postvak']);

  const menuGroups: MenuGroup[] = [
    {
      label: "Dashboard",
      items: [
        {
          label: "Dashboard",
          key: "dashboard",
          icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        }
      ]
    },
    {
      label: "CRM",
      items: [
        {
          label: "Klanten",
          key: "customers",
          icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
          label: "Projecten",
          key: "projects",
          icon: <FolderKanban className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        }
      ]
    },
    {
      label: "Planning & Tijd",
      items: [
        {
          label: "Planning",
          key: "calendar",
          icon: <Calendar className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
          label: "Tijdregistratie",
          key: "time",
          icon: <Clock className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        }
      ]
    },
    {
      label: "Postvak IN",
      items: [
        {
          label: "Inbox/Mail",
          key: "inbox",
          icon: <Inbox className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        }
      ]
    },
    {
      label: "Financieel",
      items: [
        {
          label: "Bonnetjes",
          key: "receipts",
          icon: <Receipt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
          label: "Offertes",
          key: "quotes",
          icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
          label: "Facturatie",
          key: "invoicing",
          icon: <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        }
      ]
    },
    {
      label: "Personeel & Gebruikers",
      items: [
        {
          label: "Personeel",
          key: "personnel",
          icon: <UserCheck className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
          label: "Gebruikers",
          key: "users",
          icon: <Shield className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
          label: "Salaris",
          key: "salary",
          icon: <DollarSign className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        }
      ]
    },
    {
      label: "Rapportages & Instellingen",
      items: [
        {
          label: "Rapportages",
          key: "reports",
          icon: <BarChart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
          label: "Instellingen",
          key: "settings",
          icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        }
      ]
    }
  ];

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {menuGroups.map((group) => (
              <div key={group.label} className="mb-2">
                <div
                  className="flex items-center justify-between px-2 py-1 text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300"
                  onClick={() => toggleGroup(group.label)}
                >
                  <span className={cn(!open && "hidden")}>{group.label}</span>
                  {open && (
                    expandedGroups.includes(group.label) 
                      ? <ChevronDown className="h-3 w-3" />
                      : <ChevronRight className="h-3 w-3" />
                  )}
                </div>
                <AnimatePresence>
                  {(expandedGroups.includes(group.label) || !open) && (
                    <motion.div
                      initial={open ? { height: 0, opacity: 0 } : false}
                      animate={open ? { height: "auto", opacity: 1 } : {}}
                      exit={open ? { height: 0, opacity: 0 } : {}}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {group.items.map((item) => (
                        <SidebarLink
                          key={item.key}
                          link={{
                            label: item.label,
                            href: "#",
                            icon: item.icon
                          }}
                          className={cn(
                            "hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md px-2 ml-2",
                            activeTab === item.key && "bg-smans-primary/10 text-smans-primary"
                          )}
                          onClick={() => setActiveTab(item.key)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
