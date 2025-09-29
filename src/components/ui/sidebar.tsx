"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Settings, MessageCircle } from "lucide-react";

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
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ children, activeTab, setActiveTab }: SidebarProps) {
  const { user, profile, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse on calendar page
  useEffect(() => {
    setIsCollapsed(location.pathname.includes('calendar'));
  }, [location.pathname]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const mainLinks = [
    { key: "dashboard", label: "Dashboard", icon: "🏠", permission: null },
    { key: "customers", label: "Klanten", icon: "👥", permission: "customers_view" },
    { key: "projects", label: "Projecten", icon: "📋", permission: "projects_view" },
    { key: "customers-projects", label: "Klanten & Projecten", icon: "📊", permission: "customers_view" },
    { key: "calendar", label: "Kalender", icon: "📅", permission: "projects_view" },
    { key: "planning", label: "Planning", icon: "🗓️", permission: "projects_view" },
    { key: "time", label: "Tijdregistratie", icon: "⏰", permission: "projects_view" },
    { key: "receipts", label: "Bonnetjes", icon: "🧾", permission: "invoices_view" },
    { key: "quotes", label: "Offertes", icon: "📄", permission: "invoices_view" },
    { key: "invoicing", label: "Facturatie", icon: "💰", permission: "invoices_view" },
  ];

  const communication = [
    { key: "email", label: "E-mail", icon: "✉️", permission: null },
    { key: "chat", label: "Chat", icon: "💬", permission: null },
  ];

  const personnel = [
    { key: "Administrator", label: "Administrator", icon: "👑", permission: null, badge: 0 },
    { key: "Administratie", label: "Administratie", icon: "📋", permission: null, badge: 0 },
    { key: "Installatieeur1", label: "Installateur 1", icon: "🔧", permission: null, badge: 0 },
    { key: "Installatieeur2", label: "Installateur 2", icon: "🔧", permission: null, badge: 0 },
    { key: "Installatieeur3", label: "Installateur 3", icon: "🔧", permission: null, badge: 0 },
  ];

  const settings = [
    { key: "personnel", label: "Personeel", icon: "👥", permission: "users_view" },
    { key: "users", label: "Gebruikers", icon: "👤", permission: "users_view" },
    { key: "salary", label: "Salaris", icon: "💵", permission: "users_view" },
    { key: "reports", label: "Rapportages", icon: "📊", permission: "reports_view" },
    { key: "settings", label: "Instellingen", icon: "⚙️", permission: "settings_edit" },
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
    if (link.permission && !hasPermission(link.permission)) {
      return null;
    }

    const isActive = activeTab === link.key;

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
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
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
        
        {/* Personnel Section - Team Agenda's always expanded */}
        {personnel.length > 0 && !mini && (
          <div className="mt-6">
            <div className="mb-3 px-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Team Agenda's
              </h3>
            </div>
            <ul>{personnel.map(link => renderLink(link, false))}</ul>
          </div>
        )}
        
        {/* Settings Section with Collapsible Items */}
        {settings.length > 0 && !mini && (
          <div className="mt-6">
            <CollapsibleSection title="Instellingen">
              <ul>{settings.map(link => renderLink(link, true))}</ul>
            </CollapsibleSection>
          </div>
        )}
        
        {/* Collapsed state - show only important communication and settings icons */}
        {mini && (
          <div className="space-y-2 mt-6">
            {communication.map(link => renderLink(link, false, true))}
            {settings.filter(link => link.key === 'settings').map(link => renderLink(link, false, true))}
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