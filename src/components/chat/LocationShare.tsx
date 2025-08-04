import { useState, useEffect } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface LocationShareProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationShare: (location: { latitude: number; longitude: number; address?: string }) => void;
}

export const LocationShare = ({ isOpen, onClose, onLocationShare }: LocationShareProps) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const { toast } = useToast();

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocatie wordt niet ondersteund door deze browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Try to get address using reverse geocoding
      let address = '';
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=nl`
        );
        const data = await response.json();
        address = data.display_name || `${data.city || ''} ${data.principalSubdivision || ''}`.trim();
      } catch (error) {
        console.warn('Could not get address:', error);
      }

      setCurrentLocation({ latitude, longitude, address });
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      let errorMessage = 'Kon locatie niet ophalen';
      
      if (error.code === 1) {
        errorMessage = 'Locatie toegang geweigerd. Geef toestemming in je browser instellingen.';
      } else if (error.code === 2) {
        errorMessage = 'Locatie niet beschikbaar';
      } else if (error.code === 3) {
        errorMessage = 'Locatie ophalen time-out';
      }
      
      toast({
        title: "Locatie Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleShareLocation = () => {
    if (currentLocation) {
      onLocationShare(currentLocation);
      setCurrentLocation(null);
    }
  };

  const handleClose = () => {
    setCurrentLocation(null);
    onClose();
  };

  // Auto-get location when dialog opens
  useEffect(() => {
    if (isOpen && !currentLocation && !isGettingLocation) {
      getCurrentLocation();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Locatie Delen
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isGettingLocation && (
            <div className="text-center p-8">
              <Navigation className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Huidige locatie ophalen...
              </p>
            </div>
          )}

          {currentLocation && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Huidige Locatie</h4>
                    {currentLocation.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentLocation.address}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Lat: {currentLocation.latitude.toFixed(6)}, 
                      Lng: {currentLocation.longitude.toFixed(6)}
                    </p>
                    <a 
                      href={`https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Bekijk op Google Maps
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleShareLocation} className="flex-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  Locatie Delen
                </Button>
                <Button variant="outline" onClick={getCurrentLocation} disabled={isGettingLocation}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Vernieuwen
                </Button>
              </div>
            </div>
          )}

          {!isGettingLocation && !currentLocation && (
            <div className="text-center p-8">
              <MapPin className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Kon locatie niet ophalen
              </p>
              <Button onClick={getCurrentLocation}>
                <Navigation className="h-4 w-4 mr-2" />
                Opnieuw Proberen
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Je locatie wordt alleen gedeeld met de persoon waarmee je chat
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};