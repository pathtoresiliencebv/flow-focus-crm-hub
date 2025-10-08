-- =====================================================
-- PLANNING & MONTEUR WORKFLOW - DATABASE SCHEMA
-- Migration: Create new tables for enhanced workflow
-- Created: 2025-01-08
-- =====================================================

-- =====================================================
-- 1. PLANNING_PARTICIPANTS TABLE
-- Purpose: Multi-monteur teams en klant betrokkenheid bij planning
-- =====================================================

CREATE TABLE IF NOT EXISTS public.planning_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  planning_id UUID REFERENCES public.planning_items(id) ON DELETE CASCADE NOT NULL,
  
  -- Participant info
  participant_type VARCHAR(50) NOT NULL, -- 'monteur', 'klant', 'administrator'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  role VARCHAR(50), -- 'hoofdmonteur', 'assistent', 'contactpersoon'
  
  -- Notification tracking
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  notification_method VARCHAR(50), -- 'email', 'sms', 'push'
  
  -- Confirmation tracking
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  confirmation_method VARCHAR(50), -- 'app', 'email_link', 'phone'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_planning_participants_planning_id ON public.planning_participants(planning_id);
CREATE INDEX idx_planning_participants_user_id ON public.planning_participants(user_id);
CREATE INDEX idx_planning_participants_customer_id ON public.planning_participants(customer_id);
CREATE INDEX idx_planning_participants_type ON public.planning_participants(participant_type);

-- Comments
COMMENT ON TABLE public.planning_participants IS 'Tracks all participants in a planning item (monteurs, klanten, administrators)';
COMMENT ON COLUMN public.planning_participants.participant_type IS 'Type of participant: monteur, klant, administrator';
COMMENT ON COLUMN public.planning_participants.role IS 'Role within the planning: hoofdmonteur, assistent, contactpersoon';

-- =====================================================
-- 2. WORK_TIME_LOGS TABLE
-- Purpose: Gedetailleerde tijdsregistratie met GPS tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS public.work_time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  installer_id UUID REFERENCES auth.users(id) NOT NULL,
  planning_id UUID REFERENCES public.planning_items(id) ON DELETE SET NULL,
  
  -- Time tracking
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  break_duration_minutes INTEGER DEFAULT 0,
  
  -- Calculated duration (in minutes)
  total_duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN ended_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (ended_at - started_at))/60 - COALESCE(break_duration_minutes, 0)
      ELSE NULL
    END
  ) STORED,
  
  -- GPS Location tracking
  start_location_lat DECIMAL(10, 8),
  start_location_lng DECIMAL(11, 8),
  start_location_address TEXT,
  end_location_lat DECIMAL(10, 8),
  end_location_lng DECIMAL(11, 8),
  end_location_address TEXT,
  
  -- Distance tracking (in km)
  distance_from_project_km DECIMAL(8, 2),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  
  -- Notes and metadata
  notes TEXT,
  break_notes TEXT,
  metadata JSONB, -- Extra data (weather conditions, tools used, etc.)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_work_time_logs_project_id ON public.work_time_logs(project_id);
CREATE INDEX idx_work_time_logs_installer_id ON public.work_time_logs(installer_id);
CREATE INDEX idx_work_time_logs_planning_id ON public.work_time_logs(planning_id);
CREATE INDEX idx_work_time_logs_started_at ON public.work_time_logs(started_at DESC);
CREATE INDEX idx_work_time_logs_status ON public.work_time_logs(status);

-- Comments
COMMENT ON TABLE public.work_time_logs IS 'Detailed time tracking per project with GPS check-in/out';
COMMENT ON COLUMN public.work_time_logs.total_duration_minutes IS 'Auto-calculated net work time (total - breaks)';
COMMENT ON COLUMN public.work_time_logs.distance_from_project_km IS 'Distance from project location (for travel time calculation)';

-- =====================================================
-- 3. MATERIAL_USAGE TABLE
-- Purpose: Track materials used during projects with QR scanning
-- =====================================================

CREATE TABLE IF NOT EXISTS public.material_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  completion_id UUID REFERENCES public.project_completions(id) ON DELETE CASCADE,
  installer_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Material information
  material_name VARCHAR(255) NOT NULL,
  material_code VARCHAR(100), -- SKU/EAN/QR code
  material_description TEXT,
  
  -- Quantity
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'stuks', -- 'stuks', 'meter', 'kg', 'liter', 'm2', 'sets'
  
  -- Pricing (optional)
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * COALESCE(unit_price, 0)) STORED,
  
  -- Category and classification
  category VARCHAR(100), -- 'zonnepanelen', 'bedrading', 'montage', 'gereedschap', etc.
  supplier VARCHAR(100),
  
  -- Tracking information
  scanned_from_qr BOOLEAN DEFAULT false,
  photo_url TEXT, -- Photo of the material or receipt
  serial_numbers TEXT[], -- For warranty tracking
  
  -- Metadata
  notes TEXT,
  warranty_months INTEGER,
  installation_location TEXT, -- Where on the project site
  
  -- Timestamps
  used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_material_usage_project_id ON public.material_usage(project_id);
CREATE INDEX idx_material_usage_completion_id ON public.material_usage(completion_id);
CREATE INDEX idx_material_usage_installer_id ON public.material_usage(installer_id);
CREATE INDEX idx_material_usage_material_code ON public.material_usage(material_code);
CREATE INDEX idx_material_usage_category ON public.material_usage(category);
CREATE INDEX idx_material_usage_used_at ON public.material_usage(used_at DESC);

-- Comments
COMMENT ON TABLE public.material_usage IS 'Tracks all materials used in projects with QR code scanning support';
COMMENT ON COLUMN public.material_usage.material_code IS 'SKU, EAN, or QR code for scanning';
COMMENT ON COLUMN public.material_usage.scanned_from_qr IS 'True if material was added via QR code scan';
COMMENT ON COLUMN public.material_usage.serial_numbers IS 'Array of serial numbers for warranty tracking';

-- =====================================================
-- 4. CUSTOMER_NOTIFICATIONS TABLE
-- Purpose: Track all notifications sent to customers
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  planning_id UUID REFERENCES public.planning_items(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  completion_id UUID REFERENCES public.project_completions(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type VARCHAR(50) NOT NULL, -- 'planning_created', 'reminder', 'rescheduled', 'completion', 'invoice', 'feedback_request'
  channel VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push', 'whatsapp'
  
  -- Content
  subject TEXT,
  message TEXT,
  template_name VARCHAR(100), -- Reference to email template used
  
  -- Delivery status
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'opened', 'clicked', 'bounced'
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Recipients
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  recipient_name VARCHAR(255),
  
  -- Tracking
  message_id VARCHAR(255), -- External provider message ID
  provider VARCHAR(50), -- 'resend', 'sendgrid', 'twilio', etc.
  
  -- Metadata
  metadata JSONB, -- Extra data (ical attachment info, click tracking, etc.)
  cost DECIMAL(10, 4), -- Cost per message (for SMS tracking)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customer_notifications_customer_id ON public.customer_notifications(customer_id);
CREATE INDEX idx_customer_notifications_planning_id ON public.customer_notifications(planning_id);
CREATE INDEX idx_customer_notifications_project_id ON public.customer_notifications(project_id);
CREATE INDEX idx_customer_notifications_type ON public.customer_notifications(notification_type);
CREATE INDEX idx_customer_notifications_channel ON public.customer_notifications(channel);
CREATE INDEX idx_customer_notifications_status ON public.customer_notifications(status);
CREATE INDEX idx_customer_notifications_sent_at ON public.customer_notifications(sent_at DESC);

-- Comments
COMMENT ON TABLE public.customer_notifications IS 'Tracks all notifications sent to customers via email/SMS/push';
COMMENT ON COLUMN public.customer_notifications.notification_type IS 'Type: planning_created, reminder, completion, invoice, etc.';
COMMENT ON COLUMN public.customer_notifications.status IS 'Delivery status: pending, sent, delivered, opened, clicked, failed';
COMMENT ON COLUMN public.customer_notifications.metadata IS 'Additional data like iCal attachments, click tracking URLs, etc.';

-- =====================================================
-- 5. MATERIAL_CATALOG TABLE (Optional - for QR lookup)
-- Purpose: Master catalog of materials for quick QR scanning
-- =====================================================

CREATE TABLE IF NOT EXISTS public.material_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Material details
  material_code VARCHAR(100) UNIQUE NOT NULL, -- SKU/EAN/QR code
  material_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  default_unit_price DECIMAL(10, 2),
  unit VARCHAR(50) DEFAULT 'stuks',
  
  -- Classification
  category VARCHAR(100),
  subcategory VARCHAR(100),
  supplier VARCHAR(100),
  supplier_product_code VARCHAR(100),
  
  -- Inventory
  stock_quantity DECIMAL(10, 2),
  minimum_stock DECIMAL(10, 2),
  reorder_quantity DECIMAL(10, 2),
  
  -- Details
  specifications JSONB, -- Technical specs
  weight_kg DECIMAL(8, 3),
  dimensions VARCHAR(100), -- LxWxH
  
  -- Images and docs
  image_url TEXT,
  datasheet_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  discontinued_at TIMESTAMPTZ,
  replacement_material_id UUID REFERENCES public.material_catalog(id),
  
  -- Metadata
  warranty_months INTEGER,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_material_catalog_code ON public.material_catalog(material_code);
CREATE INDEX idx_material_catalog_category ON public.material_catalog(category);
CREATE INDEX idx_material_catalog_supplier ON public.material_catalog(supplier);
CREATE INDEX idx_material_catalog_active ON public.material_catalog(is_active);

-- Full text search
CREATE INDEX idx_material_catalog_search ON public.material_catalog 
  USING gin(to_tsvector('dutch', material_name || ' ' || COALESCE(description, '')));

-- Comments
COMMENT ON TABLE public.material_catalog IS 'Master catalog of materials for QR lookup and inventory management';
COMMENT ON COLUMN public.material_catalog.material_code IS 'Unique SKU/EAN/QR code for scanning';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_planning_participants_updated_at ON public.planning_participants;
CREATE TRIGGER update_planning_participants_updated_at 
  BEFORE UPDATE ON public.planning_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_time_logs_updated_at ON public.work_time_logs;
CREATE TRIGGER update_work_time_logs_updated_at 
  BEFORE UPDATE ON public.work_time_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_material_usage_updated_at ON public.material_usage;
CREATE TRIGGER update_material_usage_updated_at 
  BEFORE UPDATE ON public.material_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_notifications_updated_at ON public.customer_notifications;
CREATE TRIGGER update_customer_notifications_updated_at 
  BEFORE UPDATE ON public.customer_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_material_catalog_updated_at ON public.material_catalog;
CREATE TRIGGER update_material_catalog_updated_at 
  BEFORE UPDATE ON public.material_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANTS (Basic permissions)
-- =====================================================

-- Planning participants
ALTER TABLE public.planning_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_catalog ENABLE ROW LEVEL SECURITY;

-- Basic grants (will add detailed RLS policies in next migration)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_time_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notifications TO authenticated;
GRANT SELECT ON public.material_catalog TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.material_catalog TO service_role;

