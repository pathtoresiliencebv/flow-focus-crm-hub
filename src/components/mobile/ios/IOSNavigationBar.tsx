import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Bell, 
  Settings, 
  MoreHorizontal,
  Plus,
  Search
} from "lucide-react";

interface IOSNavigationBarProps {
  title: string;
  leftButton?: {
    icon?: React.ReactNode;
    text?: string;
    onClick: () => void;
  };
  rightButton?: {
    icon?: React.ReactNode;
    text?: string;
    onClick: () => void;
    badge?: number;
  };
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
}

export const IOSNavigationBar: React.FC<IOSNavigationBarProps> = ({
  title,
  leftButton,
  rightButton,
  subtitle,
  backgroundColor = 'bg-white',
  textColor = 'text-gray-900',
}) => {
  return (
    <div className={`${backgroundColor} border-b border-gray-200 safe-area-pt`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Button */}
        <div className="flex-1 flex justify-start">
          {leftButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={leftButton.onClick}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
            >
              {leftButton.icon}
              {leftButton.text && (
                <span className="ml-1 font-medium">{leftButton.text}</span>
              )}
            </Button>
          )}
        </div>

        {/* Title */}
        <div className="flex-1 flex flex-col items-center">
          <h1 className={`text-lg font-semibold ${textColor} truncate max-w-full`}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate max-w-full">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Button */}
        <div className="flex-1 flex justify-end">
          {rightButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={rightButton.onClick}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 relative"
            >
              {rightButton.icon}
              {rightButton.text && (
                <span className="ml-1 font-medium">{rightButton.text}</span>
              )}
              {rightButton.badge && rightButton.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                >
                  {rightButton.badge > 99 ? '99+' : rightButton.badge}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Common navigation bar configurations
export const IOSNavigationBarConfigs = {
  // Back navigation
  back: (title: string, onBack: () => void) => ({
    title,
    leftButton: {
      icon: <ArrowLeft className="h-5 w-5" />,
      text: 'Back',
      onClick: onBack,
    },
  }),

  // Settings navigation
  settings: (title: string, onSettings: () => void) => ({
    title,
    rightButton: {
      icon: <Settings className="h-5 w-5" />,
      onClick: onSettings,
    },
  }),

  // Add new item
  addNew: (title: string, onAdd: () => void) => ({
    title,
    rightButton: {
      icon: <Plus className="h-5 w-5" />,
      text: 'Add',
      onClick: onAdd,
    },
  }),

  // Search navigation
  search: (title: string, onSearch: () => void) => ({
    title,
    rightButton: {
      icon: <Search className="h-5 w-5" />,
      onClick: onSearch,
    },
  }),

  // Notifications
  notifications: (title: string, onNotifications: () => void, notificationCount?: number) => ({
    title,
    rightButton: {
      icon: <Bell className="h-5 w-5" />,
      onClick: onNotifications,
      badge: notificationCount,
    },
  }),

  // Menu navigation
  menu: (title: string, onMenu: () => void) => ({
    title,
    rightButton: {
      icon: <MoreHorizontal className="h-5 w-5" />,
      onClick: onMenu,
    },
  }),
};