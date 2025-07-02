import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MobileTimeRegistrationProps {
  projectId: string;
}

export const MobileTimeRegistration: React.FC<MobileTimeRegistrationProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [hoursType, setHoursType] = useState('normaal');
  const [manualHours, setManualHours] = useState('');

  const handleStartTracking = () => {
    setStartTime(new Date());
    setIsTracking(true);
    toast({
      title: "Timer gestart",
      description: "Tijdsregistratie is begonnen",
    });
  };

  const handleStopTracking = async () => {
    if (!startTime || !user) return;

    const endTime = new Date();
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    try {
      const { error } = await supabase
        .from('project_registrations')
        .insert({
          project_id: projectId,
          user_id: user.id,
          registration_type: 'hours',
          description: description || 'Werkzaamheden uitgevoerd',
          hours_type: hoursType,
          quantity: durationHours,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Tijd geregistreerd",
        description: `${durationHours.toFixed(2)} uur geregistreerd`,
      });

      setIsTracking(false);
      setStartTime(null);
      setDescription('');
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het registreren van de tijd",
        variant: "destructive",
      });
    }
  };

  const handleManualEntry = async () => {
    if (!user || !manualHours) return;

    try {
      const { error } = await supabase
        .from('project_registrations')
        .insert({
          project_id: projectId,
          user_id: user.id,
          registration_type: 'hours',
          description: description || 'Werkzaamheden uitgevoerd',
          hours_type: hoursType,
          quantity: parseFloat(manualHours),
        });

      if (error) throw error;

      toast({
        title: "Tijd geregistreerd",
        description: `${manualHours} uur geregistreerd`,
      });

      setDescription('');
      setManualHours('');
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het registreren van de tijd",
        variant: "destructive",
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCurrentDuration = () => {
    if (!startTime) return '00:00';
    const now = new Date();
    const duration = now.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Active Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTracking && startTime && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-mono font-bold text-green-700">
                {getCurrentDuration()}
              </div>
              <div className="text-sm text-green-600">
                Gestart om {formatTime(startTime)}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!isTracking ? (
              <Button 
                onClick={handleStartTracking}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            ) : (
              <Button 
                onClick={handleStopTracking}
                variant="destructive"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Timer
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="hours-type">Type uren</Label>
              <Select value={hoursType} onValueChange={setHoursType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normaal">Normale uren</SelectItem>
                  <SelectItem value="overwerk">Overwerk</SelectItem>
                  <SelectItem value="avond">Avonduren</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Wat heb je gedaan?"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Handmatige invoer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="manual-hours">Aantal uren</Label>
            <Input
              id="manual-hours"
              type="number"
              step="0.25"
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              placeholder="Bijv. 2.5"
            />
          </div>

          <Button 
            onClick={handleManualEntry}
            disabled={!manualHours}
            className="w-full"
          >
            Registreer handmatig
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};