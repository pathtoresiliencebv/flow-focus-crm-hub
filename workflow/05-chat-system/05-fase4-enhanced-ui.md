# Fase 4: Enhanced Chat Interface & Mobile Optimisatie

## Doelstellingen
- Verbetering van de chat interface met rich media support
- Mobile-first design met native app features
- Real-time collaboration features
- Accessibility en gebruiksvriendelijkheid

## Te Implementeren Bestanden

### 4.1 Enhanced Chat Window
**Bestand**: `src/components/chat/EnhancedChatWindow.tsx`

```typescript
interface EnhancedChatWindowProps {
  selectedUserId: string | null;
  onClose: () => void;
  projectContext?: {
    id: string;
    title: string;
    status: string;
  };
}

interface ChatUIState {
  showMediaPanel: boolean;
  showTemplates: boolean;
  showSmartReplies: boolean;
  isRecording: boolean;
  typingUsers: string[];
  messageFilter: 'all' | 'unread' | 'media' | 'important';
}

// Features:
// - Rich media message display
// - Inline file previews
// - Voice message player met waveform
// - Language indicators per bericht
// - Context panel met project info
// - Quick emoji reactions
// - Message threading support
// - Search binnen conversatie
```

### 4.2 Mobile Chat Interface
**Bestand**: `src/components/chat/MobileChatInterface.tsx`

```typescript
interface MobileChatInterfaceProps extends EnhancedChatWindowProps {
  isFullScreen?: boolean;
  showBottomTabs?: boolean;
  enableSwipeGestures?: boolean;
}

// Mobile-specific features:
// - Swipe gestures voor navigation
// - Pull-to-refresh voor nieuwe berichten
// - Bottom sheet voor media upload
// - Native keyboard handling
// - Haptic feedback
// - Picture-in-picture voor voice calls
// - Offline message queue
```

### 4.3 Real-time Features
**Bestand**: `src/hooks/useRealtimeChat.ts`

```typescript
interface RealtimeFeatures {
  typingIndicators: {
    isTyping: boolean;
    users: Array<{
      id: string;
      name: string;
      language: string;
    }>;
  };
  onlinePresence: {
    onlineUsers: string[];
    lastSeen: Record<string, string>;
  };
  messageStatus: {
    delivered: string[];
    read: string[];
    translated: string[];
  };
}

interface UseRealtimeChatReturn {
  features: RealtimeFeatures;
  setTyping: (isTyping: boolean) => void;
  markAsRead: (messageId: string) => void;
  updatePresence: () => void;
  subscribeToPresence: (userIds: string[]) => void;
}
```

### 4.4 Message Components Library
**Bestand**: `src/components/chat/messages/`

```typescript
// MessageBubble.tsx
interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  showSender: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onTranslate: () => void;
}

// MediaMessage.tsx
interface MediaMessageProps {
  fileUrl: string;
  fileType: string;
  fileName: string;
  thumbnail?: string;
  transcription?: string;
  onDownload: () => void;
}

// VoiceMessage.tsx
interface VoiceMessageProps {
  audioUrl: string;
  duration: number;
  transcription?: string;
  showTranscription: boolean;
  onToggleTranscription: () => void;
}

// SystemMessage.tsx - Voor geautomatiseerde berichten
interface SystemMessageProps {
  type: 'project_update' | 'user_joined' | 'language_changed' | 'file_shared';
  data: Record<string, any>;
  timestamp: string;
}
```

### 4.5 Chat Input Enhanced
**Bestand**: `src/components/chat/ChatInputEnhanced.tsx`

```typescript
interface ChatInputEnhancedProps {
  onSendMessage: (content: string, type: 'text' | 'voice' | 'file') => void;
  onTyping: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  showSmartReplies?: boolean;
  enableVoiceInput?: boolean;
  enableFileUpload?: boolean;
}

// Features:
// - Rich text formatting (bold, italic, links)
// - Emoji picker met frequente emoji's
// - Mention system (@gebruiker)
// - File drag & drop zone
// - Voice recording met real-time waveform
// - Auto-complete voor veelgebruikte zinnen
// - Text expansion (shortcuts naar templates)
// - Multi-line support met Shift+Enter
```

### 4.6 Accessibility Features
**Bestand**: `src/components/chat/AccessibilityProvider.tsx`

```typescript
interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  contrast: 'normal' | 'high';
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  voiceAnnouncements: boolean;
}

// Features:
// - Keyboard navigation tussen berichten
// - Screen reader ondersteuning
// - High contrast mode
// - Font size aanpassingen
// - Voice announcements voor nieuwe berichten
// - Focus management
// - ARIA labels en roles
```

### 4.7 Chat Settings Panel
**Bestand**: `src/components/chat/ChatSettingsPanel.tsx`

```typescript
interface ChatSettings {
  notifications: {
    sound: boolean;
    vibration: boolean;
    showPreview: boolean;
    quietHours: { start: string; end: string };
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    messageSpacing: 'compact' | 'normal' | 'spacious';
    showTimestamps: boolean;
    showReadReceipts: boolean;
  };
  language: {
    autoDetect: boolean;
    preferredLanguage: string;
    autoTranslate: boolean;
    showOriginal: boolean;
  };
  privacy: {
    shareOnlineStatus: boolean;
    shareTypingStatus: boolean;
    saveConversationHistory: boolean;
  };
}
```

### 4.8 Performance Optimizations
**Bestand**: `src/hooks/useChatPerformance.ts`

```typescript
interface PerformanceOptimizations {
  virtualizedMessages: boolean; // Voor lange gesprekken
  lazyLoadMedia: boolean;
  messageCompression: boolean;
  offlineSync: boolean;
  bandwidthAdaptation: boolean;
}

// Features:
// - Virtualized scrolling voor grote conversaties
// - Lazy loading van media content
// - Message compression voor slow connections
// - Offline queue synchronization
// - Bandwidth-adaptive media quality
// - Background sync van conversaties
```

### 4.9 Push Notifications
**Bestand**: `src/services/chatNotificationService.ts`

```typescript
interface NotificationConfig {
  sound: string;
  vibrationPattern: number[];
  showPreview: boolean;
  groupByConversation: boolean;
  markAsReadOnOpen: boolean;
}

interface ChatNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  data: {
    conversationId: string;
    messageId: string;
    senderId: string;
    type: 'message' | 'mention' | 'file' | 'voice';
  };
}

class ChatNotificationService {
  requestPermission(): Promise<boolean>
  scheduleNotification(notification: ChatNotification): Promise<void>
  cancelNotification(id: string): Promise<void>
  updateBadgeCount(count: number): Promise<void>
  handleNotificationClick(data: any): Promise<void>
}
```

### 4.10 Responsive Design System
**Bestand**: `src/styles/chat-responsive.css`

```css
/* Mobile-first responsive design */
.chat-container {
  /* Base mobile styles */
  @apply w-full h-full;
}

/* Tablet styles */
@media (min-width: 768px) {
  .chat-container {
    @apply max-w-2xl mx-auto;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .chat-container {
    @apply max-w-4xl grid grid-cols-3 gap-4;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2) {
  .chat-avatar {
    @apply scale-110;
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .chat-animation {
    @apply transition-none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .chat-container {
    @apply bg-gray-900 text-gray-100;
  }
}
```

## Acceptatie Criteria
- [ ] Chat interface is volledig responsive op alle device groottes
- [ ] Voice messages tonen waveform en kunnen afgespeeld worden
- [ ] File previews werken voor alle ondersteunde formats
- [ ] Real-time typing indicators werken correct
- [ ] Push notifications werken op mobile devices
- [ ] Offline functionaliteit synchroniseert bij reconnect
- [ ] Accessibility features voldoen aan WCAG 2.1 AA standards
- [ ] Performance is optimaal bij lange gesprekken (1000+ berichten)

## Testing Scenario's
1. **Responsive Design**: Test op verschillende screen sizes en orientations
2. **Performance**: Test met lange conversatie history
3. **Real-time**: Test typing indicators en presence met meerdere users
4. **Accessibility**: Test met screen readers en keyboard navigation
5. **Offline**: Test offline behavior en sync na reconnect
6. **Push Notifications**: Test op verschillende platforms en devices

## Dependencies
```json
{
  "@tanstack/react-virtual": "^3.0.0",
  "react-window": "^1.8.8",
  "framer-motion": "^10.16.0",
  "react-intersection-observer": "^9.5.0",
  "@capacitor/haptics": "^5.0.0",
  "@capacitor/push-notifications": "^5.0.0",
  "@capacitor/local-notifications": "^5.0.0",
  "emoji-mart": "^5.5.0",
  "react-mentions": "^4.4.0"
}
```