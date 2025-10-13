-- =====================================================
-- FIX: Invoice Creation, Planning Integration & Stripe
-- Issues:
-- 1. Invoices kunnen niet worden aangemaakt (missing user_id)
-- 2. Project komt niet in planning bij quote approval
-- 3. Stripe payment link ontbreekt in facturen
-- Created: 2025-10-13
-- =====================================================

-- ========================================
-- 1. ADD USER_ID TO INVOICES
-- ========================================

-- Add user_id column to invoices (required for RLS)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- Comment
COMMENT ON COLUMN public.invoices.user_id IS 'User who created the invoice (required for RLS)';

-- Migrate existing invoices - link to user via source quote
UPDATE public.invoices i
SET user_id = q.user_id
FROM public.quotes q
WHERE i.source_quote_id = q.id
AND i.user_id IS NULL
AND q.user_id IS NOT NULL;

-- ========================================
-- 2. ENSURE PAYMENT LINK COLUMNS EXIST
-- ========================================

-- Add payment_link_url if not exists
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_link_url TEXT;

-- Add stripe_checkout_session_id if not exists
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_payment_link ON public.invoices(payment_link_url) WHERE payment_link_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_session ON public.invoices(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.invoices.payment_link_url IS 'Stripe payment link URL for customer payment';
COMMENT ON COLUMN public.invoices.stripe_checkout_session_id IS 'Stripe checkout session ID for tracking';

-- ========================================
-- 3. PROJECT_ID COLUMN FOR INVOICES
-- ========================================

-- Add project_id to invoices for better relational linking
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);

-- Comment
COMMENT ON COLUMN public.invoices.project_id IS 'Foreign key to projects table for relational linking';

-- Migrate existing invoices - link to project via source quote
UPDATE public.invoices i
SET project_id = q.project_id
FROM public.quotes q
WHERE i.source_quote_id = q.id
AND i.project_id IS NULL
AND q.project_id IS NOT NULL;

-- ========================================
-- 4. TRIGGER: AUTO-CREATE PLANNING ON QUOTE APPROVAL
-- ========================================

-- Function to create planning when quote is approved
CREATE OR REPLACE FUNCTION auto_create_planning_on_quote_approval()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  planning_exists BOOLEAN;
BEGIN
  -- Only trigger when status changes TO 'approved' or 'goedgekeurd'
  IF (NEW.status = 'approved' OR NEW.status = 'goedgekeurd') 
     AND (OLD.status IS NULL OR (OLD.status != 'approved' AND OLD.status != 'goedgekeurd'))
     AND NEW.project_id IS NOT NULL THEN
    
    RAISE NOTICE 'Quote approved: %, checking for project: %', NEW.id, NEW.project_id;
    
    -- Get project details
    SELECT * INTO project_record
    FROM public.projects
    WHERE id = NEW.project_id;
    
    IF NOT FOUND THEN
      RAISE NOTICE 'Project % not found', NEW.project_id;
      RETURN NEW;
    END IF;
    
    -- Check if planning already exists for this project
    SELECT EXISTS(
      SELECT 1 FROM public.planning_items
      WHERE project_id = NEW.project_id
    ) INTO planning_exists;
    
    IF planning_exists THEN
      RAISE NOTICE 'Planning already exists for project %', NEW.project_id;
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Creating planning for project: %', project_record.title;
    
    -- Create planning item
    INSERT INTO public.planning_items (
      project_id,
      title,
      description,
      start_date,
      start_time,
      end_time,
      status,
      assigned_user_id,
      user_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.project_id,
      'Project: ' || project_record.title,
      COALESCE(project_record.description, 'Projectuitvoering na goedkeuring offerte'),
      COALESCE(project_record.date, CURRENT_DATE + INTERVAL '7 days'), -- 1 week from now if no date
      '08:00:00',
      '17:00:00',
      'gepland',
      project_record.assigned_user_id,
      COALESCE(project_record.assigned_user_id, project_record.user_id, NEW.user_id),
      NOW(),
      NOW()
    );
    
    -- Update project status to 'gepland'
    UPDATE public.projects
    SET status = 'gepland',
        updated_at = NOW()
    WHERE id = NEW.project_id
    AND status = 'te-plannen';
    
    RAISE NOTICE '✅ Planning created and project status updated for: %', project_record.title;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_create_planning_on_quote_approval ON public.quotes;

-- Create trigger
CREATE TRIGGER trigger_auto_create_planning_on_quote_approval
AFTER UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION auto_create_planning_on_quote_approval();

-- ========================================
-- 5. UPDATE RLS POLICIES FOR INVOICES
-- ========================================

-- Drop old overly permissive policy
DROP POLICY IF EXISTS "Enable all operations for invoices" ON public.invoices;

-- Create proper RLS policies
CREATE POLICY "Users can view their own invoices"
ON public.invoices FOR SELECT
USING (
  auth.uid() = user_id
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrator'
  OR
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = user_id)
  )
);

CREATE POLICY "Users can insert their own invoices"
ON public.invoices FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrator'
);

CREATE POLICY "Users can update their own invoices"
ON public.invoices FOR UPDATE
USING (
  auth.uid() = user_id
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrator'
  OR
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = user_id)
  )
);

CREATE POLICY "Admins can delete invoices"
ON public.invoices FOR DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrator'
);

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Invoice fixes applied successfully!';
  RAISE NOTICE '1. Added user_id to invoices (% invoices migrated)', (SELECT COUNT(*) FROM public.invoices WHERE user_id IS NOT NULL);
  RAISE NOTICE '2. Added payment_link_url and stripe_checkout_session_id columns';
  RAISE NOTICE '3. Added project_id to invoices (% linked)', (SELECT COUNT(*) FROM public.invoices WHERE project_id IS NOT NULL);
  RAISE NOTICE '4. Created trigger for auto planning creation on quote approval';
  RAISE NOTICE '5. Updated RLS policies for proper access control';
END $$;

