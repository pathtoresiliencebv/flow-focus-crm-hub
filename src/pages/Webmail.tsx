/**
 * Standalone Webmail Page
 * Route: /webmail
 * 
 * Simple wrapper for Email component with sidebar
 * No complex state management - just renders Email
 */

import React from 'react';
import Email from '@/pages/Email';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import LoginScreen from '@/components/LoginScreen';

export default function Webmail() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Fake activeTab state for AppSidebar (set to 'email')
  const [activeTab, setActiveTab] = React.useState('email');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab}>
      <Email />
    </AppSidebar>
  );
}

