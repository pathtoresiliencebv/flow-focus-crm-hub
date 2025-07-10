import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Palette,
  Type,
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  Globe,
  Smartphone,
  Zap,
  Eye,
  Volume2,
  Vibrate,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useDevicePreferences } from '@/hooks/useDevicePreferences';
import { useEnhancedTheme } from '@/hooks/useEnhancedTheme';

interface MobilePreferencesPanelProps {
  onClose: () => void;
}

export const MobilePreferencesPanel: React.FC<MobilePreferencesPanelProps> = ({ onClose }) => {
  const { 
    preferences, 
    updatePreferences, 
    resetToDefaults, 
    isLoading, 
    isSyncing,
    lastSyncTime 
  } = useDevicePreferences();
  
  const {
    effectiveTheme,
    setTheme,
    setFontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setAccentColor
  } = useEnhancedTheme();

  const accentColors = [
    { name: 'Paars', value: 'hsl(262, 83%, 58%)' },
    { name: 'Blauw', value: 'hsl(221, 83%, 53%)' },
    { name: 'Groen', value: 'hsl(142, 76%, 36%)' },
    { name: 'Rood', value: 'hsl(0, 84%, 60%)' },
    { name: 'Oranje', value: 'hsl(25, 95%, 53%)' },
    { name: 'Roze', value: 'hsl(336, 75%, 40%)' },
  ];

  if (isLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Instellingen laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Voorkeuren</h2>
          <div className="flex items-center gap-2">
            {isSyncing && <RefreshCw className="h-4 w-4 animate-spin" />}
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>
        {lastSyncTime && (
          <p className="text-xs text-muted-foreground mt-1">
            Laatst gesynchroniseerd: {lastSyncTime.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Theme & Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Thema & Weergave
            </CardTitle>
            <CardDescription>
              Pas het uiterlijk van de app aan naar jouw voorkeur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Thema</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={preferences.theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-3 w-3" />
                  Licht
                </Button>
                <Button
                  variant={preferences.theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="h-3 w-3" />
                  Donker
                </Button>
                <Button
                  variant={preferences.theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-3 w-3" />
                  Systeem
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Accentkleur</label>
              <div className="grid grid-cols-3 gap-2">
                {accentColors.map((color) => (
                  <Button
                    key={color.value}
                    variant={preferences.accentColor === color.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAccentColor(color.value)}
                    className="flex items-center gap-2"
                    style={{ 
                      backgroundColor: preferences.accentColor === color.value ? color.value : undefined,
                      borderColor: color.value
                    }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Lettergrootte</label>
              <Select value={preferences.fontSize} onValueChange={(value: any) => setFontSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Klein</SelectItem>
                  <SelectItem value="medium">Normaal</SelectItem>
                  <SelectItem value="large">Groot</SelectItem>
                  <SelectItem value="extra-large">Extra groot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Hoog contrast</span>
              </div>
              <Switch 
                checked={preferences.highContrast} 
                onCheckedChange={toggleHighContrast}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Verminderde animaties</span>
              </div>
              <Switch 
                checked={preferences.reducedMotion} 
                onCheckedChange={toggleReducedMotion}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Meldingen
            </CardTitle>
            <CardDescription>
              Beheer hoe en wanneer je meldingen ontvangt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Push meldingen</span>
              <Switch 
                checked={preferences.pushNotifications} 
                onCheckedChange={(checked) => updatePreferences({ pushNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm font-medium">Geluid</span>
              </div>
              <Switch 
                checked={preferences.soundEnabled} 
                onCheckedChange={(checked) => updatePreferences({ soundEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="h-4 w-4" />
                <span className="text-sm font-medium">Trillen</span>
              </div>
              <Switch 
                checked={preferences.vibrationEnabled} 
                onCheckedChange={(checked) => updatePreferences({ vibrationEnabled: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Stille uren</span>
                </div>
                <Switch 
                  checked={preferences.quietHours.enabled} 
                  onCheckedChange={(checked) => updatePreferences({ 
                    quietHours: { ...preferences.quietHours, enabled: checked }
                  })}
                />
              </div>
              
              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Van</label>
                    <input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) => updatePreferences({
                        quietHours: { ...preferences.quietHours, start: e.target.value }
                      })}
                      className="w-full px-2 py-1 text-sm border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Tot</label>
                    <input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) => updatePreferences({
                        quietHours: { ...preferences.quietHours, end: e.target.value }
                      })}
                      className="w-full px-2 py-1 text-sm border rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Synchronisatie
            </CardTitle>
            <CardDescription>
              Configureer hoe gegevens worden gesynchroniseerd
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Automatische sync</span>
              <Switch 
                checked={preferences.autoSync} 
                onCheckedChange={(checked) => updatePreferences({ autoSync: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Achtergrond sync</span>
              <Switch 
                checked={preferences.backgroundSync} 
                onCheckedChange={(checked) => updatePreferences({ backgroundSync: checked })}
              />
            </div>

            {preferences.autoSync && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Sync interval</label>
                <div className="space-y-2">
                  <Slider
                    value={[preferences.syncInterval]}
                    onValueChange={([value]) => updatePreferences({ syncInterval: value })}
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 min</span>
                    <span className="font-medium">{preferences.syncInterval} min</span>
                    <span>60 min</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy & Beveiliging
            </CardTitle>
            <CardDescription>
              Beheer je privacy en beveiligingsinstellingen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Biometrische login</span>
              <Switch 
                checked={preferences.biometricLogin} 
                onCheckedChange={(checked) => updatePreferences({ biometricLogin: checked })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Automatisch vergrendelen</label>
              <Select 
                value={preferences.autoLock.toString()} 
                onValueChange={(value) => updatePreferences({ autoLock: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Uit</SelectItem>
                  <SelectItem value="1">1 minuut</SelectItem>
                  <SelectItem value="5">5 minuten</SelectItem>
                  <SelectItem value="15">15 minuten</SelectItem>
                  <SelectItem value="30">30 minuten</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gebruiksgegevens delen</span>
              <Switch 
                checked={preferences.shareUsageData} 
                onCheckedChange={(checked) => updatePreferences({ shareUsageData: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Analytics delen</span>
              <Switch 
                checked={preferences.shareAnalytics} 
                onCheckedChange={(checked) => updatePreferences({ shareAnalytics: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Taal & Regio
            </CardTitle>
            <CardDescription>
              Taal, datum en tijd instellingen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Datumformaat</label>
              <Select 
                value={preferences.dateFormat} 
                onValueChange={(value: any) => updatePreferences({ dateFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tijdformaat</label>
              <Select 
                value={preferences.timeFormat} 
                onValueChange={(value: any) => updatePreferences({ timeFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24-uurs</SelectItem>
                  <SelectItem value="12h">12-uurs (AM/PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Geavanceerd
            </CardTitle>
            <CardDescription>
              Geavanceerde instellingen voor power users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Developer modus</span>
              <Switch 
                checked={preferences.developerMode} 
                onCheckedChange={(checked) => updatePreferences({ developerMode: checked })}
              />
            </div>

            {preferences.developerMode && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Debug logging</span>
                  <Switch 
                    checked={preferences.debugLogging} 
                    onCheckedChange={(checked) => updatePreferences({ debugLogging: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Experimentele features</span>
                  <Switch 
                    checked={preferences.experimentalFeatures} 
                    onCheckedChange={(checked) => updatePreferences({ experimentalFeatures: checked })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reset Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Reset instellingen</CardTitle>
            <CardDescription>
              Zet alle instellingen terug naar standaardwaarden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={resetToDefaults}
              disabled={isSyncing}
              className="w-full"
            >
              Alle instellingen resetten
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};