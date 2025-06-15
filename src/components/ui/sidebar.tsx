"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Settings } from "lucide-react";

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

export const Sidebar = ({ links, user, logout, activeTab, setActiveTab, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const mobileSidebarVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  const mainLinks = links.slice(0, 4);
  const werkLinks = links.filter(l => ["time", "receipts", "quotes", "invoicing", "email"].includes(l.key));
  const beheerLinks = links.filter(l => ["personnel", "users", "salary", "reports"].includes(l.key));
  const settingsLink = links.find(l => l.key === 'settings');

  const createLinkHandler = (tabKey) => () => {
    setActiveTab(tabKey);
    if (isOpen) {
      toggleSidebar();
    }
  };

  const renderLink = (link, isCollapsible = false) => {
    const commonClasses = `flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl`;
    const activeClasses = activeTab === link.key ? 'bg-smans-primary text-smans-primary-foreground' : 'hover:bg-smans-primary hover:text-smans-primary-foreground';
    const collapsibleClasses = isCollapsible ? 'text-left p-2' : '';
    return (
      <li key={link.key} className={!isCollapsible ? "mb-2" : ""}>
        <button
          onClick={createLinkHandler(link.key)}
          className={`${commonClasses} ${activeClasses} ${collapsibleClasses}`}
        >
          {!isCollapsible && link.icon}
          {link.label}
        </button>
      </li>
    );
  };
  
  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <img src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="SMANS Logo" className="h-10 w-auto" />
        </div>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul>{mainLinks.map(link => renderLink(link))}</ul>
        <div className="mt-4">
          <CollapsibleSection title="Werk">
            <ul>{werkLinks.map(link => renderLink(link, true))}</ul>
          </CollapsibleSection>
          <CollapsibleSection title="Beheer">
            <ul>{beheerLinks.map(link => renderLink(link, true))}</ul>
          </CollapsibleSection>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-200">
        {settingsLink && (
           <button
             onClick={createLinkHandler(settingsLink.key)}
             className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl mb-4 ${activeTab === settingsLink.key ? 'bg-smans-primary text-smans-primary-foreground' : 'hover:bg-smans-primary hover:text-smans-primary-foreground'}`}
           >
             <Settings className="h-5 w-5" />
             {settingsLink.label}
           </button>
        )}
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="flex gap-2 font-medium text-sm items-center w-full p-2 mt-4 text-center bg-red-100 rounded-xl hover:bg-red-200 text-red-700">
          <LogOut className="h-5 w-5" />
          Uitloggen
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
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden md:flex flex-col fixed top-0 left-0 h-full w-64 bg-white text-black shadow">
        <SidebarContent />
      </div>

      <div className="flex-1 ml-0 md:ml-64 transition-all duration-300 flex flex-col">
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
