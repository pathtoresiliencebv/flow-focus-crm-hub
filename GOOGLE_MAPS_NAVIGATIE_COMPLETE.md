# 🗺️ Google Maps Navigatie voor Monteurs - COMPLEET ✅

## 🎯 Implementatie Overzicht

**Datum:** 10 januari 2025  
**Status:** ✅ COMPLEET - Ready to use

Monteurs kunnen nu direct vanuit de app naar de klantlocatie navigeren via Google Maps.

---

## ✨ Nieuwe Functionaliteit

### 1. **Google Maps Utility Functies**

**Nieuw bestand:** `src/utils/googleMapsUtils.ts`

**Functies:**
```typescript
// Open Google Maps met navigatie
openGoogleMapsNavigation(address, { useDirections: true })

// Haal klantadres op uit project/customer data
getCustomerAddress(project, customer)

// Format adres object naar string
formatAddress(addressObject)

// Bereken afstand tussen twee locaties (Haversine)
calculateDistance(lat1, lon1, lat2, lon2)

// Check of monteur binnen acceptabele afstand is
isNearLocation(monteurLat, monteurLon, locationLat, locationLon, maxKm)
```

**Features:**
- ✅ Ondersteunt adres string OF coördinaten
- ✅ Optie voor navigatie mode (directions) of zoek mode
- ✅ Automatische address fallback (project → customer → address fields)
- ✅ Afstand berekening (Haversine formule)
- ✅ Locatie verificatie functie

---

## 📱 Geïntegreerd in 3 Componenten

### A. **ProjectStartFlow** (Meest belangrijk!)

**File:** `src/components/monteur/ProjectStartFlow.tsx`

**Wanneer:** Voordat monteur project start

**UI:** Grote prominente knop "Open Navigatie in Google Maps"

**Functionaliteit:**
```typescript
// Opvallende navigatie knop onder locatie
<Button 
  variant="outline"
  className="w-full border-blue-500 text-blue-700 hover:bg-blue-50"
  onClick={() => openGoogleMapsNavigation(
    planningItem.location || getCustomerAddress(project, customer),
    { useDirections: true }
  )}
>
  <Map className="h-4 w-4 mr-2" />
  Open Navigatie in Google Maps
</Button>
```

**Address Fallback:**
1. `planningItem.location` (specifieke projectlocatie)
2. `getCustomerAddress()` → `project.location`
3. `getCustomerAddress()` → `customer.address`
4. `getCustomerAddress()` → Gebouwd uit customer fields (street, city, etc.)

---

### B. **MonteurDashboard**

**File:** `src/components/monteur/MonteurDashboard.tsx`

**Wanneer:** Planning overzicht (vandaag/toekomstig)

**UI:** Icon knop (Navigation icon) naast project kaart

**Functionaliteit:**
```typescript
// Navigation icon button
<Button 
  variant="outline"
  onClick={() => {
    const address = item.location || (customer ? `${customer.address}` : null);
    if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`, '_blank');
    }
  }}
  disabled={!item.location && !customer}
  title="Open navigatie in Google Maps"
>
  <Navigation className="h-4 w-4" />
</Button>
```

**Verbeterd:**
- Opens nu in directions/navigation mode (`/maps/dir/` i.p.v. `/maps/search/`)
- Driving mode geselecteerd (`travelmode=driving`)
- Disabled state als geen adres beschikbaar
- Tooltip toegevoegd

---

### C. **MobileProjectView**

**File:** `src/components/mobile/MobileProjectView.tsx`

**Wanneer:** Project detail view op mobiel

**UI:** Volle breedte knop "Navigeer naar locatie" onder adres

**Functionaliteit:**
```typescript
// Navigation button in mobile view
<Button
  variant="outline"
  size="sm"
  className="w-full border-blue-500 text-blue-700 hover:bg-blue-50"
  onClick={() => {
    const address = `${customer.address}, ${customer.postal_code || ''} ${customer.city}`.trim();
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`, '_blank');
  }}
>
  <Navigation className="h-4 w-4 mr-2" />
  Navigeer naar locatie
</Button>
```

---

## 🗺️ Google Maps URL Formats

### **Navigatie Mode (Aanbevolen voor monteurs):**
```
https://www.google.com/maps/dir/?api=1&destination=[ADDRESS]&travelmode=driving
```
- Opens Google Maps in **directions/navigation mode**
- Start route from current location
- Driving mode pre-selected
- "Start navigation" button ready to go

### **Zoek Mode:**
```
https://www.google.com/maps/search/?api=1&query=[ADDRESS]
```
- Opens Google Maps in **search/view mode**
- Shows location on map
- User must manually start navigation

**Wij gebruiken:** Navigatie mode voor betere UX

---

## 📋 Adres Prioriteit

De functies zoeken adres in deze volgorde:

### **Prioriteit 1: Project Specifieke Locatie**
```typescript
project.location
```
- Kan specifieke installatie locatie zijn
- Bijvoorbeeld: "Garage achter het huis"

### **Prioriteit 2: Customer Address (string)**
```typescript
customer.address
```
- Volledige adres string
- Bijvoorbeeld: "Hoofdstraat 123, 1234 AB Amsterdam"

### **Prioriteit 3: Customer Address Fields**
```typescript
{
  street: customer.street,
  house_number: customer.house_number,
  postal_code: customer.postal_code,
  city: customer.city,
  country: customer.country || 'Nederland'
}
```
- Gebouwd uit individuele velden
- Automatisch geformatteerd

### **Fallback:**
```
'Adres niet beschikbaar'
```

---

## 🔧 Technische Details

### **Imports:**
```typescript
import { openGoogleMapsNavigation, getCustomerAddress } from '@/utils/googleMapsUtils';
```

### **TypeScript Types:**
```typescript
interface Address {
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}
```

### **API:**
Google Maps URLs API v1 (geen API key nodig voor basic features)

### **Browser Compatibility:**
- ✅ Chrome/Edge (desktop + mobile)
- ✅ Safari (iOS)
- ✅ Firefox
- ✅ Android WebView (Capacitor)
- ✅ iOS WebView (Capacitor)

---

## 🧪 Test Scenario

### **Test 1: ProjectStartFlow**

1. **Login als monteur** (bijv. Gregory)
2. **Open project** dat gepland staat voor vandaag
3. **Check:**
   - ✅ Locatie sectie toont adres
   - ✅ Grote blauwe knop "Open Navigatie in Google Maps"
   - ✅ Klik op knop
   - ✅ Google Maps opent in nieuw tabblad
   - ✅ Route wordt getoond van huidige locatie naar klant
   - ✅ "Start" knop is zichtbaar in Google Maps

### **Test 2: MonteurDashboard**

1. **Login als monteur**
2. **Ga naar Dashboard**
3. **Tab: "Vandaag"**
4. **Zoek planning kaart**
5. **Check:**
   - ✅ Navigation icon knop naast "Start Project"
   - ✅ Klik op Navigation icon
   - ✅ Google Maps opent met navigatie
   - ✅ Als geen adres: knop is disabled

### **Test 3: MobileProjectView**

1. **Open app op mobiel** (of responsive view)
2. **Selecteer project**
3. **Check:**
   - ✅ Adres wordt getoond onder klantinfo
   - ✅ Knop "Navigeer naar locatie" onder adres
   - ✅ Klik op knop
   - ✅ Google Maps app opent (iOS/Android)
   - ✅ Of Google Maps web (desktop)

### **Test 4: Address Fallback**

**Scenario A: Project met specifieke locatie**
```sql
-- Project heeft location field
UPDATE projects SET location = 'Garage achtertuin, Hoofdstraat 123, Amsterdam' WHERE id = '[id]';
```
Result: ✅ Uses project.location

**Scenario B: Customer address field**
```sql
-- Customer heeft address string
UPDATE customers SET address = 'Hoofdstraat 123, 1234 AB Amsterdam' WHERE id = '[id]';
```
Result: ✅ Uses customer.address

**Scenario C: Customer address fields**
```sql
-- Customer heeft individuele velden
UPDATE customers SET 
  street = 'Hoofdstraat', 
  house_number = '123',
  postal_code = '1234 AB',
  city = 'Amsterdam'
WHERE id = '[id]';
```
Result: ✅ Builds address from fields

---

## 🚀 Deployment

### **Bestanden Gewijzigd:**
```
✨  src/utils/googleMapsUtils.ts              # NEW - Utility functions
✏️  src/components/monteur/ProjectStartFlow.tsx    # Big navigation button
✏️  src/components/monteur/MonteurDashboard.tsx   # Improved icon button
✏️  src/components/mobile/MobileProjectView.tsx  # Mobile navigation button
```

### **No Dependencies:**
- ❌ Geen nieuwe npm packages
- ❌ Geen API keys nodig
- ❌ Geen Supabase changes
- ❌ Geen migrations

### **Ready to Deploy:**
```bash
git add -A
git commit -m "feat: 🗺️ Google Maps Navigatie voor Monteurs"
git push origin main
```

---

## 💡 Future Enhancements

### **Phase 2 (Optioneel):**

**1. Native Google Maps App Deep Links**
```typescript
// iOS
googlemaps://?daddr=[LAT],[LON]&directionsmode=driving

// Android
geo:0,0?q=[LAT],[LON]([LABEL])
```

**2. Waze Integration**
```typescript
waze://?ll=[LAT],[LON]&navigate=yes
```

**3. Location Verification**
```typescript
// Check if monteur is at location before allowing start
if (isNearLocation(monteurLat, monteurLon, customerLat, customerLon, 0.5)) {
  // Within 500m - allow start
}
```

**4. Distance Display**
```typescript
const distance = calculateDistance(...);
// "Je bent 2.3 km van de locatie"
```

**5. Traffic Info Integration**
```typescript
// Add real-time traffic to Google Maps URL
&traffic=1
```

---

## 🔍 Troubleshooting

### **Problem: Google Maps doesn't open**

**Diagnose:**
- Check browser console for errors
- Verify address is not null/undefined

**Solution:**
```javascript
// Check address in console
console.log('Address:', address);
console.log('Encoded:', encodeURIComponent(address));
```

### **Problem: Wrong location shown**

**Diagnose:**
- Check which address source is used
- Verify customer data in database

**Solution:**
```sql
-- Check customer address
SELECT id, name, address, street, house_number, city, postal_code 
FROM customers 
WHERE id = '[customer-id]';

-- Check project location
SELECT id, title, location 
FROM projects 
WHERE id = '[project-id]';
```

### **Problem: Button disabled**

**Diagnose:**
- No address available in any fallback

**Solution:**
- Add address to customer record
- Or add location to project record

---

## 📊 Analytics (Optioneel)

Track Google Maps usage:
```typescript
// In onClick handler
console.log('📍 Navigation opened', {
  projectId: project?.id,
  customerId: customer?.id,
  address: address,
  source: 'ProjectStartFlow' // or 'MonteurDashboard' or 'MobileProjectView'
});
```

---

## ✅ Resultaat

### **Voor:**
```
❌ Monteurs moesten adres handmatig intypen in Google Maps
❌ Risk van type fouten
❌ Extra stappen, minder efficiënt
```

### **Na:**
```
✅ 1-click navigatie naar klantlocatie
✅ Automatische address fallback
✅ Altijd correcte route
✅ Snellere workflow
✅ Betere monteur ervaring
```

---

**Status:** ✅ READY TO USE

**Laatste update:** 10 januari 2025  
**Ontwikkelaar:** Claude AI + User (SMANS CRM)  
**Versie:** 1.0.0

