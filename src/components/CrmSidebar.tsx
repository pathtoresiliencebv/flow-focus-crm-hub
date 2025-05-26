
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  Folder, 
  Database, 
  LayoutDashboard, 
  Receipt, 
  Clock,
  Briefcase,
  BarChart2,
  ShoppingCart,
  Settings
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface CrmSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CrmSidebar = ({ activeTab, setActiveTab }: CrmSidebarProps) => {
  const location = useLocation();
  // Track submenu states
  const [personnelOpen, setPersonnelOpen] = useState(
    activeTab === "personnel" || activeTab === "users" || activeTab === "salary"
  );
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { id: "customers", label: "Klanten", icon: Users, path: "/" },
    { id: "projects", label: "Projecten", icon: Folder, path: "/" },
    { id: "calendar", label: "Planning", icon: Calendar, path: "/" },
    { id: "time", label: "Tijdsregistratie", icon: Clock, path: "/" },
    { id: "inventory", label: "Inkoop", icon: ShoppingCart, path: "/" },
    { id: "invoicing", label: "Facturering", icon: Receipt, path: "/" },
    { id: "personnel", label: "Personeelszaken", icon: Briefcase, subItems: [
      { id: "users", label: "Gebruikers", icon: Users, path: "/" },
      { id: "salary", label: "Salaris", icon: Receipt, path: "/" }
    ]},
    { id: "reports", label: "Rapportages", icon: BarChart2, path: "/" },
    { id: "settings", label: "Instellingen", icon: Settings, path: "/settings" }
  ];

  const handleMenuClick = (itemId: string) => {
    setActiveTab(itemId);
  };

  return (
    <div className="bg-white border-r border-gray-200 w-64 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-blue-600">Kozijnen CRM</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <div key={item.id} className="mb-1">
            {item.subItems ? (
              <Collapsible 
                open={item.id === "personnel" ? personnelOpen : false}
                onOpenChange={item.id === "personnel" ? setPersonnelOpen : undefined}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={`w-full justify-between ${
                      activeTab === item.id ? "bg-blue-600 hover:bg-blue-700" : ""
                    }`}
                    onClick={() => handleMenuClick(item.id)}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.label}
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
                  <div className="pl-8 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Button
                        key={subItem.id}
                        variant={activeTab === subItem.id ? "default" : "ghost"}
                        className={`w-full justify-start text-sm ${
                          activeTab === subItem.id ? "bg-blue-600 hover:bg-blue-700" : ""
                        }`}
                        onClick={() => handleMenuClick(subItem.id)}
                      >
                        <subItem.icon className="mr-2 h-4 w-4" />
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
                  className={`w-full justify-start ${
                    activeTab === item.id || (item.path === "/settings" && location.pathname === "/settings") ? "bg-blue-600 hover:bg-blue-700" : ""
                  }`}
                  onClick={() => handleMenuClick(item.id)}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">A</div>
          <div className="ml-3">
            <p className="text-sm font-medium">Admin Gebruiker</p>
            <p className="text-xs text-gray-500">admin@kozijnencrm.nl</p>
          </div>
        </div>
      </div>
    </div>
  );
};
