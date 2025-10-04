import { useState, useEffect } from 'react';

interface DeliveryMetadata {
  timestamp: string;
  date: string;
  time: string;
  location: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  } | null;
  ipAddress: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useDeliveryMetadata = () => {
  const [metadata, setMetadata] = useState<DeliveryMetadata>({
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: new Date().toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    location: null,
    ipAddress: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Get IP Address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        // Get GPS Location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Reverse geocoding to get address
              let address = null;
              try {
                const geoResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const geoData = await geoResponse.json();
                address = geoData.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              } catch (e) {
                address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              }
              
              setMetadata(prev => ({
                ...prev,
                location: { latitude, longitude, address },
                ipAddress: ipData.ip,
                isLoading: false
              }));
            },
            (error) => {
              console.error('GPS error:', error);
              setMetadata(prev => ({
                ...prev,
                ipAddress: ipData.ip,
                isLoading: false,
                error: 'Locatie niet beschikbaar'
              }));
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          setMetadata(prev => ({
            ...prev,
            ipAddress: ipData.ip,
            isLoading: false,
            error: 'GPS niet ondersteund'
          }));
        }
      } catch (error) {
        console.error('Metadata fetch error:', error);
        setMetadata(prev => ({
          ...prev,
          isLoading: false,
          error: 'Kon metadata niet ophalen'
        }));
      }
    };

    fetchMetadata();
  }, []);

  return metadata;
};

