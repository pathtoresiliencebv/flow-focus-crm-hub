"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  LogOut, 
  Settings, 
  MessageCircle,
  LayoutDashboard,
  Users,
  FolderKanban,
  BarChart,
  Calendar,
  Clock,
  Receipt,
  FileText,
  CreditCard,
  Mail,
  Crown,
  Wrench,
  DollarSign,
  UserCheck
} from "lucide-react";

const AnimatedMenuToggle = ({
  toggle,
  isOpen,
}: {
  toggle: () => void;
  isOpen: boolean;
}) => (
  <button
    onClick={toggle}
    aria-label="Toggle menu"
    className="focus:outline-none z-[101]"
  >
    <motion.div animate={{ y: isOpen ? 13 : 0 }} transition={{ duration: 0.3 }}>
      <motion.svg
        className="h-6 w-6 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          animate={{
            d: isOpen ? "M6 6 18 18" : "M 4 6 L 20 6",
            opacity: isOpen ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.svg>
    </motion.div>
    <motion.div animate={{ y: isOpen ? -13 : 0 }} transition={{ duration: 0.3 }}>
      <motion.svg
        className="h-6 w-6 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          animate={{
            d: isOpen ? "M 6 18 L 18 6" : "M 4 12 L 20 12",
            opacity: isOpen ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.svg>
    </motion.div>
    <motion.div animate={{ y: isOpen ? -13 : 0 }} transition={{ duration: 0.3 }}>
      <motion.svg
        className="h-6 w-6 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          animate={{
            d: isOpen ? "M 6 18 L 18 6" : "M 4 18 L 20 18",
            opacity: isOpen ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.svg>
    </motion.div>
  </button>
);

const MenuIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

import { useAuth } from "@/contexts/AuthContext";
import { LanguageSelector } from '@/components/LanguageSelector';

interface SidebarProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ children, activeTab, setActiveTab }: SidebarProps) {
  const { user, profile, logout, hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  // Default collapsed state for all tabs
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Auto-collapse when switching to email tab
  useEffect(() => {
    if (activeTab === 'email') {
      setIsCollapsed(true);
    }
  }, [activeTab]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const mainLinks = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, permission: null },
    { key: "customers", label: "Klanten", icon: <Users className="h-5 w-5" />, permission: "customers_view" },
    { key: "projects", label: "Projecten", icon: <FolderKanban className="h-5 w-5" />, permission: "projects_view" },
    { key: "calendar", label: "Planning", icon: <Calendar className="h-5 w-5" />, permission: "projects_view" },
    { key: "time", label: "Tijdregistratie", icon: <Clock className="h-5 w-5" />, permission: "projects_view" },
    // 🔧 CRITICAL FIX: Changed from invoices_view to projects_view so Installateurs CAN upload receipts!
    { key: "receipts", label: "Bonnetjes", icon: <Receipt className="h-5 w-5" />, permission: "projects_view" },
    { key: "quotes", label: "Offertes", icon: <FileText className="h-5 w-5" />, permission: "invoices_view" },
    { key: "invoicing", label: "Facturatie", icon: <CreditCard className="h-5 w-5" />, permission: "invoices_view" },
  ];

  const communication = [
    { key: "email", label: "E-mail", icon: <Mail className="h-5 w-5" />, permission: null },
    { key: "chat", label: "Chat", icon: <MessageCircle className="h-5 w-5" />, permission: null },
  ];

  // Removed personnel (team agenda's) as requested

  const settings = [
    { key: "personnel", label: "Personeel", icon: <UserCheck className="h-5 w-5" />, permission: "users_view" },
    { key: "users", label: "Gebruikers", icon: <User className="h-5 w-5" />, permission: "users_view" },
    { key: "salary", label: "Salaris", icon: <DollarSign className="h-5 w-5" />, permission: "users_view" },
    { key: "reports", label: "Rapportages", icon: <BarChart className="h-5 w-5" />, permission: "reports_view" },
    { key: "settings", label: "Instellingen", icon: <Settings className="h-5 w-5" />, permission: "settings_edit" },
  ];

  const CollapsibleSection = ({ 
    title, 
    children, 
    isExpanded = true 
  }: { 
    title: string; 
    children: React.ReactNode; 
    isExpanded?: boolean;
  }) => {
    const [expanded, setExpanded] = useState(isExpanded);
    
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <span>{title}</span>
          {expanded ? <XIcon /> : <MenuIcon />}
        </button>
        {expanded && (
          <div className="mt-2 space-y-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  const renderLink = (link: any, isCollapsible = false, mini = false) => {
    // 🔍 DEBUG: Log permission checks
    if (link.permission) {
      const hasPerm = hasPermission(link.permission);
      console.log(`🔍 Sidebar: ${link.label} (${link.permission}) → ${hasPerm ? '✅ SHOW' : '❌ HIDE'}`);
      if (!hasPerm) {
        return null;
      }
    }

    const isActive = activeTab === link.key;

    // All links use button with tab switching for consistency
    // This ensures navigation always works

    return (
      <li key={link.key} className="relative group">
        <button
          onClick={() => setActiveTab(link.key)}
          className={`w-full flex items-center ${mini ? 'justify-center' : 'justify-start'} gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors ${
            isActive
              ? "bg-red-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          title={mini ? link.label : undefined}
        >
          {!isCollapsible && link.icon}
          {!mini && link.label}
          {mini && !isCollapsible && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {link.label}
            </span>
          )}
          {link.badge && link.badge > 0 && !mini && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {link.badge > 99 ? '99+' : link.badge}
            </span>
          )}
        </button>
      </li>
    );
  };
  
  const SidebarContent = ({ mini = false }) => (
    <>
      <div className={`p-4 ${mini ? 'px-2' : ''}`}>
        <div className="flex items-center justify-center">
          {!mini ? (
            <img src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="SMANS Logo" className="h-10 w-auto" />
          ) : (
            <img src="/logo-collapsed.svg" alt="SMANS Logo" className="w-10 h-10" />
          )}
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto">
        {/* Main Navigation */}
        {!mini && (
          <div className="mb-6">
            <ul className="space-y-1 px-2">{mainLinks.map(link => renderLink(link))}</ul>
          </div>
        )}
        
        {communication.length > 0 && !mini && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
              Communicatie
            </h3>
            <ul>{communication.map(link => renderLink(link))}</ul>
          </div>
        )}
        
        {/* Team Agenda's section removed as requested */}
        
        {/* Settings Section with Collapsible Items */}
        {settings.length > 0 && !mini && (
          <div className="mt-6">
            <CollapsibleSection title="Instellingen" isExpanded={false}>
              <ul>{settings.map(link => renderLink(link, true))}</ul>
            </CollapsibleSection>
          </div>
        )}
        
        {/* Collapsed state - show icons */}
        {mini && (
          <div className="flex flex-col items-center space-y-2 mt-6 px-2">
            {mainLinks.filter(link => !link.permission || hasPermission(link.permission)).map(link => (
              <button
                key={link.key}
                onClick={() => setActiveTab(link.key)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  activeTab === link.key 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={link.label}
              >
                {link.icon}
              </button>
            ))}
            <div className="border-t border-gray-200 w-10 my-2"></div>
            {communication.filter(link => !link.permission || hasPermission(link.permission)).map(link => (
              <button
                key={link.key}
                onClick={() => setActiveTab(link.key)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  activeTab === link.key 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={link.label}
              >
                {link.icon}
              </button>
            ))}
            <div className="border-t border-gray-200 w-10 my-2"></div>
            {settings.filter(link => !link.permission || hasPermission(link.permission)).map(link => (
              <button
                key={link.key}
                onClick={() => setActiveTab(link.key)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  activeTab === link.key 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={link.label}
              >
                {link.icon}
              </button>
            ))}
          </div>
        )}
      </nav>
      <div className={`p-4 border-t border-gray-200 ${mini ? 'px-2' : ''}`}>
        {!mini && (
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{profile?.full_name || user?.email}</p>
            </div>
          </div>
        )}
        <button 
          onClick={logout} 
          className={`flex gap-2 font-medium text-sm items-center w-full p-2 mt-4 text-center bg-red-100 rounded-xl hover:bg-red-200 text-red-700 ${mini ? 'justify-center' : ''}`}
          title={mini ? 'Uitloggen' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!mini && 'Uitloggen'}
        </button>
        
        {/* Language Selector */}
        {!mini && (
          <div className="px-2 mb-2">
            <LanguageSelector />
          </div>
        )}
        
        {/* Toggle button */}
        <button
          onClick={toggleCollapse}
          className="w-full mt-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center"
          title={isCollapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black bg-opacity-50 md:hidden"
            onClick={toggleSidebar}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-80 max-w-[85vw] h-full bg-white shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent mini={false} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`hidden md:flex flex-col fixed top-0 left-0 h-full bg-white text-black shadow-lg transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent mini={isCollapsed} />
      </div>

      <div className={`flex-1 transition-all duration-300 flex flex-col ${isCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'}`}>
        <div className="p-4 bg-white border-b border-gray-200 md:hidden flex justify-between items-center sticky top-0 z-50">
          <img src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="SMANS Logo" className="h-8 w-auto" />
          <AnimatedMenuToggle toggle={toggleSidebar} isOpen={isOpen} />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};