-- Database schema voor AI Features

-- Tabel voor message classificaties
CREATE TABLE IF NOT EXISTS public.message_classifications (
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
CREATE TABLE IF NOT EXISTS public.smart_reply_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES direct_messages(id),
  suggestion_id VARCHAR(50) NOT NULL,
  suggestion_text TEXT NOT NULL,
  user_id UUID NOT NULL,
  was_used BOOLEAN NOT NULL,
  was_helpful BOOLEAN,
  custom_text TEXT,
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel voor message templates
CREATE TABLE IF NOT EXISTS public.message_templates (
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
CREATE TABLE IF NOT EXISTS public.conversation_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  insight_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  severity VARCHAR(20) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.message_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_reply_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_insights ENABLE ROW LEVEL SECURITY;

-- Policies voor message_classifications
CREATE POLICY "Users can view classifications for their messages"
ON public.message_classifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM direct_messages dm 
    WHERE dm.id = message_classifications.message_id 
    AND (dm.from_user_id = auth.uid() OR dm.to_user_id = auth.uid())
  )
);

-- Policies voor smart_reply_feedback
CREATE POLICY "Users can manage their own feedback"
ON public.smart_reply_feedback FOR ALL
USING (user_id = auth.uid());

-- Policies voor message_templates
CREATE POLICY "Users can view active templates"
ON public.message_templates FOR SELECT
USING (is_active = true AND (is_system_template = true OR created_by = auth.uid()));

CREATE POLICY "Users can manage their own templates"
ON public.message_templates FOR ALL
USING (created_by = auth.uid());