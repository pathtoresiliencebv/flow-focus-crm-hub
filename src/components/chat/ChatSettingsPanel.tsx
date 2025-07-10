import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Palette, 
  Globe, 
  Shield, 
  Volume2, 
  Eye, 
  Clock,
  Smartphone
} from 'lucide-react';

interface ChatSettings {
  notifications: {
    sound: boolean;
    vibration: boolean;
    showPreview: boolean;
    quietHours: { start: string; end: string };
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    messageSpacing: 'compact' | 'normal' | 'spacious';
    showTimestamps: boolean;
    showReadReceipts: boolean;
  };
  language: {
    autoDetect: boolean;
    preferredLanguage: string;
    autoTranslate: boolean;
    showOriginal: boolean;
  };
  privacy: {
    shareOnlineStatus: boolean;
    shareTypingStatus: boolean;
    saveConversationHistory: boolean;
  };
}

interface ChatSettingsPanelProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  onClose: () => void;
}

export const ChatSettingsPanel: React.FC<ChatSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [currentSettings, setCurrentSettings] = useState<ChatSettings>(settings);

  const updateSettings = (section: keyof ChatSettings, key: string, value: any) => {
    const newSettings = {
      ...currentSettings,
      [section]: {
        ...currentSettings[section],
        [key]: value
      }
    };
    setCurrentSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const languages = [
    { code: 'nl', name: 'Nederlands' },
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' }
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <h2 className="text-lg font-semibold">Chat Settings</h2>
        <div className="flex-1" />
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage how you receive chat notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notification-sound">Sound notifications</Label>
              <Switch
                id="notification-sound"
                checked={currentSettings.notifications.sound}
                onCheckedChange={(checked) => 
                  updateSettings('notifications', 'sound', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="notification-vibration">Vibration</Label>
              <Switch
                id="notification-vibration"
                checked={currentSettings.notifications.vibration}
                onCheckedChange={(checked) => 
                  updateSettings('notifications', 'vibration', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="notification-preview">Show message preview</Label>
              <Switch
                id="notification-preview"
                checked={currentSettings.notifications.showPreview}
                onCheckedChange={(checked) => 
                  updateSettings('notifications', 'showPreview', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Quiet hours</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={currentSettings.notifications.quietHours.start}
                  onValueChange={(value) => 
                    updateSettings('notifications', 'quietHours', {
                      ...currentSettings.notifications.quietHours,
                      start: value
                    })
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                        {`${i.toString().padStart(2, '0')}:00`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">to</span>
                <Select
                  value={currentSettings.notifications.quietHours.end}
                  onValueChange={(value) => 
                    updateSettings('notifications', 'quietHours', {
                      ...currentSettings.notifications.quietHours,
                      end: value
                    })
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                        {`${i.toString().padStart(2, '0')}:00`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your chat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={currentSettings.appearance.theme}
                onValueChange={(value: 'light' | 'dark' | 'auto') => 
                  updateSettings('appearance', 'theme', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto (system)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message spacing</Label>
              <Select
                value={currentSettings.appearance.messageSpacing}
                onValueChange={(value: 'compact' | 'normal' | 'spacious') => 
                  updateSettings('appearance', 'messageSpacing', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-timestamps">Show timestamps</Label>
              <Switch
                id="show-timestamps"
                checked={currentSettings.appearance.showTimestamps}
                onCheckedChange={(checked) => 
                  updateSettings('appearance', 'showTimestamps', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-read-receipts">Show read receipts</Label>
              <Switch
                id="show-read-receipts"
                checked={currentSettings.appearance.showReadReceipts}
                onCheckedChange={(checked) => 
                  updateSettings('appearance', 'showReadReceipts', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Translation
            </CardTitle>
            <CardDescription>
              Configure language detection and translation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred language</Label>
              <Select
                value={currentSettings.language.preferredLanguage}
                onValueChange={(value) => 
                  updateSettings('language', 'preferredLanguage', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-detect">Auto-detect language</Label>
              <Switch
                id="auto-detect"
                checked={currentSettings.language.autoDetect}
                onCheckedChange={(checked) => 
                  updateSettings('language', 'autoDetect', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-translate">Auto-translate messages</Label>
              <Switch
                id="auto-translate"
                checked={currentSettings.language.autoTranslate}
                onCheckedChange={(checked) => 
                  updateSettings('language', 'autoTranslate', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-original">Show original text</Label>
              <Switch
                id="show-original"
                checked={currentSettings.language.showOriginal}
                onCheckedChange={(checked) => 
                  updateSettings('language', 'showOriginal', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>
              Control what information you share
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="share-online-status">Share online status</Label>
              <Switch
                id="share-online-status"
                checked={currentSettings.privacy.shareOnlineStatus}
                onCheckedChange={(checked) => 
                  updateSettings('privacy', 'shareOnlineStatus', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="share-typing-status">Share typing status</Label>
              <Switch
                id="share-typing-status"
                checked={currentSettings.privacy.shareTypingStatus}
                onCheckedChange={(checked) => 
                  updateSettings('privacy', 'shareTypingStatus', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="save-conversation-history">Save conversation history</Label>
              <Switch
                id="save-conversation-history"
                checked={currentSettings.privacy.saveConversationHistory}
                onCheckedChange={(checked) => 
                  updateSettings('privacy', 'saveConversationHistory', checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};