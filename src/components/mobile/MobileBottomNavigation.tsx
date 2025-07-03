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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden">
      {/* Safe area padding for devices with home indicator */}
      <div className="pb-safe-area-inset-bottom">
        <div className="flex items-center justify-around px-1 py-2">
          {navigationItems.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-3 px-1 transition-all duration-200",
                "text-xs font-medium rounded-xl min-h-[60px] touch-manipulation",
                "active:scale-95 active:bg-primary/20",
                activeTab === key
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              <Icon className={cn(
                "mb-1 transition-transform duration-200",
                activeTab === key ? "h-6 w-6" : "h-5 w-5"
              )} />
              <span className={cn(
                "truncate transition-all duration-200",
                activeTab === key ? "font-semibold" : "font-medium"
              )}>
                {label}
              </span>
              {activeTab === key && (
                <div className="w-1 h-1 bg-primary rounded-full mt-1 transition-all duration-200" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};