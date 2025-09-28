import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalendarSettings, UpdateCalendarSettingsData } from '@/hooks/useCalendarSettings';
import { Badge } from "@/components/ui/badge";

interface CalendarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const weekDays = [
  { value: 1, label: 'Maandag' },
  { value: 2, label: 'Dinsdag' },
  { value: 3, label: 'Woensdag' },
  { value: 4, label: 'Donderdag' },
  { value: 5, label: 'Vrijdag' },
  { value: 6, label: 'Zaterdag' },
  { value: 7, label: 'Zondag' }
];

const viewOptions = [
  { value: 'month', label: 'Maand' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Dag' }
];

const reminderOptions = [
  { value: 0, label: 'Geen herinnering' },
  { value: 5, label: '5 minuten' },
  { value: 10, label: '10 minuten' },
  { value: 15, label: '15 minuten' },
  { value: 30, label: '30 minuten' },
  { value: 60, label: '1 uur' },
  { value: 120, label: '2 uur' },
  { value: 1440, label: '1 dag' }
];

export const CalendarSettingsDialog: React.FC<CalendarSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { settings, loading, updateSettings } = useCalendarSettings();
  const [formData, setFormData] = useState({
    default_view: 'week' as 'month' | 'week' | 'day',
    default_reminder_minutes: 15,
    work_hours_start: '09:00',
    work_hours_end: '17:00',
    work_days: [1, 2, 3, 4, 5],
    show_weekends: true,
    timezone: 'Europe/Amsterdam'
  });
  const [saving, setSaving] = useState(false);

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setFormData({
        default_view: settings.default_view,
        default_reminder_minutes: settings.default_reminder_minutes,
        work_hours_start: settings.work_hours_start,
        work_hours_end: settings.work_hours_end,
        work_days: settings.work_days,
        show_weekends: settings.show_weekends,
        timezone: settings.timezone
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day].sort()
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const updates: UpdateCalendarSettingsData = {
      default_view: formData.default_view,
      default_reminder_minutes: formData.default_reminder_minutes,
      work_hours_start: formData.work_hours_start,
      work_hours_end: formData.work_hours_end,
      work_days: formData.work_days,
      show_weekends: formData.show_weekends,
      timezone: formData.timezone
    };

    const result = await updateSettings(updates);
    
    if (result) {
      onOpenChange(false);
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Instellingen laden...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kalender Instellingen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* View Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weergave Instellingen</CardTitle>
              <CardDescription>
                Pas aan hoe de kalender wordt weergegeven
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-view">Standaard Weergave</Label>
                <Select 
                  value={formData.default_view} 
                  onValueChange={(value) => handleInputChange('default_view', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {viewOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-weekends"
                  checked={formData.show_weekends}
                  onCheckedChange={(checked) => handleInputChange('show_weekends', checked)}
                />
                <Label htmlFor="show-weekends">Weekenden weergeven</Label>
              </div>
            </CardContent>
          </Card>

          {/* Work Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Werktijden</CardTitle>
              <CardDescription>
                Stel je werkdagen en -uren in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work-start">Start Tijd</Label>
                  <Input
                    id="work-start"
                    type="time"
                    value={formData.work_hours_start}
                    onChange={(e) => handleInputChange('work_hours_start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-end">Eind Tijd</Label>
                  <Input
                    id="work-end"
                    type="time"
                    value={formData.work_hours_end}
                    onChange={(e) => handleInputChange('work_hours_end', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Werkdagen</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Badge
                      key={day.value}
                      variant={formData.work_days.includes(day.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleWorkDayToggle(day.value)}
                    >
                      {day.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meldingen</CardTitle>
              <CardDescription>
                Configureer standaard herinneringen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-reminder">Standaard Herinnering</Label>
                <Select 
                  value={formData.default_reminder_minutes.toString()} 
                  onValueChange={(value) => handleInputChange('default_reminder_minutes', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Systeem Instellingen</CardTitle>
              <CardDescription>
                Basis systeeminstellingen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Tijdzone</Label>
                <Select 
                  value={formData.timezone} 
                  onValueChange={(value) => handleInputChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Amsterdam">Nederland (Amsterdam)</SelectItem>
                    <SelectItem value="Europe/Brussels">België (Brussel)</SelectItem>
                    <SelectItem value="Europe/Berlin">Duitsland (Berlijn)</SelectItem>
                    <SelectItem value="Europe/London">Verenigd Koninkrijk (Londen)</SelectItem>
                    <SelectItem value="Europe/Paris">Frankrijk (Parijs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-1"
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};