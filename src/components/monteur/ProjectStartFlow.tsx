import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Play,
  Loader2
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProjectStartFlowProps {
  planningId: string;
  onProjectStarted?: (workTimeLogId: string) => void;
}

interface LocationState {
  checking: boolean;
  granted: boolean;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  error: string | null;
}

export function ProjectStartFlow({ planningId, onProjectStarted }: ProjectStartFlowProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [planningItem, setPlanningItem] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  
  const [locationState, setLocationState] = useState<LocationState>({
    checking: false,
    granted: false,
    coords: null,
    error: null
  });

  // Fetch planning and related data
  useEffect(() => {
    fetchPlanningData();
  }, [planningId]);

  const fetchPlanningData = async () => {
    try {
      setLoading(true);

      // Fetch planning item
      const { data: planningData, error: planningError } = await supabase
        .from('planning_items')
        .select('*')
        .eq('id', planningId)
        .single();

      if (planningError) throw planningError;
      setPlanningItem(planningData);

      // Fetch project if exists
      if (planningData.project_id) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', planningData.project_id)
          .single();

        if (!projectError) {
          setProject(projectData);
        }
      }

      // Fetch customer if exists
      if (planningData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', planningData.customer_id)
          .single();

        if (!customerError) {
          setCustomer(customerData);
        }
      }
    } catch (error) {
      console.error('Error fetching planning data:', error);
      toast({
        title: "Fout bij ophalen data",
        description: "Kan planning informatie niet ophalen.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    setLocationState(prev => ({ ...prev, checking: true, error: null }));

    if (!navigator.geolocation) {
      setLocationState(prev => ({
        ...prev,
        checking: false,
        error: 'GPS niet beschikbaar op dit apparaat'
      }));
      return false;
    }

    try {
      // Request permission
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      setLocationState({
        checking: false,
        granted: true,
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        },
        error: null
      });

      return true;
    } catch (error: any) {
      let errorMessage = 'Kan locatie niet ophalen';
      
      if (error.code === 1) {
        errorMessage = 'GPS toestemming geweigerd. Sta locatietoegang toe in je browser.';
      } else if (error.code === 2) {
        errorMessage = 'Locatie niet beschikbaar. Controleer je GPS instellingen.';
      } else if (error.code === 3) {
        errorMessage = 'GPS timeout. Probeer het opnieuw.';
      }

      setLocationState({
        checking: false,
        granted: false,
        coords: null,
        error: errorMessage
      });

      return false;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const startProject = async () => {
    if (!locationState.granted || !locationState.coords) {
      toast({
        title: "GPS vereist",
        description: "Check eerst je locatie voordat je het project start.",
        variant: "destructive"
      });
      return;
    }

    try {
      setStarting(true);

      // Create work time log
      const { data: workTimeLog, error: workTimeError } = await supabase
        .from('work_time_logs')
        .insert({
          planning_id: planningId,
          project_id: project?.id || null,
          user_id: user?.id,
          start_time: new Date().toISOString(),
          start_location_lat: locationState.coords.latitude,
          start_location_lon: locationState.coords.longitude,
          start_location_accuracy: locationState.coords.accuracy,
          status: 'active'
        })
        .select()
        .single();

      if (workTimeError) throw workTimeError;

      // Update project status if exists
      if (project) {
        const { error: projectUpdateError } = await supabase
          .from('projects')
          .update({ status: 'in-uitvoering' })
          .eq('id', project.id);

        if (projectUpdateError) {
          console.error('Error updating project status:', projectUpdateError);
        }
      }

      // Update planning status
      const { error: planningUpdateError } = await supabase
        .from('planning_items')
        .update({ status: 'in-uitvoering' })
        .eq('id', planningId);

      if (planningUpdateError) {
        console.error('Error updating planning status:', planningUpdateError);
      }

      toast({
        title: "✅ Project gestart!",
        description: "Timer is gestart. Succes met je werk!",
      });

      if (onProjectStarted) {
        onProjectStarted(workTimeLog.id);
      } else {
        navigate(`/monteur/project-work/${workTimeLog.id}`);
      }
    } catch (error) {
      console.error('Error starting project:', error);
      toast({
        title: "❌ Fout bij starten project",
        description: "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive"
      });
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!planningItem) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Planning item niet gevonden.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Project Starten
        </h1>
        <p className="text-gray-600">
          Volg de stappen om je project te starten
        </p>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {planningItem.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {planningItem.description && (
            <p className="text-sm text-gray-600">{planningItem.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Start:</span> {planningItem.start_time?.substring(0, 5)}
            </div>
            <div>
              <span className="font-medium">Eind:</span> {planningItem.end_time?.substring(0, 5)}
            </div>
          </div>

          {customer && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1">Klant</h4>
              <p className="text-sm">{customer.name}</p>
              {customer.phone && (
                <p className="text-xs text-gray-600">{customer.phone}</p>
              )}
            </div>
          )}

          {planningItem.location && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Locatie</p>
                  <p className="text-sm text-gray-700">{planningItem.location}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(planningItem.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <Navigation className="h-3 w-3" />
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          )}

          {planningItem.special_instructions && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Let op:</strong> {planningItem.special_instructions}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* GPS Check Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Stap 1: GPS Check-in
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            We hebben je locatie nodig om je aankomst te registreren.
          </p>

          {!locationState.granted && !locationState.error && (
            <Button 
              onClick={requestLocationPermission}
              disabled={locationState.checking}
              className="w-full"
              size="lg"
            >
              {locationState.checking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Locatie opvragen...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Check Mijn Locatie
                </>
              )}
            </Button>
          )}

          {locationState.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {locationState.error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={requestLocationPermission}
                  className="mt-2 w-full"
                >
                  Opnieuw proberen
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {locationState.granted && locationState.coords && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong className="text-green-800">Locatie bevestigd!</strong>
                <div className="text-xs text-green-700 mt-1">
                  Nauwkeurigheid: {Math.round(locationState.coords.accuracy)}m
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Start Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Stap 2: Start Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Zodra je start, begint de timer automatisch te lopen.
          </p>
          
          <Button 
            onClick={startProject}
            disabled={!locationState.granted || starting}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {starting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Project starten...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Project Nu
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

