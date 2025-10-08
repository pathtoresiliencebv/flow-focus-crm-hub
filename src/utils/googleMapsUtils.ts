/**
 * Google Maps Navigation Utilities
 * Helper functions for opening Google Maps with addresses or coordinates
 */

export interface Address {
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

/**
 * Opens Google Maps with navigation to the specified address or location
 * @param address - Full address string or Address object
 * @param options - Optional settings for the maps link
 */
export function openGoogleMapsNavigation(
  address: string | Address | null | undefined,
  options?: {
    useDirections?: boolean; // If true, opens in directions mode (default: false)
    latitude?: number;
    longitude?: number;
  }
): void {
  if (!address && (!options?.latitude || !options?.longitude)) {
    console.warn('No address or coordinates provided for Google Maps');
    return;
  }

  let mapsUrl: string;

  // If coordinates are provided, use them (more accurate)
  if (options?.latitude && options?.longitude) {
    const coords = `${options.latitude},${options.longitude}`;
    
    if (options.useDirections) {
      // Open in navigation/directions mode
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=driving`;
    } else {
      // Open in search/view mode
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords}`;
    }
  } else {
    // Use address string
    const addressString = typeof address === 'string' 
      ? address 
      : formatAddress(address as Address);
    
    const encodedAddress = encodeURIComponent(addressString);
    
    if (options?.useDirections) {
      // Open in navigation/directions mode
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
    } else {
      // Open in search/view mode
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }
  }

  // Open in new window/tab
  window.open(mapsUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Formats an Address object into a readable address string
 * @param address - Address object with street, city, etc.
 * @returns Formatted address string
 */
export function formatAddress(address: Address): string {
  const parts: string[] = [];
  
  if (address.street) {
    const streetPart = address.house_number 
      ? `${address.street} ${address.house_number}`
      : address.street;
    parts.push(streetPart);
  }
  
  if (address.postal_code || address.city) {
    const cityPart = [address.postal_code, address.city]
      .filter(Boolean)
      .join(' ');
    parts.push(cityPart);
  }
  
  if (address.country) {
    parts.push(address.country);
  }
  
  return parts.join(', ');
}

/**
 * Gets the customer's address from project or customer data
 * @param project - Project object
 * @param customer - Customer object
 * @returns Address string or null
 */
export function getCustomerAddress(project: any, customer: any): string | null {
  // Priority 1: Project location (can be specific install location)
  if (project?.location) {
    return project.location;
  }
  
  // Priority 2: Customer address (from customer object)
  if (customer?.address) {
    return customer.address;
  }
  
  // Priority 3: Build from customer address fields
  if (customer) {
    const addressObj: Address = {
      street: customer.street,
      house_number: customer.house_number,
      city: customer.city,
      postal_code: customer.postal_code,
      country: customer.country || 'Nederland'
    };
    
    const formatted = formatAddress(addressObj);
    if (formatted) return formatted;
  }
  
  return null;
}

/**
 * Calculates distance between two GPS coordinates (Haversine formula)
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Checks if monteur is within acceptable distance from location (for location verification)
 * @param monteurLat - Monteur's latitude
 * @param monteurLon - Monteur's longitude
 * @param locationLat - Location latitude
 * @param locationLon - Location longitude
 * @param maxDistanceKm - Maximum acceptable distance in km (default: 5)
 * @returns true if within acceptable distance
 */
export function isNearLocation(
  monteurLat: number,
  monteurLon: number,
  locationLat: number,
  locationLon: number,
  maxDistanceKm: number = 5
): boolean {
  const distance = calculateDistance(monteurLat, monteurLon, locationLat, locationLon);
  return distance <= maxDistanceKm;
}

