import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  FolderOpen, 
  MessageCircle, 
  Calendar, 
  User,
  Bell
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

interface IOSTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadCount?: number;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  permission?: string;
}

export const IOSTabBar: React.FC<IOSTabBarProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
}) => {
  const { hasPermission } = useAuth();

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderOpen className="h-5 w-5" />,
      permission: 'projects_view',
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageCircle className="h-5 w-5" />,
      badge: unreadCount,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="h-5 w-5" />,
      permission: 'calendar_view',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-5 w-5" />,
    },
  ].filter(tab => !tab.permission || hasPermission(tab.permission as any));

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <div className="relative">
              {React.cloneElement(tab.icon as React.ReactElement, {
                className: `h-5 w-5 ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
                }`,
              })}
              {tab.badge && tab.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </Badge>
              )}
            </div>
            <span className={`text-xs mt-1 truncate ${
              activeTab === tab.id ? 'text-blue-600 font-medium' : 'text-gray-500'
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};