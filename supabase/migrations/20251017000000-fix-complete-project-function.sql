-- Fix complete_project function to properly create work order and link tasks
-- This migration updates the complete_project RPC function to:
-- 1. Create a work order with correct timestamp
-- 2. Link selected tasks to the work order
-- 3. Update project status and completion

-- Drop ALL versions of the complete_project function
DROP FUNCTION IF EXISTS complete_project(UUID, UUID);
DROP FUNCTION IF EXISTS complete_project(UUID, UUID, UUID[]);

-- Create the updated function with task linking and work order creation
CREATE OR REPLACE FUNCTION complete_project(
  p_project_id UUID,
  p_completion_id UUID,
  p_task_ids UUID[] DEFAULT '{}'::UUID[]
)
RETURNS JSONB AS $$
DECLARE
  v_work_order_id UUID;
  v_work_order_number TEXT;
  v_task_id UUID;
  v_updated_count INTEGER := 0;
  v_completion RECORD;
BEGIN
  -- Get client name and signature from completion
  SELECT customer_name, customer_signature, installer_signature, work_performed
  INTO v_completion
  FROM project_completions
  WHERE id = p_completion_id;
  
  -- Generate a unique work order number
  -- Format: WB-YYYY-MM-DD-HH24MISS (Werkbon - Year-Month-Day-HourMinuteSecond)
  v_work_order_number := 'WB-' || TO_CHAR(NOW(), 'YYYY-MM-DD-HH24MISS');
  
  -- Ensure the work order number is unique
  WHILE EXISTS (SELECT 1 FROM project_work_orders WHERE work_order_number = v_work_order_number) LOOP
    v_work_order_number := 'WB-' || TO_CHAR(NOW(), 'YYYY-MM-DD-HH24MISS') || '-' || SUBSTRING(p_project_id::TEXT, 1, 4);
  END LOOP;
  
  -- Create the work order with correct timestamp
  INSERT INTO project_work_orders (
    id,
    project_id,
    completion_id,
    work_order_number,
    client_name,
    client_signature_data,
    monteur_signature_data,
    summary_text,
    signed_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_project_id,
    p_completion_id,
    v_work_order_number,
    v_completion.customer_name,
    v_completion.customer_signature,
    v_completion.installer_signature,
    v_completion.work_performed,
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_work_order_id;
  
  -- Link all selected tasks to this work order
  IF p_task_ids IS NOT NULL AND array_length(p_task_ids, 1) > 0 THEN
    FOREACH v_task_id IN ARRAY p_task_ids LOOP
      UPDATE project_tasks
      SET 
        work_order_id = v_work_order_id,
        is_completed = true,
        updated_at = NOW()
      WHERE id = v_task_id
        AND project_id = p_project_id;
    END LOOP;
  END IF;
  
  -- Update project status and link completion
  UPDATE projects 
  SET 
    status = 'afgerond',
    completion_date = CURRENT_DATE,
    completion_id = p_completion_id,
    updated_at = NOW()
  WHERE id = p_project_id;
  
  -- Update completion status
  UPDATE project_completions
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_completion_id;
  
  -- Return summary as JSONB
  RETURN jsonb_build_object(
    'success', TRUE,
    'work_order_id', v_work_order_id,
    'work_order_number', v_work_order_number,
    'tasks_linked', COALESCE(array_length(p_task_ids, 1), 0),
    'project_status', 'afgerond'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'error_detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION complete_project(UUID, UUID, UUID[]) TO authenticated;

COMMENT ON FUNCTION complete_project(UUID, UUID, UUID[]) IS 
'Completes a project by creating a work order, linking selected tasks, and updating project status.';

