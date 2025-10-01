import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarEvent, CreateCalendarEventData } from '@/hooks/useCalendarEvents';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/permissions';

interface EventCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onEventCreate: (eventData: CreateCalendarEventData) => Promise<CalendarEvent | null>;
  editEvent?: CalendarEvent;
}

const categoryOptions = [
  { value: 'werk', label: 'Werk', color: '#3b82f6' },
  { value: 'persoonlijk', label: 'Persoonlijk', color: '#10b981' },
  { value: 'vakantie', label: 'Vakantie', color: '#8b5cf6' },
  { value: 'meeting', label: 'Meeting', color: '#f59e0b' },
  { value: 'project', label: 'Project', color: '#ef4444' },
  { value: 'reminder', label: 'Reminder', color: '#eab308' },
  { value: 'deadline', label: 'Deadline', color: '#dc2626' }
];

const privacyOptions = [
  { value: 'private', label: 'Privé' },
  { value: 'shared', label: 'Gedeeld' },
  { value: 'public', label: 'Openbaar' }
];

export const EventCreateDialog: React.FC<EventCreateDialogProps> = ({
  open,
  onOpenChange,
  selectedDate,
  onEventCreate,
  editEvent
}) => {
  const { toast } = useToast();
  const { users } = useUsers();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const isAdmin = hasPermission('users_view');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    is_all_day: false,
    location: '',
    category: 'persoonlijk' as CalendarEvent['category'],
    privacy_level: 'private' as CalendarEvent['privacy_level'],
    color_code: '#10b981',
    assigned_to_role: '' as UserRole | '',
    assigned_to_user: '',
    is_team_event: false
  });

  // Initialize form when dialog opens or edit event changes
  useEffect(() => {
    if (editEvent) {
      const startDate = new Date(editEvent.start_datetime);
      const endDate = new Date(editEvent.end_datetime);
      
      setFormData({
        title: editEvent.title,
        description: editEvent.description || '',
        start_date: format(startDate, 'yyyy-MM-dd'),
        start_time: editEvent.is_all_day ? '09:00' : format(startDate, 'HH:mm'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        end_time: editEvent.is_all_day ? '17:00' : format(endDate, 'HH:mm'),
        is_all_day: editEvent.is_all_day,
        location: editEvent.location || '',
        category: editEvent.category,
        privacy_level: editEvent.privacy_level,
        color_code: editEvent.color_code,
        assigned_to_role: editEvent.assigned_to_role || '',
        assigned_to_user: editEvent.assigned_to_user || '',
        is_team_event: editEvent.is_team_event
      });
    } else if (selectedDate) {
      const date = format(selectedDate, 'yyyy-MM-dd');
      const time = selectedDate instanceof Date ? format(selectedDate, 'HH:mm') : '09:00';
      const endTime = selectedDate instanceof Date ? 
        format(new Date(selectedDate.getTime() + 60 * 60 * 1000), 'HH:mm') : '10:00';
      
      setFormData({
        title: '',
        description: '',
        start_date: date,
        start_time: time,
        end_date: date,
        end_time: endTime,
        is_all_day: false,
        location: '',
        category: 'persoonlijk',
        privacy_level: 'private',
        color_code: '#10b981',
        assigned_to_role: '',
        assigned_to_user: '',
        is_team_event: false
      });
    }
  }, [editEvent, selectedDate, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update color when category changes
    if (field === 'category') {
      const category = categoryOptions.find(c => c.value === value);
      if (category) {
        setFormData(prev => ({ ...prev, color_code: category.color }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Validatiefout",
        description: "Titel is verplicht.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let startDateTime: string;
      let endDateTime: string;

      if (formData.is_all_day) {
        // All-day events
        startDateTime = `${formData.start_date}T00:00:00`;
        endDateTime = `${formData.end_date}T23:59:59`;
      } else {
        // Timed events
        startDateTime = `${formData.start_date}T${formData.start_time}:00`;
        endDateTime = `${formData.end_date}T${formData.end_time}:00`;
      }

      const eventData: CreateCalendarEventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        is_all_day: formData.is_all_day,
        location: formData.location.trim() || undefined,
        category: formData.category,
        privacy_level: formData.privacy_level,
        color_code: formData.color_code,
        assigned_to_role: formData.assigned_to_role || undefined,
        assigned_to_user: formData.assigned_to_user || undefined,
        is_team_event: formData.is_team_event
      };

      const result = await onEventCreate(eventData);
      
      if (result) {
        onOpenChange(false);
        // Reset form
        setFormData({
          title: '',
          description: '',
          start_date: '',
          start_time: '',
          end_date: '',
          end_time: '',
          is_all_day: false,
          location: '',
          category: 'persoonlijk',
          privacy_level: 'private',
          color_code: '#10b981',
          assigned_to_role: '',
          assigned_to_user: '',
          is_team_event: false
        });
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editEvent ? 'Event Bewerken' : 'Nieuw Agenda Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Event titel"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Event beschrijving"
              rows={3}
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="all-day"
              checked={formData.is_all_day}
              onCheckedChange={(checked) => handleInputChange('is_all_day', checked)}
            />
            <Label htmlFor="all-day">Hele dag</Label>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Datum</Label>
              <Input
                id="start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>
            
            {!formData.is_all_day && (
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Tijd</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end-date">Eind Datum</Label>
              <Input
                id="end-date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                required
              />
            </div>
            
            {!formData.is_all_day && (
              <div className="space-y-2">
                <Label htmlFor="end-time">Eind Tijd</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Locatie</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Event locatie"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categorie</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: option.color }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Privacy Level */}
          <div className="space-y-2">
            <Label htmlFor="privacy">Privacy</Label>
            <Select value={formData.privacy_level} onValueChange={(value) => handleInputChange('privacy_level', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {privacyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Assignment - Only for admins */}
          {isAdmin && (
            <>
              {/* Team Event Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="team-event"
                  checked={formData.is_team_event}
                  onCheckedChange={(checked) => handleInputChange('is_team_event', checked)}
                />
                <Label htmlFor="team-event">Team Event</Label>
              </div>

              {/* Role Assignment */}
              {formData.is_team_event && (
                <div className="space-y-2">
                  <Label htmlFor="assigned-role">Toegewezen aan Rol</Label>
                  <Select value={formData.assigned_to_role} onValueChange={(value) => handleInputChange('assigned_to_role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Geen rol</SelectItem>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Installateur">Installateur</SelectItem>
                      <SelectItem value="Administratie">Administratie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* User Assignment */}
              <div className="space-y-2">
                <Label htmlFor="assigned-user">Toegewezen aan Gebruiker</Label>
                <Select value={formData.assigned_to_user} onValueChange={(value) => handleInputChange('assigned_to_user', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer gebruiker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Geen gebruiker</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuleren
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Bezig...' : (editEvent ? 'Bijwerken' : 'Aanmaken')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};