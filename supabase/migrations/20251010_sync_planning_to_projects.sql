-- =====================================================
-- PLANNING ↔ PROJECT SYNCHRONISATIE
-- Purpose: Automatische sync tussen planning en projecten
-- Features: Multi-monteur, activity logging, auto-generate tasks
-- Created: 2025-10-10
-- =====================================================

-- ========================================
-- 1. PROJECT ACTIVITIES TABEL
-- ========================================

CREATE TABLE IF NOT EXISTS public.project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  activity_type text NOT NULL, 
  -- Types: 'planning_created', 'planning_removed', 'status_changed', 
  --        'quote_approved', 'invoice_paid', 'project_completed', 
  --        'workorder_added', 'receipt_added', 'task_completed'
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id 
  ON public.project_activities(project_id);
  
CREATE INDEX IF NOT EXISTS idx_project_activities_created_at 
  ON public.project_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_activities_type
  ON public.project_activities(activity_type);

-- RLS Policies
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project activities"
  ON public.project_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_activities.project_id
    )
    OR public.get_user_role(auth.uid()) = 'Administrator'
  );

CREATE POLICY "Users can create project activities"
  ON public.project_activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ========================================
-- 2. PLANNING PARTICIPANTS (MULTI-MONTEUR)
-- ========================================

CREATE TABLE IF NOT EXISTS public.planning_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_item_id uuid NOT NULL REFERENCES public.planning_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text DEFAULT 'monteur', -- 'monteur', 'lead', 'helper'
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(planning_item_id, user_id)
);

-- Index voor snelle queries
CREATE INDEX IF NOT EXISTS idx_planning_participants_planning_id
  ON public.planning_participants(planning_item_id);

CREATE INDEX IF NOT EXISTS idx_planning_participants_user_id
  ON public.planning_participants(user_id);

-- RLS Policies
ALTER TABLE public.planning_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view planning participants"
  ON public.planning_participants FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.planning_items pi
      WHERE pi.id = planning_participants.planning_item_id
      AND (pi.user_id = auth.uid() OR pi.assigned_user_id = auth.uid())
    )
    OR public.get_user_role(auth.uid()) = 'Administrator'
  );

CREATE POLICY "Admins can manage planning participants"
  ON public.planning_participants FOR ALL
  USING (public.get_user_role(auth.uid()) = 'Administrator');

-- ========================================
-- 3. FUNCTION: GENERATE PROJECT TASKS FROM QUOTE
-- ========================================

CREATE OR REPLACE FUNCTION public.generate_project_tasks_from_quote()
RETURNS TRIGGER AS $$
DECLARE
  quote_record RECORD;
  block_item RECORD;
  item_record RECORD;
  task_order INTEGER := 0;
BEGIN
  -- Alleen uitvoeren als er een quote_id is
  IF NEW.quote_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Haal offerte op
  SELECT * INTO quote_record
  FROM public.quotes
  WHERE id = NEW.quote_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Quote % not found', NEW.quote_id;
    RETURN NEW;
  END IF;
  
  RAISE NOTICE 'Generating project tasks for project % from quote %', NEW.id, NEW.quote_id;
  
  -- Verwijder bestaande taken (voor re-sync)
  DELETE FROM public.project_tasks WHERE project_id = NEW.id;
  
  -- Check voor BLOCKS structuur (nieuw formaat)
  IF quote_record.blocks IS NOT NULL AND jsonb_array_length(quote_record.blocks) > 0 THEN
    RAISE NOTICE 'Processing quote blocks...';
    
    -- Loop door blocks
    FOR block_item IN 
      SELECT * FROM jsonb_array_elements(quote_record.blocks)
    LOOP
      -- Loop door items in block
      FOR item_record IN
        SELECT * FROM jsonb_array_elements(block_item.value->'items')
      LOOP
        -- Maak task voor ALLE items (producten EN tekst items)
        task_order := task_order + 1;
        
        INSERT INTO public.project_tasks (
          project_id,
          block_title,
          task_description,
          is_info_block,
          info_text,
          is_completed,
          order_index,
          source_quote_item_id
        ) VALUES (
          NEW.id,
          COALESCE(block_item.value->>'title', 'Werkzaamheden'),
          CASE 
            WHEN item_record.value->>'type' = 'text' THEN NULL
            ELSE COALESCE(item_record.value->>'description', item_record.value->>'name')
          END,
          item_record.value->>'type' = 'text', -- is_info_block
          CASE 
            WHEN item_record.value->>'type' = 'text' THEN item_record.value->>'description'
            ELSE NULL
          END,
          false, -- is_completed
          task_order,
          item_record.value->>'id'
        );
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % tasks from blocks', task_order;
  
  -- Anders ITEMS structuur (oud formaat)
  ELSIF quote_record.items IS NOT NULL AND jsonb_array_length(quote_record.items) > 0 THEN
    RAISE NOTICE 'Processing quote items (old format)...';
    
    FOR item_record IN
      SELECT * FROM jsonb_array_elements(quote_record.items)
    LOOP
      task_order := task_order + 1;
      
      INSERT INTO public.project_tasks (
        project_id,
        block_title,
        task_description,
        is_completed,
        order_index,
        source_quote_item_id
      ) VALUES (
        NEW.id,
        'Werkzaamheden',
        COALESCE(item_record.value->>'description', item_record.value->>'name'),
        false,
        task_order,
        item_record.value->>'id'
      );
    END LOOP;
    
    RAISE NOTICE 'Created % tasks from items', task_order;
  ELSE
    RAISE NOTICE 'No items or blocks found in quote %', NEW.quote_id;
  END IF;
  
  -- Log activiteit
  IF task_order > 0 THEN
    INSERT INTO public.project_activities (
      project_id,
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.id,
      auth.uid(),
      'tasks_generated',
      format('Automatisch %s taken gegenereerd uit offerte', task_order),
      jsonb_build_object(
        'task_count', task_order,
        'quote_id', NEW.quote_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute bij INSERT/UPDATE van project.quote_id
DROP TRIGGER IF EXISTS trigger_generate_project_tasks ON public.projects;
CREATE TRIGGER trigger_generate_project_tasks
  AFTER INSERT OR UPDATE OF quote_id ON public.projects
  FOR EACH ROW
  WHEN (NEW.quote_id IS NOT NULL)
  EXECUTE FUNCTION public.generate_project_tasks_from_quote();

-- ========================================
-- 4. FUNCTION: SYNC PLANNING TO PROJECT (MULTI-MONTEUR)
-- ========================================

CREATE OR REPLACE FUNCTION public.sync_planning_to_project()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  participant_names TEXT;
  all_participants TEXT[];
BEGIN
  -- Alleen uitvoeren als er een project_id is
  IF NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Haal project op
  SELECT * INTO project_record 
  FROM public.projects 
  WHERE id = NEW.project_id::uuid;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Project % not found', NEW.project_id;
    RETURN NEW;
  END IF;
  
  RAISE NOTICE 'Syncing planning % to project %', NEW.id, NEW.project_id;
  
  -- Verzamel alle deelnemers (assigned_user_id + participants)
  all_participants := ARRAY[NEW.assigned_user_id];
  
  -- Voeg participants toe (uit planning_participants tabel)
  SELECT array_agg(user_id) INTO all_participants
  FROM (
    SELECT NEW.assigned_user_id as user_id
    UNION
    SELECT user_id FROM public.planning_participants 
    WHERE planning_item_id = NEW.id
  ) participants;
  
  -- Update project met eerste monteur en status
  UPDATE public.projects
  SET 
    assigned_user_id = NEW.assigned_user_id,
    status = CASE 
      WHEN status IN ('te-plannen', '') THEN 'gepland'
      ELSE status
    END,
    date = NEW.start_date,
    updated_at = NOW()
  WHERE id = NEW.project_id::uuid;
  
  -- Genereer namen string voor activiteit
  SELECT string_agg(
    COALESCE(p.full_name, p.email, 'Onbekend'), 
    ', '
  )
  INTO participant_names
  FROM public.profiles p
  WHERE p.id = ANY(all_participants);
  
  -- Log activiteit
  INSERT INTO public.project_activities (
    project_id,
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.project_id::uuid,
    NEW.user_id,
    'planning_created',
    format(
      'Project ingepland voor %s op %s om %s',
      COALESCE(participant_names, 'onbekend'),
      TO_CHAR(NEW.start_date, 'DD-MM-YYYY'),
      TO_CHAR(NEW.start_time, 'HH24:MI')
    ),
    jsonb_build_object(
      'planning_id', NEW.id,
      'participants', all_participants,
      'start_date', NEW.start_date,
      'start_time', NEW.start_time,
      'end_time', NEW.end_time,
      'location', NEW.location
    )
  );
  
  RAISE NOTICE 'Project % synced with planning %', NEW.project_id, NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute bij INSERT/UPDATE van planning
DROP TRIGGER IF EXISTS trigger_sync_planning_to_project ON public.planning_items;
CREATE TRIGGER trigger_sync_planning_to_project
  AFTER INSERT OR UPDATE OF project_id, assigned_user_id, start_date, start_time
  ON public.planning_items
  FOR EACH ROW
  WHEN (NEW.project_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_planning_to_project();

-- ========================================
-- 5. FUNCTION: CLEANUP PROJECT ON PLANNING DELETE
-- ========================================

CREATE OR REPLACE FUNCTION public.cleanup_project_on_planning_delete()
RETURNS TRIGGER AS $$
DECLARE
  remaining_planning_count INTEGER;
BEGIN
  -- Alleen uitvoeren als er een project_id was
  IF OLD.project_id IS NULL THEN
    RETURN OLD;
  END IF;
  
  -- Check of er nog andere planning items zijn voor dit project
  SELECT COUNT(*) INTO remaining_planning_count
  FROM public.planning_items 
  WHERE project_id = OLD.project_id::uuid 
  AND id != OLD.id;
  
  RAISE NOTICE 'Planning % deleted, remaining planning items: %', OLD.id, remaining_planning_count;
  
  -- Als dit de LAATSTE planning was, reset project
  IF remaining_planning_count = 0 THEN
    UPDATE public.projects
    SET 
      status = CASE
        WHEN status = 'gepland' THEN 'te-plannen'
        ELSE status
      END,
      assigned_user_id = NULL,
      updated_at = NOW()
    WHERE id = OLD.project_id::uuid
    AND status = 'gepland';
    
    -- Log activiteit
    INSERT INTO public.project_activities (
      project_id,
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      OLD.project_id::uuid,
      OLD.user_id,
      'planning_removed',
      'Planning verwijderd - project terug naar "Te Plannen"',
      jsonb_build_object(
        'planning_id', OLD.id,
        'previous_status', 'gepland'
      )
    );
    
    RAISE NOTICE 'Project % reset to te-plannen', OLD.project_id;
  ELSE
    -- Er zijn nog andere planning items, log alleen de verwijdering
    INSERT INTO public.project_activities (
      project_id,
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      OLD.project_id::uuid,
      OLD.user_id,
      'planning_removed',
      format('Planning verwijderd (%s resterende planningen)', remaining_planning_count),
      jsonb_build_object(
        'planning_id', OLD.id,
        'remaining_count', remaining_planning_count
      )
    );
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute bij DELETE van planning
DROP TRIGGER IF EXISTS trigger_cleanup_project_on_planning_delete ON public.planning_items;
CREATE TRIGGER trigger_cleanup_project_on_planning_delete
  AFTER DELETE ON public.planning_items
  FOR EACH ROW
  WHEN (OLD.project_id IS NOT NULL)
  EXECUTE FUNCTION public.cleanup_project_on_planning_delete();

-- ========================================
-- 6. FUNCTION: LOG QUOTE APPROVAL
-- ========================================

CREATE OR REPLACE FUNCTION public.log_quote_approval()
RETURNS TRIGGER AS $$
DECLARE
  related_project_id uuid;
BEGIN
  -- Check of status naar 'goedgekeurd' gaat
  IF NEW.status = 'goedgekeurd' AND (OLD.status IS NULL OR OLD.status != 'goedgekeurd') THEN
    
    -- Zoek gekoppeld project
    SELECT id INTO related_project_id
    FROM public.projects
    WHERE quote_id = NEW.id
    LIMIT 1;
    
    IF related_project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        user_id,
        activity_type,
        description,
        metadata
      ) VALUES (
        related_project_id,
        COALESCE(auth.uid(), NEW.created_by),
        'quote_approved',
        format('Offerte %s goedgekeurd', NEW.quote_number),
        jsonb_build_object(
          'quote_id', NEW.id,
          'quote_number', NEW.quote_number,
          'total_amount', NEW.total_amount
        )
      );
      
      RAISE NOTICE 'Logged quote approval for project %', related_project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute bij UPDATE van quote status
DROP TRIGGER IF EXISTS trigger_log_quote_approval ON public.quotes;
CREATE TRIGGER trigger_log_quote_approval
  AFTER UPDATE OF status ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_quote_approval();

-- ========================================
-- 7. HELPER: Get user role function (if not exists)
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.project_activities IS 
'Activity log for projects - tracks all important events like planning, status changes, approvals, etc.';

COMMENT ON TABLE public.planning_participants IS 
'Multi-monteur support - tracks additional participants for planning items beyond assigned_user_id';

COMMENT ON FUNCTION public.generate_project_tasks_from_quote() IS 
'Automatically generates project_tasks from quote items when project.quote_id is set';

COMMENT ON FUNCTION public.sync_planning_to_project() IS 
'Syncs planning changes to project (monteur, status, date) and logs activity';

COMMENT ON FUNCTION public.cleanup_project_on_planning_delete() IS 
'Resets project to te-plannen when last planning item is deleted';

COMMENT ON FUNCTION public.log_quote_approval() IS 
'Logs activity when quote is approved';

