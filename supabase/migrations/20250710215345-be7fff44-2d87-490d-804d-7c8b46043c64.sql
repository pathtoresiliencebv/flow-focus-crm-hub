-- Message threading support
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_message_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
  title VARCHAR(200),
  participants UUID[] DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT FALSE,
  priority VARCHAR(10) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

-- Message bookmarks
CREATE TABLE message_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(200),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(20) DEFAULT 'important',
  remind_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation analytics
CREATE TABLE conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_participants UUID[] NOT NULL,
  project_id UUID,
  date DATE NOT NULL,
  message_count INTEGER DEFAULT 0,
  avg_response_time INTERVAL,
  sentiment_score DECIMAL(3,2),
  language_distribution JSONB DEFAULT '{}',
  topic_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  trigger_config JSONB NOT NULL,
  actions_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 1,
  created_by UUID NOT NULL,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_threads
CREATE POLICY "Users can view threads for their messages" 
ON message_threads FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM direct_messages dm 
    WHERE dm.id = parent_message_id 
    AND (dm.from_user_id = auth.uid() OR dm.to_user_id = auth.uid())
  ) OR auth.uid() = ANY(participants)
);

CREATE POLICY "Users can create threads for their messages" 
ON message_threads FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM direct_messages dm 
    WHERE dm.id = parent_message_id 
    AND (dm.from_user_id = auth.uid() OR dm.to_user_id = auth.uid())
  )
);

CREATE POLICY "Users can update threads they participate in" 
ON message_threads FOR UPDATE 
USING (auth.uid() = ANY(participants));

-- RLS Policies for message_bookmarks
CREATE POLICY "Users can manage their own bookmarks" 
ON message_bookmarks FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- RLS Policies for conversation_analytics
CREATE POLICY "Users can view analytics for their conversations" 
ON conversation_analytics FOR SELECT 
USING (auth.uid() = ANY(conversation_participants) OR get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "System can manage analytics" 
ON conversation_analytics FOR ALL 
USING (true);

-- RLS Policies for automation_rules
CREATE POLICY "Users can manage their automation rules" 
ON automation_rules FOR ALL 
USING (created_by = auth.uid()) 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can view all automation rules" 
ON automation_rules FOR SELECT 
USING (get_user_role(auth.uid()) = 'Administrator');

-- Full-text search indexes
CREATE INDEX idx_direct_messages_search ON direct_messages USING GIN(to_tsvector('dutch', content));
CREATE INDEX idx_direct_messages_search_en ON direct_messages USING GIN(to_tsvector('english', content));

-- Performance indexes
CREATE INDEX idx_message_threads_parent ON message_threads(parent_message_id);
CREATE INDEX idx_message_bookmarks_user ON message_bookmarks(user_id, category);
CREATE INDEX idx_conversation_analytics_date ON conversation_analytics(date, project_id);
CREATE INDEX idx_automation_rules_active ON automation_rules(is_active, priority);

-- Update triggers
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();