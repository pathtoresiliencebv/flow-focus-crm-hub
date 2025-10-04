# Smans CRM Mobile App Requirements

Deze folder bevat alle documentatie en requirements voor de ontwikkeling van de Smans CRM mobile applicatie door Rork.

## Documenten Overzicht

### 📋 Basis Requirements
- **[01-project-overzicht.md](./01-project-overzicht.md)** - Complete project beschrijving en scope
- **[02-monteur-user-stories.md](./02-monteur-user-stories.md)** - Gedetailleerde user stories en workflows

### 🔧 Technische Specificaties  
- **[03-technische-specificaties.md](./03-technische-specificaties.md)** - Architecture, API's en database schema
- **[04-expo-setup-instructies.md](./04-expo-setup-instructies.md)** - Expo project setup en configuratie

### 🎨 Design & Development
- **[05-component-specificaties.md](./05-component-specificaties.md)** - UI components en design system
- **[06-offline-sync-strategie.md](./06-offline-sync-strategie.md)** - Offline-first implementatie

## Quick Start voor Rork

### 1. Project Scope
Native mobile apps (iOS + Android) voor monteurs om projecten uit te voeren in het veld met offline-first functionaliteit.

### 2. Technology Stack
- **React Native + Expo** managed workflow
- **Supabase** backend (bestaand systeem)
- **SQLite** voor offline storage
- **TypeScript** voor type safety

### 3. Kern Functionaliteiten
- ✅ Project management en taakbeheer
- ✅ Tijd registratie (automatisch)
- ✅ Camera voor werk documentatie
- ✅ Materialen tracking met bonnetjes
- ✅ Chat communicatie met kantoor
- ✅ Offline-first werking met sync
- ✅ Digitale handtekeningen voor oplevering

### 4. Priority Features (MVP)
1. **Authentication** - Biometric login
2. **Project Dashboard** - Overzicht dagplanning
3. **Project Execution** - Start/stop, taken afvinken
4. **Photo Capture** - Werk documentatie
5. **Time Tracking** - Automatische tijdregistratie
6. **Offline Sync** - Data consistency

## Supabase Backend Integration

### Database Access
- **URL**: `https://pvesgvkyiaqmsudmmtkc.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Tables**: projects, project_tasks, time_registrations, project_materials, media_files

### Authentication
- Bestaand Supabase Auth systeem
- User roles en permissions
- Biometric authentication layer

### File Storage
- Supabase Storage voor media files
- Project-specific folders
- Automatic compression en optimization

## Development Guidelines

### Code Structure
```
src/
├── components/     # Reusable UI components
├── screens/       # Screen components
├── hooks/         # Custom React hooks  
├── services/      # API en business logic
├── store/         # State management (Zustand)
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
```

### Design Principles
- **Mobile-first**: Ontworpen voor touch interfaces
- **Offline-capable**: Werkt zonder internet
- **Performance**: Snelle, responsieve UX
- **Accessibility**: Screen reader support
- **Cross-platform**: Consistent iOS/Android experience

## Contact & Support

Voor vragen over requirements of technische details:
- **Development team**: Beschikbaar voor API/backend vragen
- **Project stakeholders**: Feedback op user stories en workflows
- **Design system**: Gebaseerd op bestaande web applicatie

## Next Steps voor Rork

1. **Setup** - Volg [04-expo-setup-instructies.md](./04-expo-setup-instructies.md)
2. **Architecture** - Implementeer basis project structuur
3. **Authentication** - Integreer Supabase Auth + biometric
4. **Offline Storage** - Setup SQLite database schema
5. **Core Screens** - Dashboard, project detail, camera
6. **Sync Logic** - Implementeer offline-first sync strategie

## Success Criteria

- ✅ App start tijd < 3 seconden
- ✅ 95%+ functionaliteit offline beschikbaar  
- ✅ Intuïtieve UX voor monteurs (non-tech users)
- ✅ Stabiele sync zonder data verlies
- ✅ Performance op oudere Android devices
- ✅ App Store approval (iOS + Android)

---

**Laatst bijgewerkt**: December 2024  
**Versie**: 1.0  
**Contact**: Development Team Smans CRM