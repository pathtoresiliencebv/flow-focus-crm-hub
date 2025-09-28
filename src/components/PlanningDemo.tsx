import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, Plus } from 'lucide-react';

export const PlanningDemo: React.FC = () => {
  const { user } = useAuth();
  const { syncPlanningToGoogle } = useGoogleCalendar();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: ''
  });

  const handleCreatePlanningItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    try {
      // Create planning item
      const { error } = await supabase
        .from('planning_items')
        .insert([{
          assigned_user_id: user.id,
          user_id: user.id,
          title: formData.title,
          description: formData.description || '',
          start_date: formData.start_time.split('T')[0],
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location || ''
        }]);

      if (error) throw error;

      toast.success('Planning item aangemaakt!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: ''
      });

      // Trigger sync to Google Calendar
      await syncPlanningToGoogle();
      
    } catch (error) {
      console.error('Error creating planning item:', error);
      toast.error('Fout bij aanmaken planning item');
    } finally {
      setIsCreating(false);
    }
  };

  const createSamplePlanningItem = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      const { error } = await supabase
        .from('planning_items')
        .insert([{
          assigned_user_id: user.id,
          user_id: user.id,
          title: 'Test Installatie - Smans Onderhoud',
          description: 'Test planning item voor Google Calendar synchronisatie',
          start_date: tomorrow.toISOString().split('T')[0],
          start_time: tomorrow.toISOString(),
          end_time: endTime.toISOString(),
          location: 'Testlocatie, Amsterdam'
        }]);

      if (error) throw error;

      toast.success('Sample planning item aangemaakt!');
      
      // Trigger sync to Google Calendar
      await syncPlanningToGoogle();
      
    } catch (error) {
      console.error('Error creating sample item:', error);
      toast.error('Fout bij aanmaken sample item');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planning Items Demo
          </CardTitle>
          <CardDescription>
            Maak planning items aan om de Google Calendar synchronisatie te testen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Button onClick={createSamplePlanningItem} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Maak Sample Item
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Nieuw Planning Item</h3>
            <form onSubmit={handleCreatePlanningItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Planning titel"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Locatie</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Locatie"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beschrijving van de planning"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Tijd</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">Eind Tijd</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Bezig...' : 'Planning Item Aanmaken'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};