import React, { useState } from 'react';
import { Bell, Send, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const NotificationTester: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createNotification } = useNotifications();
  const { sendTestNotification, isSubscribed } = usePushSubscription();
  
  const [title, setTitle] = useState('Test Notificatie');
  const [message, setMessage] = useState('Dit is een test bericht vanuit het notificatie systeem.');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [loading, setLoading] = useState(false);

  const handleCreateNotification = async () => {
    if (!user || !title.trim() || !message.trim()) {
      toast({
        title: "Fout",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createNotification(user.id, title, message, type);
      toast({
        title: "Notificatie aangemaakt",
        description: "De test notificatie is succesvol aangemaakt",
      });
      
      // Reset form
      setTitle('Test Notificatie');
      setMessage('Dit is een test bericht vanuit het notificatie systeem.');
      setType('info');
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Fout",
        description: "Kon notificatie niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePushTest = async () => {
    if (!isSubscribed) {
      toast({
        title: "Niet geabonneerd",
        description: "Je moet eerst push notificaties inschakelen",
        variant: "destructive",
      });
      return;
    }

    await sendTestNotification();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Notificatie Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titel</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notificatie titel"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Bericht</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notificatie bericht"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value: any) => setType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Succes</SelectItem>
              <SelectItem value="warning">Waarschuwing</SelectItem>
              <SelectItem value="error">Fout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleCreateNotification}
            disabled={loading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Systeem Notificatie Maken
          </Button>

          <Button
            onClick={handlePushTest}
            disabled={!isSubscribed}
            variant="outline"
            className="w-full"
          >
            <Bell className="h-4 w-4 mr-2" />
            Push Notificatie Testen
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Systeem notificaties verschijnen in het NotificationCenter</p>
          <p>• Push notificaties worden als browser notificatie getoond</p>
          <p>• Real-time updates werken automatisch</p>
        </div>
      </CardContent>
    </Card>
  );
};