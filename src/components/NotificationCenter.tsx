import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Bell, 
  BellOff, 
  Check, 
  Settings,
  MessageCircle,
  FileText,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle,
  X
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    preferences,
    unreadCount,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    loading
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getReferenceIcon = (referenceType?: string) => {
    switch (referenceType) {
      case 'project':
        return <FileText className="h-3 w-3" />;
      case 'chat':
        return <MessageCircle className="h-3 w-3" />;
      case 'quote':
        return <FileText className="h-3 w-3" />;
      case 'planning':
        return <Calendar className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: nl 
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Tabs defaultValue="notifications" className="w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notifications" className="text-sm">
                Meldingen
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-sm">
                Instellingen
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="m-0">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">
                  Meldingen ({unreadCount} ongelezen)
                </h3>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Alles gelezen
                  </Button>
                )}
              </div>
              
              <ScrollArea className="h-80">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Meldingen worden geladen...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Geen meldingen</p>
                    <p className="text-xs">Je bent helemaal bij!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <Card 
                        key={notification.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-sm",
                          !notification.is_read && "bg-blue-50 border-blue-200"
                        )}
                        onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm truncate">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {notification.reference_type && (
                                    <div className="text-muted-foreground">
                                      {getReferenceIcon(notification.reference_type)}
                                    </div>
                                  )}
                                  {!notification.is_read && (
                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.created_at)}
                                </span>
                                
                                {notification.reference_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.reference_type === 'project' && 'Project'}
                                    {notification.reference_type === 'chat' && 'Chat'}
                                    {notification.reference_type === 'quote' && 'Offerte'}
                                    {notification.reference_type === 'planning' && 'Planning'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="m-0">
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-4">Notificatie instellingen</h3>
              
              {preferences ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Email notificaties</Label>
                      <p className="text-xs text-muted-foreground">
                        Ontvang meldingen via email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange('email_notifications', checked)
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Push notificaties</Label>
                      <p className="text-xs text-muted-foreground">
                        Browser notificaties
                      </p>
                    </div>
                    <Switch
                      checked={preferences.push_notifications}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange('push_notifications', checked)
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Chat meldingen</Label>
                      <p className="text-xs text-muted-foreground">
                        Nieuwe berichten in chat
                      </p>
                    </div>
                    <Switch
                      checked={preferences.chat_notifications}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange('chat_notifications', checked)
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Project meldingen</Label>
                      <p className="text-xs text-muted-foreground">
                        Updates over projecten
                      </p>
                    </div>
                    <Switch
                      checked={preferences.project_notifications}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange('project_notifications', checked)
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                   <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <Label className="text-sm font-medium">Offerte meldingen</Label>
                       <p className="text-xs text-muted-foreground">
                         Updates over offertes
                       </p>
                     </div>
                     <Switch
                       checked={preferences.quote_notifications}
                       onCheckedChange={(checked) => 
                         handlePreferenceChange('quote_notifications', checked)
                       }
                     />
                   </div>
                   
                   <Separator />
                   
                   <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <Label className="text-sm font-medium">Browser notificaties</Label>
                       <p className="text-xs text-muted-foreground">
                         Desktop notificaties in browser
                       </p>
                     </div>
                     <Switch
                       checked={preferences.browser_notifications}
                       onCheckedChange={(checked) => 
                         handlePreferenceChange('browser_notifications', checked)
                       }
                     />
                   </div>
                   
                   <Separator />
                   
                   <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <Label className="text-sm font-medium">Geluidseffecten</Label>
                       <p className="text-xs text-muted-foreground">
                         Geluid bij nieuwe meldingen
                       </p>
                     </div>
                     <Switch
                       checked={preferences.notification_sound}
                       onCheckedChange={(checked) => 
                         handlePreferenceChange('notification_sound', checked)
                       }
                     />
                   </div>
                   
                   <Separator />
                   
                   <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <Label className="text-sm font-medium">Weekend meldingen</Label>
                       <p className="text-xs text-muted-foreground">
                         Meldingen in het weekend ontvangen
                       </p>
                     </div>
                     <Switch
                       checked={preferences.weekend_notifications}
                       onCheckedChange={(checked) => 
                         handlePreferenceChange('weekend_notifications', checked)
                       }
                     />
                   </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Instellingen worden geladen...</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};