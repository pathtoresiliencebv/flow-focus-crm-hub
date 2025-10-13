# Stream.io Chat - User Guide

## Voor Eindgebruikers (End Users)

### Web Applicatie

#### Chat Openen
1. Log in op het CRM systeem
2. Navigeer naar **Chat** in het menu
3. De chat interface laadt automatisch

#### Een Gesprek Starten
1. In het linker zijpaneel zie je **Beschikbare Contacten**
2. Klik op een contact om een gesprek te beginnen
3. Typ je bericht in het invoerveld onderaan
4. Druk op Enter of klik op de verzend knop

#### Functies
- **Real-time berichten**: Berichten worden direct getoond
- **Typing indicator**: Zie wanneer iemand aan het typen is
- **Leesbevestigingen**: Zie wanneer je bericht is gelezen
- **Online status**: Groene indicator toont wie online is
- **Oude Berichten**: Klik op "Oude Berichten" om archief te bekijken

#### Bestandsdelen
- Klik op de **clip icoon** om bestanden te uploaden
- Ondersteunt: Foto's, PDF's, documenten
- Maximum bestandsgrootte: Check met admin

### Mobiele App

#### Chat Openen
1. Open de SMANS CRM app
2. Tap op het **Chat** tabblad onderaan

#### Gesprek Starten
1. Zie lijst van beschikbare contacten
2. Tap op een contact
3. Typ je bericht
4. Tap verzend knop

#### Speciale Functies (Mobiel)
- **Foto's**: Tap camera icoon om foto te maken en versturen
- **Galerij**: Tap afbeelding icoon om foto uit galerij te kiezen
- **Spraakberichten**: Houd microfoon knop ingedrukt om op te nemen
- **Offline berichten**: Berichten worden automatisch verzonden wanneer je weer online bent

#### Notificaties
- Push notificaties voor nieuwe berichten
- Werkt ook als app op achtergrond draait
- Tap notificatie om direct naar gesprek te gaan

## Voor Administrators

### Gebruikersbeheer

#### Wie Kan Met Wie Chatten?

**Installateur (Monteur)**:
- Kan ALLEEN chatten met Administrator en Administratie rollen
- Ziet geen andere monteurs in de contact lijst
- Kan geen nieuwe kanalen aanmaken

**Administrator**:
- Kan chatten met ALLE installateurs
- Kan chatten met andere administrators
- Kan chatten met administratie personeel
- Volledige controle

**Administratie**:
- Kan chatten met ALLE installateurs
- Kan chatten met administrators
- Kan chatten met ander administratie personeel

### Troubleshooting

#### "Kon niet verbinden met chat"
**Oplossing**:
- Controleer internetverbinding
- Log uit en weer in
- Neem contact op met technische support als probleem aanhoudt

#### "Geen contacten beschikbaar"
**Oorzaken**:
- Gebruikersrol heeft mogelijk geen chat toegang
- Geen andere gebruikers met correcte rollen actief
- Database synchronisatie issue

**Oplossing**:
- Verifieer gebruikersrol in profiel
- Controleer of andere gebruikers status 'Actief' hebben
- Neem contact op met admin

#### Berichten komen niet aan
**Oplossing**:
1. Controleer online status (groen bolletje bij naam)
2. Herlaad de pagina / herstart app
3. Controleer of bericht in "Verzonden" staat
4. Neem contact op met support als probleem aanhoudt

### Gegevensbeheer

#### Oude Berichten
- Oude berichten van het Supabase systeem blijven beschikbaar
- Toegankelijk via "Oude Berichten" / "Archief" knop
- Alleen-lezen (niet bewerken of beantwoorden)
- Nieuwe gesprekken starten automatisch in Stream.io systeem

#### Privacy
- Berichten zijn end-to-end versleuteld via Stream.io
- Alleen geautoriseerde gebruikers kunnen berichten zien
- Berichten worden bewaard volgens bedrijfsbeleid
- Administrators hebben geen toegang tot privéberichten van gebruikers

## Voor Developers

### Quick Start

#### Test Chat Locally

**Web**:
```bash
cd flow-focus-crm-hub
npm install
npm run dev
# Navigate to /chat
```

**Mobile**:
```bash
cd smans-crm-mobile-app
npm install
npm start
# Open app and navigate to Chat tab
```

### API Usage

#### Create Direct Channel (Web)
```typescript
import { createDirectChannel } from '@/lib/stream-chat';
import { useAuth } from '@/contexts/AuthContext';

const { user } = useAuth();
const channel = await createDirectChannel(user.id, otherUserId);
```

#### Send Message (Web)
```typescript
// Messages are sent via Stream's MessageInput component
<MessageInput />
```

#### Access Stream Client (Web)
```typescript
import { useStreamChat } from '@/contexts/StreamChatContext';

const { client, isConnected, availableUsers } = useStreamChat();
```

#### Create Direct Channel (Mobile)
```typescript
import { useStreamChat } from '@/providers/StreamChatProvider';

const { createDirectChannel } = useStreamChat();
const channel = await createDirectChannel(otherUserId);
```

### Custom Hooks

#### Web
```typescript
// Get Stream chat context
const {
  client,           // StreamChat instance
  isConnected,      // Connection status
  isConnecting,     // Loading state
  availableUsers,   // Filtered users based on role
  currentChannel,   // Active channel
  setCurrentChannel,// Set active channel
  loadAvailableUsers, // Reload users
  error,            // Error message if any
} = useStreamChat();
```

#### Mobile
```typescript
// Get Stream chat context
const {
  client,           // StreamChat instance
  isConnected,      // Connection status
  isConnecting,     // Loading state
  availableUsers,   // Filtered users
  currentChannel,   // Active channel
  setCurrentChannel,// Set active channel
  createDirectChannel, // Create 1-on-1 channel
  loadAvailableUsers,  // Reload users
  error,            // Error message
} = useStreamChat();
```

### Adding Custom Features

#### Example: Add Reaction to Message
```typescript
// In MessageList component
const handleReaction = async (message: Message, reactionType: string) => {
  await message.sendReaction(reactionType);
};
```

#### Example: Filter Channels
```typescript
const loadChannels = async () => {
  const filter = { 
    type: 'messaging',
    members: { $in: [currentUserId] },
  };
  const sort = [{ last_message_at: -1 }];
  
  const channels = await client.queryChannels(filter, sort, {
    watch: true,
    state: true,
  });
};
```

### Testing

#### Unit Tests
```typescript
// Test token generation
describe('Stream Token Generation', () => {
  it('should generate valid token', async () => {
    const token = await getStreamUserToken();
    expect(token).toBeDefined();
    expect(token.apiKey).toBeDefined();
    expect(token.token).toBeDefined();
  });
});
```

#### Integration Tests
```typescript
// Test channel creation
describe('Channel Creation', () => {
  it('should create direct channel between users', async () => {
    const channel = await createDirectChannel(userId1, userId2);
    expect(channel).toBeDefined();
    expect(channel.id).toBe(`direct_${userId1}_${userId2}`);
  });
});
```

### Debugging

#### Enable Stream Logs
```typescript
// In development
import { StreamChat } from 'stream-chat';

const client = StreamChat.getInstance(apiKey);
client.setLogLevel('info'); // or 'debug' for verbose
```

#### Check Connection Status
```typescript
client.on('connection.changed', (event) => {
  console.log('Connection status:', event.online);
});
```

#### Monitor Messages
```typescript
channel.on('message.new', (event) => {
  console.log('New message:', event.message);
});
```

## Support

Voor vragen of problemen:
- **Technische vragen**: Neem contact op met development team
- **Gebruikersvragen**: Contacteer system administrator
- **Bugs**: Meld via het issue tracking systeem
- **Feature requests**: Dien in via product management

---

**Laatste Update**: 13 Oktober 2025
**Versie**: 1.0.0
**Documentatie Status**: ✅ Compleet

