import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Calendar, 
  Clock, 
  Receipt, 
  FileText, 
  CreditCard, 
  Mail, 
  MessageCircle, 
  UserCheck, 
  User, 
  BarChart, 
  Settings, 
  LogOut,
} from "lucide-react";
import { Permission } from "@/types/permissions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSelector } from "@/components/LanguageSelector";

export function Layout() {
  const { user, profile, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const mainLinks = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, permission: null },
    { path: "/customers", label: "Klanten", icon: <Users className="h-5 w-5" />, permission: "customers_view" as Permission },
    { path: "/projects", label: "Projecten", icon: <FolderKanban className="h-5 w-5" />, permission: "projects_view" as Permission },
    { path: "/planning", label: "Planning", icon: <Calendar className="h-5 w-5" />, permission: "projects_view" as Permission },
    { path: "/time", label: "Tijdregistratie", icon: <Clock className="h-5 w-5" />, permission: "projects_view" as Permission },
    { path: "/receipts", label: "Bonnetjes", icon: <Receipt className="h-5 w-5" />, permission: "invoices_view" as Permission },
    { path: "/quotes", label: "Offertes", icon: <FileText className="h-5 w-5" />, permission: "invoices_view" as Permission },
    { path: "/invoices", label: "Facturatie", icon: <CreditCard className="h-5 w-5" />, permission: "invoices_view" as Permission },
  ];

  const settingsLinks = [
    { path: "/personnel", label: "Personeel", icon: <UserCheck className="h-5 w-5" />, permission: "users_view" as Permission },
    { path: "/users", label: "Gebruikers", icon: <User className="h-5 w-5" />, permission: "users_view" as Permission },
    { path: "/reports", label: "Rapportages", icon: <BarChart className="h-5 w-5" />, permission: "reports_view" as Permission },
    { path: "/settings", label: "Instellingen", icon: <Settings className="h-5 w-5" />, permission: "settings_edit" as Permission },
  ];

  const filteredMainLinks = mainLinks.filter(link => !link.permission || hasPermission(link.permission));
  const filteredSettingsLinks = settingsLinks.filter(link => !link.permission || hasPermission(link.permission));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className={`p-4 ${isCollapsed ? 'px-2' : ''}`}>
          <div className="flex items-center justify-center">
            {!isCollapsed ? (
              <img src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="SMANS Logo" className="h-10 w-auto" />
            ) : (
              <img src="/logo-collapsed.svg" alt="SMANS Logo" className="w-10 h-10" />
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2">
          <ul className="space-y-1">
            {filteredMainLinks.map((link) => (
              <li key={link.path}>
                <button
                  onClick={() => navigate(link.path)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors ${
                    isActive(link.path)
                      ? "bg-red-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title={isCollapsed ? link.label : undefined}
                >
                  {link.icon}
                  {!isCollapsed && <span>{link.label}</span>}
                </button>
              </li>
            ))}
          </ul>

          {/* Settings Section */}
          {filteredSettingsLinks.length > 0 && (
            <div className="mt-6">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
                  Instellingen
                </h3>
              )}
              <ul className="space-y-1">
                {filteredSettingsLinks.map((link) => (
                  <li key={link.path}>
                    <button
                      onClick={() => navigate(link.path)}
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors ${
                        isActive(link.path)
                          ? "bg-red-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      title={isCollapsed ? link.label : undefined}
                    >
                      {link.icon}
                      {!isCollapsed && <span>{link.label}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center"
            title={isCollapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 flex flex-col ${isCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'}`}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            {/* Mobile menu button (we'll add this later) */}
          </div>

          {/* Right side: Mail, Chat, User Menu */}
          <div className="flex items-center gap-3">
            {/* Mail Icon */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/email')}
              className={isActive('/email') ? 'bg-red-50 text-red-600' : ''}
            >
              <Mail className="h-5 w-5" />
            </Button>

            {/* Chat Icon */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/chat')}
              className={isActive('/chat') ? 'bg-red-50 text-red-600' : ''}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>

            {/* User Menu Dropdown */}
            {/* Language Selector */}
            <LanguageSelector />

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block font-medium text-sm">{profile?.full_name || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold">{profile?.full_name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{profile?.role || 'Gebruiker'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Instellingen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

