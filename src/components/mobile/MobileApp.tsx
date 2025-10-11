import React, { useState } from 'react';
import { MobileDashboard } from './MobileDashboard';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { MobileReceiptsList } from './MobileReceiptsList';
import { useAuth } from '@/contexts/AuthContext';

export const MobileApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const { profile } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <MobileDashboard />;
      
      case 'calendar':
        return (
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Planning</h1>
            <p className="text-muted-foreground">Planning view - coming soon</p>
          </div>
        );
      
      case 'chat':
        return (
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Chat</h1>
            <p className="text-muted-foreground">Chat view - coming soon</p>
          </div>
        );
      
      case 'receipts':
        return <MobileReceiptsList />;
      
      default:
        return <MobileDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Main Content */}
      <div className="min-h-screen">
        {renderContent()}
      </div>
      
      {/* Bottom Navigation */}
      <MobileBottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

