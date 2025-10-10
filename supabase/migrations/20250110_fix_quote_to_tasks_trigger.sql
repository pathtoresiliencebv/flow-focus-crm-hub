-- Fix quote to project tasks conversion
-- This migration ensures that quote items are properly converted to project tasks

-- First, let's check if the trigger exists and is working
-- If not, we'll recreate it

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_generate_project_tasks ON public.projects;

-- Recreate the function to ensure it's working properly
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

-- Recreate the trigger
CREATE TRIGGER trigger_generate_project_tasks
  AFTER INSERT OR UPDATE OF quote_id ON public.projects
  FOR EACH ROW
  WHEN (NEW.quote_id IS NOT NULL)
  EXECUTE FUNCTION public.generate_project_tasks_from_quote();

-- Also create a manual function to trigger task generation for existing projects
CREATE OR REPLACE FUNCTION public.regenerate_project_tasks_from_quote(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  project_record RECORD;
  quote_record RECORD;
  block_item RECORD;
  item_record RECORD;
  task_order INTEGER := 0;
BEGIN
  -- Get project
  SELECT * INTO project_record
  FROM public.projects
  WHERE id = p_project_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project % not found', p_project_id;
  END IF;
  
  IF project_record.quote_id IS NULL THEN
    RAISE EXCEPTION 'Project % has no quote_id', p_project_id;
  END IF;
  
  -- Get quote
  SELECT * INTO quote_record
  FROM public.quotes
  WHERE id = project_record.quote_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote % not found', project_record.quote_id;
  END IF;
  
  RAISE NOTICE 'Regenerating tasks for project % from quote %', p_project_id, project_record.quote_id;
  
  -- Delete existing tasks
  DELETE FROM public.project_tasks WHERE project_id = p_project_id;
  
  -- Process blocks (new format)
  IF quote_record.blocks IS NOT NULL AND jsonb_array_length(quote_record.blocks) > 0 THEN
    RAISE NOTICE 'Processing quote blocks...';
    
    FOR block_item IN 
      SELECT * FROM jsonb_array_elements(quote_record.blocks)
    LOOP
      FOR item_record IN
        SELECT * FROM jsonb_array_elements(block_item.value->'items')
      LOOP
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
          p_project_id,
          COALESCE(block_item.value->>'title', 'Werkzaamheden'),
          CASE 
            WHEN item_record.value->>'type' = 'text' THEN NULL
            ELSE COALESCE(item_record.value->>'description', item_record.value->>'name')
          END,
          item_record.value->>'type' = 'text',
          CASE 
            WHEN item_record.value->>'type' = 'text' THEN item_record.value->>'description'
            ELSE NULL
          END,
          false,
          task_order,
          item_record.value->>'id'
        );
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % tasks from blocks', task_order;
  
  -- Process items (old format)
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
        p_project_id,
        'Werkzaamheden',
        COALESCE(item_record.value->>'description', item_record.value->>'name'),
        false,
        task_order,
        item_record.value->>'id'
      );
    END LOOP;
    
    RAISE NOTICE 'Created % tasks from items', task_order;
  ELSE
    RAISE NOTICE 'No items or blocks found in quote %', project_record.quote_id;
  END IF;
  
  -- Log activity
  IF task_order > 0 THEN
    INSERT INTO public.project_activities (
      project_id,
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      p_project_id,
      COALESCE(auth.uid(), project_record.created_by),
      'tasks_regenerated',
      format('Handmatig %s taken gegenereerd uit offerte', task_order),
      jsonb_build_object(
        'task_count', task_order,
        'quote_id', project_record.quote_id
      )
    );
  END IF;
  
  RETURN task_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.regenerate_project_tasks_from_quote(UUID) TO authenticated;
