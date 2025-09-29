# Fase 3: Gecalculeerd Antwoord System (AI Assistant)

## Doelstellingen
- AI-powered context understanding van projecten
- Smart reply suggesties
- Automatische classificatie van vragen
- Intelligente antwoorden gebaseerd op CRM data

## Te Implementeren Bestanden

### 3.1 Smart Replies Hook
**Bestand**: `src/hooks/useSmartReplies.ts`

```typescript
interface SmartReplyContext {
  projectId?: string;
  customerId?: string;
  conversationHistory: DirectMessage[];
  userRole: 'Administrator' | 'Administratie' | 'Installateur';
  currentMessage: string;
}

interface SmartReply {
  id: string;
  text: string;
  confidence: number;
  type: 'quick_response' | 'action' | 'template' | 'ai_generated';
  action?: {
    type: 'update_project_status' | 'schedule_meeting' | 'request_materials';
    data: Record<string, any>;
  };
  metadata?: {
    reasoning?: string;
    context_used?: string[];
  };
}

interface UseSmartRepliesReturn {
  suggestions: SmartReply[];
  isLoading: boolean;
  generateSuggestions: (context: SmartReplyContext) => Promise<void>;
  selectSuggestion: (suggestion: SmartReply) => void;
  customizeSuggestion: (id: string, newText: string) => void;
  markUseful: (id: string, useful: boolean) => void;
}
```

### 3.2 Smart Reply Panel Component
**Bestand**: `src/components/chat/SmartReplyPanel.tsx`

```typescript
interface SmartReplyPanelProps {
  visible: boolean;
  suggestions: SmartReply[];
  onSelectSuggestion: (suggestion: SmartReply) => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

// Features:
// - Categorized suggestions (Quick replies, Actions, Templates)
// - Confidence indicators
// - One-click actions (project updates, etc.)
// - Learning from user feedback
// - Customizable templates
```

### 3.3 AI Context Provider
**Bestand**: `src/hooks/useAIContext.ts`

```typescript
interface AIContextData {
  currentProject?: {
    id: string;
    title: string;
    status: string;
    assignedUsers: string[];
    tasks: Array<{
      id: string;
      description: string;
      completed: boolean;
    }>;
    materials: Array<{
      name: string;
      quantity: number;
      status: string;
    }>;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
    recentProjects: string[];
  };
  conversationSummary: {
    totalMessages: number;
    commonTopics: string[];
    recentActions: string[];
    unresolved_issues: string[];
  };
}

interface UseAIContextReturn {
  contextData: AIContextData | null;
  isLoading: boolean;
  refreshContext: (projectId?: string, customerId?: string) => Promise<void>;
  getRelevantInfo: (query: string) => Promise<string[]>;
}
```

### 3.4 Message Classification Service
**Bestand**: `src/services/messageClassificationService.ts`

```typescript
interface MessageClassification {
  intent: 'question' | 'request' | 'update' | 'complaint' | 'acknowledgment' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  topics: string[];
  entities: {
    projects?: string[];
    materials?: string[];
    dates?: string[];
    locations?: string[];
  };
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

class MessageClassificationService {
  classifyMessage(text: string, context?: AIContextData): Promise<MessageClassification>
  extractEntities(text: string): Promise<Record<string, string[]>>
  detectUrgency(text: string, classification: MessageClassification): Promise<'low' | 'medium' | 'high' | 'critical'>
  getSimilarConversations(classification: MessageClassification): Promise<string[]>
}
```

### 3.5 Edge Function: Chat AI Assistant
**Bestand**: `supabase/functions/chat-ai-assistant/index.ts`

```typescript
interface ChatAssistantRequest {
  message: string;
  conversationHistory: DirectMessage[];
  contextData: AIContextData;
  userRole: string;
  language: string;
}

interface ChatAssistantResponse {
  suggestions: SmartReply[];
  classification: MessageClassification;
  contextualInfo?: string[];
  recommendedActions?: Array<{
    type: string;
    description: string;
    data: Record<string, any>;
  }>;
}

// AI Assistant Features:
// - GPT-4 powered understanding
// - Project context awareness
// - Role-based response generation
// - Multi-language support
// - Learning from conversation patterns
// - Integration met CRM data (projecten, klanten, taken)
```

### 3.6 Template Management System
**Bestand**: `src/components/chat/TemplateManager.tsx`

```typescript
interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'greeting' | 'status_update' | 'question' | 'completion' | 'problem_solving';
  language: string;
  variables: Array<{
    key: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'project' | 'customer';
  }>;
  usage_count: number;
  created_by: string;
  is_system_template: boolean;
}

// Features:
// - Voorgedefinieerde templates per rol
// - Dynamische variabelen (project naam, klant, datum)
// - Multi-language templates
// - Usage analytics
// - Custom user templates
```

### 3.7 Database Schema voor AI Features

```sql
-- Nieuwe tabel voor message classificaties
CREATE TABLE message_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
  intent VARCHAR(50) NOT NULL,
  urgency VARCHAR(20) NOT NULL,
  topics TEXT[] DEFAULT '{}',
  entities JSONB DEFAULT '{}',
  sentiment VARCHAR(20) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel voor smart reply feedback
CREATE TABLE smart_reply_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES direct_messages(id),
  suggestion_id VARCHAR(50) NOT NULL,
  suggestion_text TEXT NOT NULL,
  user_id UUID NOT NULL,
  was_used BOOLEAN NOT NULL,
  was_helpful BOOLEAN,
  custom_text TEXT, -- als user de suggestie aanpaste
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel voor message templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'nl',
  variables JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  is_system_template BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel voor AI conversation insights
CREATE TABLE conversation_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  insight_type VARCHAR(50) NOT NULL, -- 'pattern', 'suggestion', 'anomaly'
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor snelle classificatie lookups
CREATE INDEX idx_message_classifications_intent ON message_classifications(intent, urgency);
CREATE INDEX idx_message_classifications_topics ON message_classifications USING GIN(topics);
CREATE INDEX idx_smart_reply_feedback_usage ON smart_reply_feedback(was_used, was_helpful);
```

### 3.8 AI Learning System
**Bestand**: `src/services/aiLearningService.ts`

```typescript
interface ConversationPattern {
  pattern_type: 'frequent_question' | 'common_response' | 'workflow_pattern';
  frequency: number;
  context: string[];
  suggested_automation?: string;
}

class AILearningService {
  analyzeConversationPatterns(userId: string, timeframe: string): Promise<ConversationPattern[]>
  learnFromFeedback(feedbackData: any[]): Promise<void>
  generateInsights(projectId: string): Promise<any[]>
  optimizeTemplates(userId: string): Promise<MessageTemplate[]>
  detectAnomalies(conversationData: any[]): Promise<any[]>
}
```

## Acceptatie Criteria
- [ ] AI begrijpt project context en geeft relevante suggesties
- [ ] Smart replies zijn accuraat voor minimaal 70% van de gevallen
- [ ] Message classificatie werkt correct voor alle intent types
- [ ] Templates kunnen worden aangepast en nieuwe kunnen worden aangemaakt
- [ ] AI leert van user feedback en verbetert suggesties
- [ ] Multi-language support voor alle AI features
- [ ] Response time onder 2 seconden voor suggesties

## Testing Scenario's
1. **Context Understanding**: Test AI begrip van verschillende project scenarios
2. **Smart Replies**: Test relevantie van suggesties in verschillende situaties
3. **Classification**: Test intent detection en urgency assessment
4. **Templates**: Test variable substitution en multi-language templates
5. **Learning**: Test feedback loop en improvement over time
6. **Performance**: Test response times onder verschillende loads

## Dependencies
```json
{
  "openai": "^4.20.0",
  "@langchain/openai": "^0.0.14",
  "langchain": "^0.0.208",
  "compromise": "^14.10.0",
  "sentiment": "^5.0.2"
}
```