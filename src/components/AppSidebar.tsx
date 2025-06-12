
import { Button } from "@/components/ui/button";
import { Users, Calendar, Folder, LayoutDashboard, Receipt, Clock, Briefcase, BarChart2, FileText, Settings, LogOut, FileCheck } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AppSidebar = ({
  activeTab,
  setActiveTab
}: AppSidebarProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  
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
    id: "quotes",
    label: "Offertes",
    icon: FileCheck,
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center space-x-3 px-2">
          <img 
            src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
            alt="SMANS Logo" 
            className="h-8 w-auto object-contain" 
          />
          {state === "expanded" && (
            <span className="font-semibold text-lg">SMANS</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigatie</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.id}>
                  {item.subItems ? (
                    <Collapsible 
                      open={item.id === "personnel" ? personnelOpen : false} 
                      onOpenChange={item.id === "personnel" ? setPersonnelOpen : undefined}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          isActive={activeTab === item.id}
                          onClick={() => handleMenuClick(item.id)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map(subItem => (
                            <SidebarMenuSubItem key={subItem.id}>
                              <SidebarMenuSubButton 
                                isActive={activeTab === subItem.id}
                                onClick={() => handleMenuClick(subItem.id)}
                              >
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.label}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton 
                      asChild={item.path !== "/"}
                      isActive={activeTab === item.id || (item.path === "/settings" && location.pathname === "/settings")}
                      onClick={() => handleMenuClick(item.id)}
                    >
                      {item.path === "/" ? (
                        <span>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </span>
                      ) : (
                        <Link to={item.path}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-smans-primary bg-opacity-10 flex items-center justify-center text-smans-primary font-bold mr-3">
                  <span className="text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                {state === "expanded" && (
                  <div>
                    <p className="text-sm font-medium">
                      {user?.name || 'Admin Gebruiker'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'admin@smans.nl'}
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-500 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
