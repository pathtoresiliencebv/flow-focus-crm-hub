
import { Button } from "@/components/ui/button";
import { Users, Calendar, Folder, Database, LayoutDashboard, Receipt, Clock, Briefcase, BarChart2, FileText, Settings, LogOut } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface CrmSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CrmSidebar = ({
  activeTab,
  setActiveTab
}: CrmSidebarProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  
  // Track submenu states
  const [personnelOpen, setPersonnelOpen] = useState(activeTab === "personnel" || activeTab === "users" || activeTab === "salary");
  
  const menuItems = [{
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/"
  }, {
    id: "customers",
    label: "Klanten",
    icon: Users,
    path: "/"
  }, {
    id: "projects",
    label: "Projecten",
    icon: Folder,
    path: "/"
  }, {
    id: "calendar",
    label: "Planning",
    icon: Calendar,
    path: "/"
  }, {
    id: "time",
    label: "Tijdsregistratie",
    icon: Clock,
    path: "/"
  }, {
    id: "receipts",
    label: "Bonnetjes",
    icon: FileText,
    path: "/"
  }, {
    id: "invoicing",
    label: "Facturering",
    icon: Receipt,
    path: "/"
  }, {
    id: "personnel",
    label: "Personeelszaken",
    icon: Briefcase,
    subItems: [{
      id: "users",
      label: "Gebruikers",
      icon: Users,
      path: "/"
    }, {
      id: "salary",
      label: "Salaris",
      icon: Receipt,
      path: "/"
    }]
  }, {
    id: "reports",
    label: "Rapportages",
    icon: BarChart2,
    path: "/"
  }, {
    id: "settings",
    label: "Instellingen",
    icon: Settings,
    path: "/settings"
  }];

  const handleMenuClick = (itemId: string) => {
    setActiveTab(itemId);
  };

  return (
    <div className={`bg-white border-r border-gray-200 ${isMobile ? 'w-full' : 'w-64'} flex flex-col h-full`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
            alt="SMANS Logo" 
            className={`${isMobile ? 'h-6' : 'h-8'} w-auto object-contain`} 
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isMobile ? 'p-2' : 'p-4'} space-y-1 overflow-y-auto`}>
        {menuItems.map(item => (
          <div key={item.id} className="mb-1">
            {item.subItems ? (
              <Collapsible 
                open={item.id === "personnel" ? personnelOpen : false} 
                onOpenChange={item.id === "personnel" ? setPersonnelOpen : undefined}
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant={activeTab === item.id ? "default" : "ghost"} 
                    className={`w-full justify-between ${isMobile ? 'h-10 text-sm' : ''} ${
                      activeTab === item.id ? "bg-smans-primary hover:bg-smans-primary text-white" : ""
                    }`} 
                    onClick={() => handleMenuClick(item.id)}
                  >
                    <div className="flex items-center">
                      <item.icon className={`${isMobile ? 'mr-1 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                      <span className={isMobile ? 'text-xs' : ''}>{item.label}</span>
                    </div>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`transform transition-transform ${personnelOpen ? "rotate-180" : ""}`}
                    >
                      <path 
                        d="M2 5L8 11L14 5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </svg>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={`${isMobile ? 'pl-4' : 'pl-8'} mt-1 space-y-1`}>
                    {item.subItems.map(subItem => (
                      <Button 
                        key={subItem.id} 
                        variant={activeTab === subItem.id ? "default" : "ghost"} 
                        className={`w-full justify-start ${isMobile ? 'h-8 text-xs' : 'text-sm'} ${
                          activeTab === subItem.id ? "bg-smans-primary hover:bg-smans-primary text-white" : ""
                        }`} 
                        onClick={() => handleMenuClick(subItem.id)}
                      >
                        <subItem.icon className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                        {subItem.label}
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link to={item.path} className="block">
                <Button 
                  variant={activeTab === item.id || (item.path === "/settings" && location.pathname === "/settings") ? "default" : "ghost"} 
                  className={`w-full justify-start ${isMobile ? 'h-10 text-sm' : ''} ${
                    activeTab === item.id || (item.path === "/settings" && location.pathname === "/settings") ? 
                    "bg-smans-primary hover:bg-smans-primary text-white" : ""
                  }`} 
                  onClick={() => handleMenuClick(item.id)}
                >
                  <item.icon className={`${isMobile ? 'mr-1 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                  <span className={isMobile ? 'text-xs' : ''}>{item.label}</span>
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className={`${isMobile ? 'p-2' : 'p-4'} border-t border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-smans-primary bg-opacity-10 flex items-center justify-center text-smans-primary font-bold`}>
              <span className={isMobile ? 'text-xs' : 'text-sm'}>
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className={`${isMobile ? 'ml-2' : 'ml-3'}`}>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                {user?.name || 'Admin Gebruiker'}
              </p>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                {user?.email || 'admin@smans.nl'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "sm"}
            onClick={logout}
            className="text-gray-500 hover:text-red-600"
          >
            <LogOut className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};
