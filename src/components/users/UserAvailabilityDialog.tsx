import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Trash2, Plus } from 'lucide-react';
import { Profile } from '@/types/user';

interface UserAvailabilityDialogProps {
  user: Profile;
  open: boolean;
  onClose: () => void;
}

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start_time?: string;
  break_end_time?: string;
  notes?: string;
}

interface TimeOffRequest {
  id?: string;
  start_date: string;
  end_date: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
}

const DAYS = [
  { value: 1, label: 'Maandag' },
  { value: 2, label: 'Dinsdag' },
  { value: 3, label: 'Woensdag' },
  { value: 4, label: 'Donderdag' },
  { value: 5, label: 'Vrijdag' },
  { value: 6, label: 'Zaterdag' },
  { value: 0, label: 'Zondag' },
];

export function UserAvailabilityDialog({ user, open, onClose }: UserAvailabilityDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);

  useEffect(() => {
    if (open && user.id) {
      loadAvailability();
      loadTimeOff();
    }
  }, [open, user.id]);

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('user_availability')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast({
        title: "Fout bij laden beschikbaarheid",
        description: "Kon beschikbaarheid niet laden.",
        variant: "destructive",
      });
    }
  };

  const loadTimeOff = async () => {
    try {
      const { data, error } = await supabase
        .from('user_time_off')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setTimeOff(data || []);
    } catch (error) {
      console.error('Error loading time off:', error);
    }
  };

  const addDefaultWeekSchedule = async () => {
    setLoading(true);
    try {
      const defaultSchedule: Omit<AvailabilitySlot, 'id'>[] = DAYS
        .filter(d => d.value !== 0 && d.value !== 6) // Weekdays only
        .map(day => ({
          day_of_week: day.value,
          start_time: '08:00:00',
          end_time: '17:00:00',
          is_available: true,
          break_start_time: '12:00:00',
          break_end_time: '13:00:00',
        }));

      const { error } = await supabase
        .from('user_availability')
        .insert(
          defaultSchedule.map(slot => ({
            ...slot,
            user_id: user.id,
          }))
        );

      if (error) throw error;

      toast({
        title: "✅ Standaard werkweek toegevoegd",
        description: "Ma-Vr, 08:00-17:00 met 1 uur pauze",
      });

      loadAvailability();
    } catch (error) {
      console.error('Error adding default schedule:', error);
      toast({
        title: "Fout bij toevoegen schema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async (slot: AvailabilitySlot) => {
    try {
      if (slot.id) {
        const { error } = await supabase
          .from('user_availability')
          .update({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
            break_start_time: slot.break_start_time || null,
            break_end_time: slot.break_end_time || null,
            notes: slot.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', slot.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_availability')
          .insert({
            user_id: user.id,
            ...slot,
          });

        if (error) throw error;
      }

      toast({
        title: "✅ Beschikbaarheid opgeslagen",
      });

      loadAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Fout bij opslaan",
        variant: "destructive",
      });
    }
  };

  const deleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "✅ Tijdslot verwijderd",
      });

      loadAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        title: "Fout bij verwijderen",
        variant: "destructive",
      });
    }
  };

  const getDaySlots = (dayOfWeek: number) => {
    return availability.filter(slot => slot.day_of_week === dayOfWeek);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Beschikbaarheid: {user.full_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="weekly" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">📅 Wekelijks Schema</TabsTrigger>
            <TabsTrigger value="timeoff">🏖️ Vrij/Verlof</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Stel hier de standaard wekelijkse beschikbaarheid in
              </p>
              {availability.length === 0 && (
                <Button
                  onClick={addDefaultWeekSchedule}
                  disabled={loading}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Standaard Werkweek (Ma-Vr)
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {DAYS.map(day => {
                const slots = getDaySlots(day.value);
                return (
                  <Card key={day.value}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{day.label}</span>
                        {slots.length === 0 && (
                          <Badge variant="secondary">Niet ingesteld</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {slots.map((slot, idx) => (
                        <div
                          key={slot.id || idx}
                          className="flex items-center gap-2 p-3 border rounded-lg"
                        >
                          <Switch
                            checked={slot.is_available}
                            onCheckedChange={(checked) => {
                              const updated = { ...slot, is_available: checked };
                              saveAvailability(updated);
                            }}
                          />
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Van</Label>
                              <Input
                                type="time"
                                value={slot.start_time.slice(0, 5)}
                                onChange={(e) => {
                                  const updated = {
                                    ...slot,
                                    start_time: e.target.value + ':00',
                                  };
                                  saveAvailability(updated);
                                }}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Tot</Label>
                              <Input
                                type="time"
                                value={slot.end_time.slice(0, 5)}
                                onChange={(e) => {
                                  const updated = {
                                    ...slot,
                                    end_time: e.target.value + ':00',
                                  };
                                  saveAvailability(updated);
                                }}
                                className="h-8"
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => slot.id && deleteAvailability(slot.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {slots.length === 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const newSlot: AvailabilitySlot = {
                              day_of_week: day.value,
                              start_time: '08:00:00',
                              end_time: '17:00:00',
                              is_available: true,
                            };
                            saveAvailability(newSlot);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tijdslot toevoegen
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="timeoff" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Beheer verlof, vakantie en afwezigheid
              </p>
            </div>

            <div className="space-y-2">
              {timeOff.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Geen verlof aanvragen
                  </CardContent>
                </Card>
              ) : (
                timeOff.map(request => (
                  <Card key={request.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                request.status === 'approved'
                                  ? 'default'
                                  : request.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {request.status === 'approved'
                                ? '✅ Goedgekeurd'
                                : request.status === 'rejected'
                                ? '❌ Afgewezen'
                                : '⏳ In afwachting'}
                            </Badge>
                            <span className="text-sm font-medium">
                              {request.type === 'vacation' && '🏖️ Vakantie'}
                              {request.type === 'sick' && '🤒 Ziek'}
                              {request.type === 'personal' && '👤 Persoonlijk'}
                              {request.type === 'other' && '📋 Overig'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.start_date} t/m {request.end_date}
                          </p>
                          {request.reason && (
                            <p className="text-sm mt-1">{request.reason}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

