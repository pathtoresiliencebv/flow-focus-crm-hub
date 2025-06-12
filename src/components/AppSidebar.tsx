
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
    
    // Open personnel submenu if clicking on personnel or its subitems
    if (itemId === "personnel" || itemId === "users" || itemId === "salary") {
      setPersonnelOpen(true);
    }
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <img 
            src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
            alt="SMANS Logo" 
            className="h-8 w-8 flex-shrink-0" 
          />
          <span className="font-semibold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            SMANS
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-medium px-3 py-2">
            Navigatie
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {menuItems.map(item => (
                <SidebarMenuItem key={item.id}>
                  {item.subItems ? (
                    <Collapsible 
                      open={personnelOpen} 
                      onOpenChange={setPersonnelOpen}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          isActive={activeTab === item.id || activeTab === "users" || activeTab === "salary"}
                          onClick={() => handleMenuClick(item.id)}
                          className="w-full justify-start gap-3 px-3 py-2 h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-6 mt-1 space-y-1">
                          {item.subItems.map(subItem => (
                            <SidebarMenuSubItem key={subItem.id}>
                              <SidebarMenuSubButton 
                                isActive={activeTab === subItem.id}
                                onClick={() => handleMenuClick(subItem.id)}
                                className="w-full justify-start gap-3 px-3 py-2 h-9 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                              >
                                <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                <span className="group-data-[collapsible=icon]:hidden">{subItem.label}</span>
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
                      className="w-full justify-start gap-3 px-3 py-2 h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                    >
                      {item.path === "/" ? (
                        <span className="flex items-center gap-3 w-full">
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </span>
                      ) : (
                        <Link to={item.path} className="flex items-center gap-3 w-full">
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
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

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-smans-primary bg-opacity-10 flex items-center justify-center text-smans-primary font-bold flex-shrink-0">
              <span className="text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="group-data-[collapsible=icon]:hidden min-w-0 flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'Admin Gebruiker'}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {user?.email || 'admin@smans.nl'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="flex-shrink-0 text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
