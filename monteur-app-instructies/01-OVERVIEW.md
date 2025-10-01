# Monteur App - Project Overview

## Huidige Situatie

Je hebt een **Expo app** opgezet met de volgende structuur:
- ✅ Expo Router configuratie
- ✅ AuthProvider en TranslationProvider
- ✅ React Query setup
- ✅ Basis screens: Dashboard, Offertes, Facturen, Settings
- ❌ **Nog geen Supabase integratie**
- ❌ **Placeholder content** in alle screens

## Wat Moet Gebeuren

De app moet **functioneel worden** door:
1. **Supabase integratie** - Database connectie opzetten
2. **Monteur-specifieke functionaliteit** toevoegen
3. **Real-time data** uit Supabase laden
4. **Offline support** (optioneel)

## Benodigde Screens voor Monteurs

### 1. Dashboard
- **Dagelijkse opdrachten** (vandaag ingeplande projecten)
- **Snelle acties** (tijd starten, foto's maken)
- **Statistieken** (uren deze week, afgesloten projecten)

### 2. Projecten
- **Toegewezen projecten** lijst
- **Project details** (klant, adres, werkzaamheden)
- **Status updates** (gestart, in uitvoering, afgerond)
- **Foto's uploaden** van werkzaamheden

### 3. Tijd Registratie
- **Uren bijhouden** per project
- **Start/Stop functie** voor dagelijkse werkzaamheden
- **Pauzes** registreren
- **Overzicht** van gewerkte uren

### 4. Chat (optioneel)
- **Communicatie** met kantoor
- **Project-specifieke berichten**
- **Real-time updates**

## Database Tabellen (Supabase)

### Belangrijkste Tabellen:
```sql
- profiles (monteurs info)
- projects (projecten toegewezen aan monteur)
- planning_items (ingeplande werkzaamheden)
- time_entries (uren registratie)
- project_photos (foto's van werk)
- direct_messages (chat berichten)
```

## Supabase Configuratie

### Environment Variables (.env):
```bash
EXPO_PUBLIC_SUPABASE_URL=https://pvesgvkyiaqmsudmmtkc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Row Level Security (RLS):
- Monteurs zien **alleen hun eigen projecten**
- Filter op `assigned_user_id = auth.uid()`
- Alleen eigen tijd registraties aanpassen

## Tech Stack

### Frontend (Expo):
- **React Native** - Native UI components
- **Expo Router** - File-based routing
- **React Query** - Data fetching & caching
- **AsyncStorage** - Local storage (offline)

### Backend (Supabase):
- **PostgreSQL** - Database
- **Realtime** - Live updates
- **Storage** - Foto uploads
- **Auth** - User authenticatie

## Prioriteit Features

### Must Have (MVP):
1. ✅ **Inloggen** als monteur
2. ✅ **Projecten lijst** (toegewezen aan monteur)
3. ✅ **Project details** bekijken
4. ✅ **Tijd registratie** (start/stop)
5. ✅ **Foto's uploaden** bij project

### Nice to Have:
- 📱 Offline modus
- 💬 Chat functionaliteit
- 📊 Statistieken dashboard
- 📍 GPS locatie tracking
- ✅ Push notificaties

## Volgende Stappen

Zie de andere documenten voor:
- **02-SUPABASE-SETUP.md** - Database integratie
- **03-SCREENS-IMPLEMENTATIE.md** - Screen voor screen implementatie
- **04-DATA-MODELS.md** - TypeScript interfaces en queries
- **05-FEATURES-SPECIFICATIES.md** - Gedetailleerde feature specs

