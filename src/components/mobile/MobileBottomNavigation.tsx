import { LayoutDashboard, Calendar, FolderKanban, Receipt, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileBottomNavigation = ({ activeTab, onTabChange }: MobileBottomNavigationProps) => {
  const navigationItems = [
    { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { key: "calendar", icon: Calendar, label: "Planning" },
    { key: "projects", icon: FolderKanban, label: "Projecten" },
    { key: "receipts", icon: Receipt, label: "Bonnetjes" },
    { key: "email", icon: Mail, label: "E-mail" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navigationItems.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={cn(
              "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors",
              "text-xs font-medium rounded-lg",
              activeTab === key
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};