
# Projectplan: Mobiele CRM App voor SmansCRM

**Datum:** 15-06-2025
**Project:** Ontwikkeling van een cross-platform mobiele applicatie voor het SmansCRM-systeem.
**Platform:** Flutter (voor iOS en Android).

---

## 1. Projectoverzicht

Dit document beschrijft de technische vereisten en het stappenplan voor de ontwikkeling van een mobiele applicatie voor het SmansCRM. Het doel is om kernfunctionaliteiten van het web-CRM beschikbaar te maken op mobiele apparaten (iOS en Android), zodat gebruikers ook onderweg toegang hebben tot klantgegevens.

De applicatie wordt ontwikkeld in **Flutter** en zal communiceren met de bestaande **Next.js backend** via een REST API.

## 2. Architectuur

De architectuur is gebaseerd op een client-server model:

-   **Backend (Server):** De bestaande Next.js applicatie. Deze fungeert als de enige bron van waarheid (`single source of truth`) en stelt data beschikbaar via een beveiligde REST API.
-   **Frontend (Client):** De Flutter-applicatie. Deze bevat geen bedrijfslogica of directe databaseverbindingen. De app is puur verantwoordelijk voor de gebruikersinterface (UI) en communiceert met de Next.js API om data op te halen, te tonen en te wijzigen.


┌──────────────────┐      ┌─────────────────┐      ┌──────────────────────────┐
│ Mobiele App (iOS)│      │                 │      │                          │
│     (Flutter)    ├──────►   Next.js API   ◄──────┤   Mobiele App (Android)  │
└──────────────────┘      │                 │      │        (Flutter)         │
                        └───────┬─────────┘      └──────────────────────────┘
                                │
                                ▼
                           ┌────────────┐
                           │  Database  │
                           └────────────┘


## 3. Kernfunctionaliteiten (MVP - Minimum Viable Product)

Voor de eerste versie van de mobiele app focussen we op de volgende essentiële features:

-   **1. Gebruikersauthenticatie:**
    -   Inlogscherm waar gebruikers kunnen aanmelden met hun bestaande CRM-credentials.
    -   Veilige opslag van een authenticatietoken op het apparaat.
    -   Mogelijkheid om uit te loggen.

-   **2. Klantenoverzicht:**
    -   Een lijstweergave van alle klanten.
    -   Basisinformatie per klant zichtbaar (bijv. bedrijfsnaam, contactpersoon).
    -   Een zoekfunctie om de lijst met klanten te filteren.

-   **3. Klantdetails Bekijken & Bewerken:**
    -   Vanuit het overzicht doorklikken naar een gedetailleerde weergave van een specifieke klant.
    -   Alle klantvelden (naam, adres, contactgegevens, notities etc.) zijn zichtbaar.
    -   Een "Bewerken" modus om de gegevens van een klant aan te passen en op te slaan.

-   **4. Nieuwe Klant Toevoegen:**
    -   Een formulier om een nieuwe klant aan het CRM toe te voegen.

## 4. Vereiste API Endpoints

De Next.js backend moet de volgende API-routes (endpoints) beschikbaar stellen om de mobiele app te ondersteunen. Alle endpoints moeten beveiligd zijn en een geldig authenticatietoken vereisen.

| Methode | Endpoint                    | Beschrijving                                  |
| :------ | :-------------------------- | :-------------------------------------------- |
| `POST`  | `/api/auth/login`           | Gebruiker inloggen, retourneert een JWT-token.|
| `POST`  | `/api/auth/logout`          | Gebruiker uitloggen (token ongeldig maken).  |
| `GET`   | `/api/customers`            | Haalt een lijst van alle klanten op.          |
| `GET`   | `/api/customers?search=...` | Zoekt naar klanten op basis van een query.    |
| `GET`   | `/api/customers/[id]`       | Haalt de details van één specifieke klant op. |
| `POST`  | `/api/customers`            | Maakt een nieuwe klant aan.                   |
| `PUT`   | `/api/customers/[id]`       | Werkt de gegevens van een klant bij.          |
| `DELETE`| `/api/customers/[id]`       | Verwijdert een klant.                         |

## 5. UI/UX Ontwerp

-   **Branding:** De app moet de visuele identiteit van SmansCRM volgen. Gebruik een passend logo en kleurenpalet.
-   **Gebruiksvriendelijkheid:** De interface moet intuïtief, snel en geoptimaliseerd zijn voor touch-bediening.
-   **Consistentie:** Zorg voor een consistente gebruikerservaring die logisch aanvoelt voor gebruikers die al bekend zijn met het web-CRM.

## 6. Technologie Stack

-   **Mobiele Applicatie:** Flutter & Dart
-   **Backend & API:** Next.js & TypeScript
-   **State Management (Flutter):** Provider / BLoC / Riverpod (nader te bepalen)
-   **HTTP Client (Flutter):** `http` / `dio`

## 7. Stappenplan & Mijlpalen

1.  **Fase 1: Backend API Ontwikkeling**
    -   [ ] Implementeren en testen van alle vereiste API endpoints in Next.js.
    -   [ ] Opzetten van token-gebaseerde authenticatie (JWT).
    -   [ ] API-documentatie opstellen (bijv. met Swagger/OpenAPI).

2.  **Fase 2: Flutter Project Setup**
    -   [ ] Opzetten van een nieuw Flutter-project.
    -   [ ] Implementeren van de basis mappenstructuur en navigatie (routing).
    -   [ ] Integreren van het SmansCRM-thema (kleuren, lettertypes, logo).

3.  **Fase 3: Implementatie UI & Features**
    -   [ ] Bouwen van het inlogscherm.
    -   [ ] Bouwen van het klantenoverzicht (lijst + zoekfunctie).
    -   [ ] Bouwen van de klantdetail- en bewerkingsschermen.
    -   [ ] Bouwen van het "Nieuwe Klant" formulier.

4.  **Fase 4: API Integratie**
    -   [ ] Verbinden van het inlogscherm met de `/api/auth/login` endpoint.
    -   [ ] Ophalen en weergeven van data in het klantenoverzicht via de API.
    -   [ ] Implementeren van de `create`, `update` en `delete` functionaliteit door de respectievelijke API-calls te maken.

5.  **Fase 5: Testen & Afronding**
    -   [ ] Grondig testen van alle functionaliteiten op zowel iOS als Android (emulators en fysieke apparaten).
    -   [ ] Oplossen van bugs.
    -   [ ] Voorbereiden van de app voor release in de App Store en Google Play Store.
