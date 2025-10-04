# Project Overview - Smans CRM Mobile Apps

## Project Description
Ontwikkel native mobiele applicaties voor Android en iOS voor het Smans CRM systeem. De apps zijn specifiek ontworpen voor monteurs/installateurs die projecten uitvoeren in het veld.

## Business Context
**Smans CRM** is een compleet project management systeem voor installatiebedrijven. Het complete workflow loopt als volgt:
1. **Administratie** maakt offertes en stuurt deze naar klanten
2. **Klanten** tekenen offertes digitaal via publieke links
3. **Projecten** worden automatisch aangemaakt van goedgekeurde offertes
4. **Monteurs** voeren projecten uit met mobiele apps
5. **Administratie** ontvangt complete documentatie en factureert

## Target Users - Monteurs/Installateurs
### Primaire Gebruikers
- **Profiel**: Technische professionals, 25-55 jaar
- **Technische vaardigheid**: Gemiddeld tot goed
- **Werkomgeving**: Bouwplaatsen, klantlocaties, onderweg
- **Devices**: Android smartphones/tablets, iOS iPhones/iPads
- **Connectiviteit**: Wisselende internetverbinding

### Gebruiksscenario's
- **Project planning**: Planning bekijken voor de dag/week
- **Project uitvoering**: Taken afvinken, tijd registreren
- **Materialen tracking**: Gebruikte materialen bijhouden
- **Documentatie**: Foto's maken van werk en bonnetjes
- **Communicatie**: Chat met kantoor over projecten
- **Project oplevering**: Digitale handtekeningen verzamelen

## Business Requirements
### Kritieke Functionaliteiten
1. **Offline-first werking** - Moet werken zonder internet
2. **Automatische sync** - Data sync wanneer internet beschikbaar
3. **Native performance** - Snelle, responsieve gebruikerservaring
4. **Device integration** - Camera, GPS, push notifications
5. **Security** - Biometric authentication, data encryptie

### Success Criteria
- **95%+ uptime** in offline mode
- **<3 seconden** app start tijd
- **100% data consistency** na sync
- **Positive user feedback** van monteurs
- **Verhoogde productiviteit** in het veld

## Project Scope
### Binnen Scope
- Native iOS app (Swift/SwiftUI)
- Native Android app (Kotlin/Jetpack Compose)
- Supabase backend integratie
- Offline data synchronisatie
- Camera functionaliteit
- GPS/locatie services
- Push notifications
- Biometric authentication
- File management systeem

### Buiten Scope
- Web app development
- Backend/database development (bestaand Supabase systeem)
- Administratie functies (alleen monteur functies)
- Factuur/offerte generatie
- Klant communicatie direct

## Technical Constraints
- **Backend**: Bestaand Supabase systeem (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Offline**: SQLite local database
- **Sync**: Custom sync logic met conflict resolution

## Platform Requirements
### iOS
- **Minimum**: iOS 15.0+
- **Target**: iOS 16.0+
- **Devices**: iPhone 12+ en iPad (9e generatie)+
- **Language**: Swift 5.0+, SwiftUI

### Android
- **Minimum**: Android API 26 (Android 8.0)
- **Target**: Android API 34 (Android 14)
- **Devices**: Moderne Android smartphones en tablets
- **Language**: Kotlin, Jetpack Compose

## Timeline Expectations
- **MVP Development**: 8-12 weken
- **Testing & Refinement**: 2-4 weken
- **Store Deployment**: 1-2 weken
- **Total**: 3-4 maanden voor beide platforms

## Support & Maintenance
- Post-launch bug fixes en updates
- OS compatibility updates
- Feature additions based on user feedback
- Performance monitoring en optimalisatie