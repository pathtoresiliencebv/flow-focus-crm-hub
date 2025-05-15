
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export const NotificationsMenu = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Factuur verzonden",
      message: "Factuur F-2023-001 is verzonden naar Jan de Vries.",
      date: "15-05-2025",
      read: false,
    },
    {
      id: 2,
      title: "Nieuw project aangemaakt",
      message: "Project 'Renovatie woonkamer' is aangemaakt door Admin Gebruiker.",
      date: "14-05-2025",
      read: false,
    },
    {
      id: 3,
      title: "Nieuwe klant toegevoegd",
      message: "Klant 'Marie Jansen' is toegevoegd aan het systeem.",
      date: "13-05-2025",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold">Notificaties</h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Alles gelezen
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 border-b cursor-pointer flex flex-col ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between w-full">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs text-gray-500">{notification.date}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">Geen notificaties</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
