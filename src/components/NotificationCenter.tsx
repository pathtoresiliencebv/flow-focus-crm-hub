import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, Info, CheckCircle, X, Filter, Settings } from 'lucide-react';
import { useNotifications, UserNotification } from '@/hooks/useNotifications';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const getTypeIcon = (type: UserNotification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <X className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getTypeColor = (type: UserNotification['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-100 border-green-200 text-green-800';
    case 'warning':
      return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    case 'error':
      return 'bg-red-100 border-red-200 text-red-800';
    default:
      return 'bg-blue-100 border-blue-200 text-blue-800';
  }
};

const formatRelativeTime = (date: string) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'zojuist';
  if (diffInMinutes < 60) return `${diffInMinutes}m geleden`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}u geleden`;
  return `${Math.floor(diffInMinutes / 1440)}d geleden`;
};

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
  
  const {
    isSupported,
    isSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
  } = usePushSubscription();
  
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'unread' | UserNotification['type']>('all');
  const [showSettings, setShowSettings] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.is_read;
    return notification.type === filter;
  });

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast({
      title: "Alle notificaties gelezen",
      description: "Alle notificaties zijn gemarkeerd als gelezen",
    });
  };

  const handleTogglePushNotifications = async () => {
    if (isSubscribed) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  };

  const NotificationItem: React.FC<{ notification: UserNotification }> = ({ notification }) => (
    <Card className={`transition-all duration-200 ${notification.is_read ? 'opacity-60' : 'border-l-4 border-l-primary'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getTypeIcon(notification.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{notification.title}</h4>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(notification.created_at)}
                </span>
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
            <Badge variant="outline" className={getTypeColor(notification.type)}>
              {notification.type}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SettingsPanel: React.FC = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Push Notificaties</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Push notificaties inschakelen</Label>
              <p className="text-sm text-muted-foreground">
                Ontvang notificaties op dit apparaat
              </p>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleTogglePushNotifications}
              disabled={!isSupported}
            />
          </div>
          
          {isSubscribed && (
            <Button
              variant="outline"
              onClick={sendTestNotification}
              className="w-full"
            >
              Test notificatie verzenden
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Notificatie Types</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Chat berichten</Label>
            <Switch
              checked={preferences?.chat_notifications || false}
              onCheckedChange={(checked) => 
                updatePreferences({ chat_notifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Project updates</Label>
            <Switch
              checked={preferences?.project_notifications || false}
              onCheckedChange={(checked) => 
                updatePreferences({ project_notifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Offerte notificaties</Label>
            <Switch
              checked={preferences?.quote_notifications || false}
              onCheckedChange={(checked) => 
                updatePreferences({ quote_notifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Email notificaties</Label>
            <Switch
              checked={preferences?.email_notifications || false}
              onCheckedChange={(checked) => 
                updatePreferences({ email_notifications: checked })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Rusttijden</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Weekend notificaties</Label>
            <Switch
              checked={preferences?.weekend_notifications || false}
              onCheckedChange={(checked) => 
                updatePreferences({ weekend_notifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Notificatie geluid</Label>
            <Switch
              checked={preferences?.notification_sound || false}
              onCheckedChange={(checked) => 
                updatePreferences({ notification_sound: checked })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notificaties</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        {showSettings ? (
          <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
            <SettingsPanel />
          </ScrollArea>
        ) : (
          <>
            <div className="flex items-center gap-2 mt-6 mb-4">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle notificaties</SelectItem>
                  <SelectItem value="unread">Ongelezen</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Succes</SelectItem>
                  <SelectItem value="warning">Waarschuwing</SelectItem>
                  <SelectItem value="error">Fout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {filter === 'unread' ? 'Geen ongelezen notificaties' : 'Geen notificaties'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};