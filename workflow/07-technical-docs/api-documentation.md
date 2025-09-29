
# Mobiele API Documentatie

Dit document beschrijft de API endpoints die beschikbaar zijn voor de mobiele CRM applicatie.

**Basis URL:** De basis URL voor alle Supabase Edge Functions is: `https://pvesgvkyiaqmsudmmtkc.supabase.co/functions/v1`

---

## Authenticatie

### 1. Inloggen (`/auth-mobile`)

Dit endpoint wordt gebruikt om een gebruiker in te loggen en een sessie (inclusief JWT) te verkrijgen.

- **Endpoint:** `/auth-mobile`
- **Methode:** `POST`
- **Authenticatie:** Geen (publiek endpoint)

**Request Body (JSON):**

```json
{
  "email": "gebruikersnaam@email.com",
  "password": "uw_wachtwoord"
}
```

**Responses:**

- **`200 OK` - Succesvolle login:**
  Geeft de `data` van Supabase Auth terug, die de `user` en `session` objecten bevat. De JWT in `session.access_token` moet worden gebruikt voor vervolg-requests.
  ```json
  {
    "access_token": "ey...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "...",
    "user": {
      "id": "...",
      "email": "gebruikersnaam@email.com",
      ...
    }
  }
  ```

- **`400 Bad Request` - Ontbrekende gegevens:**
  ```json
  {
    "error": "Email en wachtwoord zijn verplicht"
  }
  ```

- **`401 Unauthorized` - Ongeldige credentials:**
  ```json
  {
    "error": "Invalid login credentials"
  }
  ```

- **`405 Method Not Allowed`:** Als een andere HTTP methode dan `POST` wordt gebruikt.

---

## Klanten (`/customers-mobile`)

Dit endpoint beheert alle CRUD-operaties voor klanten.

- **Endpoint:** `/customers-mobile`
- **Authenticatie:** **Vereist.** Alle requests naar dit endpoint moeten een `Authorization` header bevatten met de JWT van de gebruiker:
  `Authorization: Bearer <UW_ACCESS_TOKEN>`

### 2. Alle klanten ophalen

- **Methode:** `GET`
- **URL:** `/customers-mobile`
- **Response `200 OK`:** Een array van klantobjecten.
  ```json
  [
    { "id": "uuid", "name": "Klant A", ... },
    { "id": "uuid", "name": "Klant B", ... }
  ]
  ```

### 3. Eén klant ophalen

- **Methode:** `GET`
- **URL:** `/customers-mobile/{id}`
- **Response `200 OK`:** Een enkel klantobject.

### 4. Nieuwe klant aanmaken

- **Methode:** `POST`
- **URL:** `/customers-mobile`
- **Request Body (JSON):** Een klantobject zonder `id` of `created_at`.
  ```json
  {
    "name": "Nieuwe Klant",
    "email": "contact@nieuweklant.nl",
    "phone": "0612345678",
    "address": "Voorbeeldstraat 1",
    "city": "Utrecht",
    "status": "Actief"
  }
  ```
- **Response `201 Created`:** Het nieuw aangemaakte klantobject, inclusief de door de database gegenereerde `id`.

### 5. Klant bijwerken

- **Methode:** `PUT`
- **URL:** `/customers-mobile/{id}`
- **Request Body (JSON):** De velden die bijgewerkt moeten worden.
  ```json
  {
    "email": "nieuw-email@nieuweklant.nl",
    "status": "Inactief"
  }
  ```
- **Response `200 OK`:** Het volledig bijgewerkte klantobject.

### 6. Klant verwijderen

- **Methode:** `DELETE`
- **URL:** `/customers-mobile/{id}`
- **Response `204 No Content`:** Een lege response die aangeeft dat de verwijdering is geslaagd.

