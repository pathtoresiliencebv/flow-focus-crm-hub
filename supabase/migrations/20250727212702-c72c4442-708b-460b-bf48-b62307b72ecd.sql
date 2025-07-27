-- Continue fixing remaining database functions with search_path

CREATE OR REPLACE FUNCTION public.generate_project_tasks_from_quote(p_project_id uuid, p_quote_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_direct_channel(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  channel_id uuid;
  channel_name text;
  sorted_user1 uuid;
  sorted_user2 uuid;
BEGIN
  -- Sort user IDs to ensure consistent channel creation regardless of who initiates
  IF user1_id < user2_id THEN
    sorted_user1 := user1_id;
    sorted_user2 := user2_id;
  ELSE
    sorted_user1 := user2_id;
    sorted_user2 := user1_id;
  END IF;
  
  -- Check if direct channel already exists
  SELECT c.id INTO channel_id
  FROM chat_channels c
  WHERE c.is_direct_message = true
    AND c.participants @> jsonb_build_array(sorted_user1::text, sorted_user2::text)
    AND jsonb_array_length(c.participants) = 2;
  
  -- If channel doesn't exist, create it
  IF channel_id IS NULL THEN
    -- Get user names for channel name
    SELECT CONCAT(
      COALESCE((SELECT full_name FROM public.profiles WHERE id = sorted_user1), 'User'),
      ' & ',
      COALESCE((SELECT full_name FROM public.profiles WHERE id = sorted_user2), 'User')
    ) INTO channel_name;
    
    -- Create the channel
    INSERT INTO chat_channels (name, type, is_direct_message, participants, created_by)
    VALUES (
      channel_name,
      'direct',
      true,
      jsonb_build_array(sorted_user1::text, sorted_user2::text),
      user1_id
    )
    RETURNING id INTO channel_id;
    
    -- Add both users as participants
    INSERT INTO chat_participants (channel_id, user_id, role)
    VALUES 
      (channel_id, sorted_user1, 'member'),
      (channel_id, sorted_user2, 'member');
  END IF;
  
  RETURN channel_id;
END;
$function$;