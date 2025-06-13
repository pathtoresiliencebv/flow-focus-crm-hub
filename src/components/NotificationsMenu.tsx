
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, FileText, CheckCircle, CreditCard, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'quote_approved' | 'invoice_paid' | 'general';
  quoteId?: string;
  invoiceId?: string;
}

export const NotificationsMenu = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Offerte goedgekeurd",
      message: "Offerte OF-2023-001 is goedgekeurd door Jan de Vries.",
      date: "15-05-2025",
      read: false,
      type: 'quote_approved',
      quoteId: 'OF-2023-001'
    },
    {
      id: 2,
      title: "Factuur betaald via iDEAL",
      message: "Factuur F-2023-001 is betaald door Marie Jansen via iDEAL.",
      date: "14-05-2025",
      read: false,
      type: 'invoice_paid',
      invoiceId: 'F-2023-001'
    },
    {
      id: 3,
      title: "Offerte goedgekeurd",
      message: "Offerte OF-2023-002 is goedgekeurd door Piet Bakker.",
      date: "13-05-2025",
      read: false,
      type: 'quote_approved',
      quoteId: 'OF-2023-002'
    },
    {
      id: 4,
      title: "Nieuwe klant toegevoegd",
      message: "Klant 'Klaas Janssen' is toegevoegd aan het systeem.",
      date: "12-05-2025",
      read: true,
      type: 'general'
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

  const handleDownloadPDF = (type: 'quote' | 'invoice', id: string) => {
    toast({
      title: `${type === 'quote' ? 'Offerte' : 'Factuur'} PDF gedownload`,
      description: `${id} is succesvol gedownload.`,
    });
  };

  const handleSendEmail = (type: 'quote' | 'invoice', id: string) => {
    toast({
      title: `${type === 'quote' ? 'Offerte' : 'Factuur'} verzonden`,
      description: `${id} is per email verzonden naar de klant.`,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'invoice_paid':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold">Notificaties</h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Alles gelezen
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-gray-50 ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-sm">{notification.title}</h3>
                      <span className="text-xs text-gray-500 ml-2">{notification.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    
                    {/* Action buttons for quote/invoice notifications */}
                    {(notification.type === 'quote_approved' || notification.type === 'invoice_paid') && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleDownloadPDF(
                            notification.type === 'quote_approved' ? 'quote' : 'invoice',
                            notification.quoteId || notification.invoiceId || ''
                          )}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleSendEmail(
                            notification.type === 'quote_approved' ? 'quote' : 'invoice',
                            notification.quoteId || notification.invoiceId || ''
                          )}
                        >
                          Email
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {!notification.read && (
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Markeer als gelezen
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">Geen notificaties</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
