-- Create materials table for project material tracking
CREATE TABLE IF NOT EXISTS public.project_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  material_name TEXT NOT NULL,
  quantity NUMERIC,
  unit_price NUMERIC,
  total_cost NUMERIC,
  supplier TEXT,
  receipt_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID NOT NULL
);

-- Create receipts table for project receipt tracking
CREATE TABLE IF NOT EXISTS public.project_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  receipt_date DATE,
  supplier TEXT,
  total_amount NUMERIC,
  description TEXT,
  receipt_photo_url TEXT NOT NULL,
  category TEXT DEFAULT 'material',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID NOT NULL
);

-- Add source_quote_item_id to project_tasks if not exists
ALTER TABLE public.project_tasks 
ADD COLUMN IF NOT EXISTS source_quote_block_id TEXT,
ADD COLUMN IF NOT EXISTS quote_item_type TEXT DEFAULT 'product';

-- Enable RLS
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for project_materials
CREATE POLICY "Users can view project materials for accessible projects" 
ON public.project_materials 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects p WHERE p.id = project_materials.project_id
));

CREATE POLICY "Users can create project materials" 
ON public.project_materials 
FOR INSERT 
WITH CHECK (
  added_by = auth.uid() AND 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_materials.project_id)
);

CREATE POLICY "Users can update project materials" 
ON public.project_materials 
FOR UPDATE 
USING (
  added_by = auth.uid() OR 
  get_user_role(auth.uid()) = 'Administrator'::user_role
);

-- Create policies for project_receipts
CREATE POLICY "Users can view project receipts for accessible projects" 
ON public.project_receipts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects p WHERE p.id = project_receipts.project_id
));

CREATE POLICY "Users can create project receipts" 
ON public.project_receipts 
FOR INSERT 
WITH CHECK (
  added_by = auth.uid() AND 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_receipts.project_id)
);

CREATE POLICY "Users can update project receipts" 
ON public.project_receipts 
FOR UPDATE 
USING (
  added_by = auth.uid() OR 
  get_user_role(auth.uid()) = 'Administrator'::user_role
);

-- Create function to generate project tasks from approved quote
CREATE OR REPLACE FUNCTION public.generate_project_tasks_from_quote(
  p_project_id UUID,
  p_quote_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quote_data RECORD;
  quote_blocks JSONB;
  block_item JSONB;
  block_data JSONB;
  task_order INTEGER := 0;
BEGIN
  -- Get quote data
  SELECT * INTO quote_data FROM public.quotes WHERE id = p_quote_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;
  
  -- Parse quote items/blocks
  quote_blocks := quote_data.items;
  
  -- Process each block
  FOR block_data IN SELECT * FROM jsonb_array_elements(quote_blocks)
  LOOP
    -- If this is a block structure (has items array)
    IF block_data ? 'items' AND jsonb_typeof(block_data->'items') = 'array' THEN
      -- Add block title as info block
      INSERT INTO public.project_tasks (
        project_id,
        block_title,
        task_description,
        is_info_block,
        order_index,
        source_quote_block_id,
        quote_item_type
      ) VALUES (
        p_project_id,
        COALESCE(block_data->>'title', 'Blok'),
        COALESCE(block_data->>'title', 'Blok'),
        true,
        task_order,
        block_data->>'id',
        COALESCE(block_data->>'type', 'product')
      );
      
      task_order := task_order + 1;
      
      -- Process items in block
      FOR block_item IN SELECT * FROM jsonb_array_elements(block_data->'items')
      LOOP
        IF block_item->>'type' = 'product' THEN
          -- Create task for product
          INSERT INTO public.project_tasks (
            project_id,
            block_title,
            task_description,
            is_info_block,
            order_index,
            source_quote_block_id,
            quote_item_type
          ) VALUES (
            p_project_id,
            COALESCE(block_data->>'title', 'Blok'),
            block_item->>'description',
            false,
            task_order,
            block_item->>'id',
            'product'
          );
        ELSE
          -- Create info block for text
          INSERT INTO public.project_tasks (
            project_id,
            block_title,
            task_description,
            info_text,
            is_info_block,
            order_index,
            source_quote_block_id,
            quote_item_type
          ) VALUES (
            p_project_id,
            COALESCE(block_data->>'title', 'Blok'),
            block_item->>'description',
            block_item->>'description',
            true,
            task_order,
            block_item->>'id',
            'textblock'
          );
        END IF;
        
        task_order := task_order + 1;
      END LOOP;
    ELSE
      -- Old flat structure - direct item
      IF block_data->>'type' = 'product' OR block_data->>'type' IS NULL THEN
        -- Create task for product
        INSERT INTO public.project_tasks (
          project_id,
          block_title,
          task_description,
          is_info_block,
          order_index,
          source_quote_block_id,
          quote_item_type
        ) VALUES (
          p_project_id,
          'Items',
          block_data->>'description',
          false,
          task_order,
          block_data->>'id',
          COALESCE(block_data->>'type', 'product')
        );
      ELSE
        -- Create info block for text
        INSERT INTO public.project_tasks (
          project_id,
          block_title,
          task_description,
          info_text,
          is_info_block,
          order_index,
          source_quote_block_id,
          quote_item_type
        ) VALUES (
          p_project_id,
          'Items',
          block_data->>'description',
          block_data->>'description',
          true,
          task_order,
          block_data->>'id',
          'textblock'
        );
      END IF;
      
      task_order := task_order + 1;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to auto-generate tasks when quote is approved
CREATE OR REPLACE FUNCTION public.auto_generate_project_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if quote status changed to approved and has associated project
  IF NEW.status = 'goedgekeurd' AND OLD.status != 'goedgekeurd' THEN
    -- Find associated project
    DECLARE
      project_record RECORD;
    BEGIN
      SELECT * INTO project_record 
      FROM public.projects 
      WHERE quote_id = NEW.id;
      
      IF FOUND THEN
        -- Generate tasks from quote
        PERFORM public.generate_project_tasks_from_quote(project_record.id, NEW.id);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_project_tasks ON public.quotes;
CREATE TRIGGER trigger_auto_generate_project_tasks
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_project_tasks();

-- Create updated_at triggers for new tables
CREATE TRIGGER update_project_materials_updated_at
  BEFORE UPDATE ON public.project_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_receipts_updated_at
  BEFORE UPDATE ON public.project_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();