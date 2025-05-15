
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
  ShoppingCart
} from "lucide-react";

interface CrmSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CrmSidebar = ({ activeTab, setActiveTab }: CrmSidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "customers", label: "Klanten", icon: Users },
    { id: "projects", label: "Projecten", icon: Folder },
    { id: "calendar", label: "Planning", icon: Calendar },
    { id: "time", label: "Tijdsregistratie", icon: Clock },
    { id: "inventory", label: "Inkoop", icon: ShoppingCart },
    { id: "invoicing", label: "Facturering", icon: Receipt },
    { id: "personnel", label: "Personeelszaken", icon: Briefcase, subItems: [
      { id: "users", label: "Gebruikers", icon: Users },
      { id: "salary", label: "Salaris", icon: Receipt }
    ]},
    { id: "reports", label: "Rapportages", icon: BarChart2 }
  ];

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
            <Button
              variant={activeTab === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeTab === item.id ? "bg-blue-600 hover:bg-blue-700" : ""
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>

            {/* Render sub-items if they exist */}
            {item.subItems && (
              <div className="pl-8 mt-1 space-y-1">
                {item.subItems.map((subItem) => (
                  <Button
                    key={subItem.id}
                    variant={activeTab === subItem.id ? "default" : "ghost"}
                    className={`w-full justify-start text-sm ${
                      activeTab === subItem.id ? "bg-blue-600 hover:bg-blue-700" : ""
                    }`}
                    onClick={() => setActiveTab(subItem.id)}
                  >
                    <subItem.icon className="mr-2 h-4 w-4" />
                    {subItem.label}
                  </Button>
                ))}
              </div>
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
