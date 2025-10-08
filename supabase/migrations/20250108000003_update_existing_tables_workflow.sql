-- =====================================================
-- PLANNING & MONTEUR WORKFLOW - UPDATE EXISTING TABLES
-- Migration: Add new columns to existing tables
-- Created: 2025-01-08
-- =====================================================

-- =====================================================
-- 1. UPDATE PLANNING_ITEMS TABLE
-- Add klant afspraak functionaliteit
-- =====================================================

-- Add new columns for customer appointments
ALTER TABLE public.planning_items
ADD COLUMN IF NOT EXISTS planning_type VARCHAR(50) DEFAULT 'monteur', -- 'monteur', 'klant_afspraak', 'intern', 'team'
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS expected_duration_minutes INTEGER DEFAULT 480, -- Default 8 hours
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS notify_customer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_sms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_by_customer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rescheduled_from UUID REFERENCES public.planning_items(id),
ADD COLUMN IF NOT EXISTS color_code VARCHAR(7) DEFAULT '#3B82F6'; -- For calendar color coding

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_planning_items_customer_id ON public.planning_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_planning_items_planning_type ON public.planning_items(planning_type);
CREATE INDEX IF NOT EXISTS idx_planning_items_confirmed ON public.planning_items(confirmed_by_customer);

-- Comments
COMMENT ON COLUMN public.planning_items.planning_type IS 'Type: monteur (internal), klant_afspraak (customer meeting), intern (office), team (multi-person)';
COMMENT ON COLUMN public.planning_items.customer_id IS 'Link to customer for customer appointments';
COMMENT ON COLUMN public.planning_items.expected_duration_minutes IS 'Expected duration in minutes';
COMMENT ON COLUMN public.planning_items.notify_customer IS 'Whether to send notification to customer';
COMMENT ON COLUMN public.planning_items.color_code IS 'Hex color code for calendar display';

-- =====================================================
-- 2. UPDATE PROJECT_COMPLETIONS TABLE
-- Add extended werkbon fields
-- =====================================================

-- Add new fields for detailed work reports
ALTER TABLE public.project_completions
ADD COLUMN IF NOT EXISTS total_work_hours DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS break_duration_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_work_hours DECIMAL(5, 2) GENERATED ALWAYS AS (
  CASE 
    WHEN total_work_hours IS NOT NULL AND break_duration_minutes IS NOT NULL 
    THEN total_work_hours - (break_duration_minutes / 60.0)
    ELSE total_work_hours
  END
) STORED,
ADD COLUMN IF NOT EXISTS materials_cost DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS other_costs DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (
  COALESCE(materials_cost, 0) + COALESCE(labor_cost, 0) + COALESCE(other_costs, 0)
) STORED,
ADD COLUMN IF NOT EXISTS work_summary_json JSONB, -- Structured work data
ADD COLUMN IF NOT EXISTS customer_feedback TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(100),
ADD COLUMN IF NOT EXISTS issues_encountered TEXT,
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT,
ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN public.project_completions.net_work_hours IS 'Auto-calculated: total_work_hours - break_duration';
COMMENT ON COLUMN public.project_completions.total_cost IS 'Auto-calculated: materials + labor + other costs';
COMMENT ON COLUMN public.project_completions.work_summary_json IS 'Structured data: tasks completed, issues, recommendations';
COMMENT ON COLUMN public.project_completions.follow_up_required IS 'Whether follow-up work is needed';

-- =====================================================
-- 3. UPDATE PROJECTS TABLE
-- Add tracking fields
-- =====================================================

-- Add new tracking columns
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS materials_budget DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS labor_budget DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS actual_materials_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS actual_labor_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5, 2) GENERATED ALWAYS AS (
  CASE 
    WHEN value > 0 AND (COALESCE(actual_materials_cost, 0) + COALESCE(actual_labor_cost, 0)) > 0
    THEN ((value - (COALESCE(actual_materials_cost, 0) + COALESCE(actual_labor_cost, 0))) / value) * 100
    ELSE NULL
  END
) STORED,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_started_at ON public.projects(started_at);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON public.projects(priority DESC);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING gin(tags);

-- Comments
COMMENT ON COLUMN public.projects.profit_margin IS 'Auto-calculated profit margin percentage';
COMMENT ON COLUMN public.projects.priority IS 'Priority 1-10 (1 = highest, 10 = lowest)';
COMMENT ON COLUMN public.projects.tags IS 'Array of tags for categorization';

-- =====================================================
-- 4. UPDATE CUSTOMERS TABLE
-- Add notification preferences
-- =====================================================

-- Add notification and communication preferences
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50) DEFAULT 'email', -- 'email', 'sms', 'phone', 'whatsapp'
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_enabled": true,
  "sms_enabled": false,
  "planning_reminders": true,
  "completion_notifications": true,
  "invoice_notifications": true,
  "marketing": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'nl', -- 'nl', 'en', 'de', 'fr'
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Europe/Amsterdam',
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) DEFAULT 'particulier', -- 'particulier', 'zakelijk', 'overheid'
ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Nederland',
ADD COLUMN IF NOT EXISTS coordinates_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS coordinates_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS customer_since DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS total_projects_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_satisfaction DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(12, 2) DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_postal_code ON public.customers(postal_code);
CREATE INDEX IF NOT EXISTS idx_customers_last_contact ON public.customers(last_contact_at DESC);

-- Comments
COMMENT ON COLUMN public.customers.notification_preferences IS 'JSON object with notification preferences';
COMMENT ON COLUMN public.customers.customer_type IS 'Type: particulier, zakelijk, overheid';
COMMENT ON COLUMN public.customers.lifetime_value IS 'Total value of all completed projects';

-- =====================================================
-- 5. CREATE VIEW FOR PLANNING OVERVIEW
-- =====================================================

-- Create materialized view for dashboard statistics
CREATE OR REPLACE VIEW public.planning_overview AS
SELECT 
  pi.id,
  pi.title,
  pi.planning_type,
  pi.start_date,
  pi.start_time,
  pi.end_time,
  pi.location,
  pi.status,
  pi.customer_id,
  c.name as customer_name,
  c.phone as customer_phone,
  c.address as customer_address,
  pi.assigned_user_id,
  p_assigned.full_name as assigned_user_name,
  pi.project_id,
  proj.title as project_title,
  proj.status as project_status,
  pi.confirmed_by_customer,
  pi.team_size,
  pi.expected_duration_minutes,
  pi.color_code,
  pi.created_at,
  -- Calculate if planning is today
  pi.start_date = CURRENT_DATE as is_today,
  -- Calculate if planning is upcoming (within 7 days)
  pi.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' as is_upcoming,
  -- Calculate if planning is overdue
  pi.start_date < CURRENT_DATE AND pi.status != 'Afgerond' as is_overdue,
  -- Count participants
  (SELECT COUNT(*) FROM public.planning_participants pp WHERE pp.planning_id = pi.id) as participant_count
FROM public.planning_items pi
LEFT JOIN public.customers c ON pi.customer_id = c.id
LEFT JOIN public.profiles p_assigned ON pi.assigned_user_id = p_assigned.id
LEFT JOIN public.projects proj ON pi.project_id::uuid = proj.id;

COMMENT ON VIEW public.planning_overview IS 'Comprehensive planning overview with customer and project details';

-- =====================================================
-- 6. CREATE VIEW FOR WORK TIME SUMMARY
-- =====================================================

CREATE OR REPLACE VIEW public.work_time_summary AS
SELECT 
  wtl.id,
  wtl.project_id,
  p.title as project_title,
  wtl.installer_id,
  prof.full_name as installer_name,
  wtl.started_at,
  wtl.ended_at,
  wtl.status,
  wtl.total_duration_minutes,
  wtl.break_duration_minutes,
  wtl.total_duration_minutes - wtl.break_duration_minutes as net_duration_minutes,
  (wtl.total_duration_minutes - wtl.break_duration_minutes) / 60.0 as net_hours,
  wtl.start_location_lat,
  wtl.start_location_lng,
  wtl.end_location_lat,
  wtl.end_location_lng,
  wtl.distance_from_project_km,
  DATE(wtl.started_at) as work_date,
  -- Check if currently active
  wtl.status IN ('active', 'paused') AND wtl.ended_at IS NULL as is_active
FROM public.work_time_logs wtl
JOIN public.projects p ON wtl.project_id = p.id
JOIN public.profiles prof ON wtl.installer_id = prof.id;

COMMENT ON VIEW public.work_time_summary IS 'Summary of work time logs with calculations';

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_planning_items_date_status 
  ON public.planning_items(start_date, status);

CREATE INDEX IF NOT EXISTS idx_planning_items_assigned_date 
  ON public.planning_items(assigned_user_id, start_date);

CREATE INDEX IF NOT EXISTS idx_work_time_logs_installer_date 
  ON public.work_time_logs(installer_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_material_usage_project_category 
  ON public.material_usage(project_id, category);

-- =====================================================
-- 8. UPDATE FUNCTIONS
-- =====================================================

-- Function to update project statistics when completion is added
CREATE OR REPLACE FUNCTION update_project_stats_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update project with completion stats
  UPDATE public.projects
  SET 
    actual_hours = (
      SELECT get_project_work_hours(NEW.project_id)
    ),
    actual_materials_cost = (
      SELECT get_project_material_costs(NEW.project_id)
    ),
    actual_labor_cost = NEW.labor_cost
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_stats_on_completion ON public.project_completions;
CREATE TRIGGER trigger_update_project_stats_on_completion
AFTER INSERT OR UPDATE ON public.project_completions
FOR EACH ROW
EXECUTE FUNCTION update_project_stats_on_completion();

-- Function to update customer statistics
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.customers
  SET 
    total_projects_completed = (
      SELECT COUNT(*)
      FROM public.projects
      WHERE customer_id = NEW.customer_id
      AND status = 'afgerond'
    ),
    average_satisfaction = (
      SELECT AVG(customer_satisfaction)
      FROM public.project_completions pc
      JOIN public.projects p ON pc.project_id = p.id
      WHERE p.customer_id = NEW.customer_id
    ),
    lifetime_value = (
      SELECT COALESCE(SUM(value), 0)
      FROM public.projects
      WHERE customer_id = NEW.customer_id
      AND status = 'afgerond'
    )
  WHERE id = (
    SELECT customer_id FROM public.projects WHERE id = NEW.project_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_stats ON public.project_completions;
CREATE TRIGGER trigger_update_customer_stats
AFTER INSERT OR UPDATE ON public.project_completions
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats();

-- =====================================================
-- DATA MIGRATION
-- =====================================================

-- Set default planning_type for existing records
UPDATE public.planning_items
SET planning_type = 'monteur'
WHERE planning_type IS NULL;

-- Set default customer notification preferences for existing customers
UPDATE public.customers
SET notification_preferences = '{
  "email_enabled": true,
  "sms_enabled": false,
  "planning_reminders": true,
  "completion_notifications": true,
  "invoice_notifications": true,
  "marketing": false
}'::jsonb
WHERE notification_preferences IS NULL;

