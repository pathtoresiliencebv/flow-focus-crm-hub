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
        width="20"
        height="20"
        viewBox="0 0 24 24"
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.3 }}
        className="text-black"
      >
        <motion.path
          fill="transparent"
          strokeWidth="3"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 2.5 L 22 2.5" },
            open: { d: "M 3 16.5 L 17 2.5" },
          }}
        />
        <motion.path
          fill="transparent"
          strokeWidth="3"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 12 L 22 12", opacity: 1 },
            open: { opacity: 0 },
          }}
          transition={{ duration: 0.2 }}
        />
        <motion.path
          fill="transparent"
          strokeWidth="3"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 21.5 L 22 21.5" },
            open: { d: "M 3 2.5 L 17 16.5" },
          }}
        />
      </motion.svg>
    </motion.div>
  </button>
);

const MenuIcon = () => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <motion.line x1="3" y1="12" x2="21" y2="12" />
  </motion.svg>
);

const XIcon = () => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <motion.line x1="18" y1="6" x2="6" y2="18" />
    <motion.line x1="6" y1="6" x2="18" y2="18" />
  </motion.svg>
);

const CollapsibleSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        className="w-full flex items-center justify-between py-2 px-4 rounded-xl hover:bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold">{title}</span>
        {open ? <XIcon /> : <MenuIcon />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Sidebar = ({ 
  links, 
  mainLinks, 
  communicationLinks, 
  personnelLinks,
  settingsLinks, 
  user, 
  profile, 
  logout, 
  activeTab, 
  setActiveTab, 
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Collapse sidebar automatically when on planning page
  const [isCollapsed, setIsCollapsed] = useState(activeTab === 'calendar');

  // Auto-collapse when activeTab changes to calendar (planning)
  useEffect(() => {
    if (activeTab === 'calendar') {
      setIsCollapsed(true);
    }
  }, [activeTab]);

  const mobileSidebarVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Use passed links or fallback to old structure for backward compatibility
  const main = mainLinks || links.slice(0, 4);
  const communication = communicationLinks || links.filter(l => ["email", "chat"].includes(l.key));
  const personnel = personnelLinks || [];
  const settings = settingsLinks || links.filter(l => ["reports", "settings"].includes(l.key));

  const createLinkHandler = (tabKey) => () => {
    setActiveTab(tabKey);
    // Auto-collapse sidebar when clicking on Planning
    if (tabKey === 'calendar') {
      setIsCollapsed(true);
    }
    // Close sidebar for mobile or when clicking on any menu item
    if (isOpen) {
      toggleSidebar();
    }
  };

  const renderLink = (link, isCollapsible = false, mini = false) => {
    const commonClasses = `flex gap-2 font-medium text-sm items-center w-full py-3 px-4 rounded-xl min-h-[44px] transition-all`;
    const activeClasses = activeTab === link.key ? 'bg-smans-primary text-smans-primary-foreground' : 'hover:bg-smans-primary hover:text-smans-primary-foreground';
    const collapsibleClasses = isCollapsible ? 'text-left p-3' : '';
    const miniClasses = mini ? 'justify-center px-2' : '';
    
    return (
      <li key={link.key} className={!isCollapsible ? "mb-2" : ""}>
        <button
          onClick={createLinkHandler(link.key)}
          className={`${commonClasses} ${activeClasses} ${collapsibleClasses} ${miniClasses} relative group`}
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
      <div className={`p-4 border-b border-gray-200 ${mini ? 'px-2' : ''}`}>
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
      <nav className={`flex-1 p-4 overflow-y-auto ${mini ? 'px-2' : ''}`}>
        {/* Main Navigation */}
        <ul>{main.map(link => renderLink(link, false, mini))}</ul>
        
        {/* Communication Section */}
        {communication.length > 0 && !mini && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
              Communicatie
            </h3>
            <ul>{communication.map(link => renderLink(link))}</ul>
          </div>
        )}
        
        {/* Personnel Section */}
        {personnel.length > 0 && !mini && (
          <div className="mt-6">
            <CollapsibleSection title="Personeel">
              <ul>{personnel.map(link => renderLink(link, true))}</ul>
            </CollapsibleSection>
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={mobileSidebarVariants}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-[100] bg-white text-black flex flex-col h-full"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <img src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="SMANS Logo" className="h-8 w-auto" />
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu sluiten"
              >
                <XIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent mini={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`hidden md:flex flex-col fixed top-0 left-0 h-full bg-white text-black shadow-lg border-r-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
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
