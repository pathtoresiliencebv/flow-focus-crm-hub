-- Add columns for better direct messaging support
ALTER TABLE public.chat_channels 
ADD COLUMN IF NOT EXISTS is_direct_message boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS participants jsonb DEFAULT '[]'::jsonb;

-- Create function to get or create direct message channel between two users
CREATE OR REPLACE FUNCTION public.get_or_create_direct_channel(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      COALESCE((SELECT full_name FROM profiles WHERE id = sorted_user1), 'User'),
      ' & ',
      COALESCE((SELECT full_name FROM profiles WHERE id = sorted_user2), 'User')
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
$$;

-- Function to get available chat users based on current user role
CREATE OR REPLACE FUNCTION public.get_available_chat_users(current_user_id uuid)
RETURNS TABLE(id uuid, full_name text, role user_role, is_online boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Get current user's role
  SELECT p.role INTO current_user_role FROM profiles p WHERE p.id = current_user_id;
  
  -- Return users based on role permissions
  IF current_user_role = 'Administrator' THEN
    -- Administrators can chat with everyone except themselves
    RETURN QUERY
    SELECT p.id, p.full_name, p.role, p.is_online
    FROM profiles p
    WHERE p.id != current_user_id
    ORDER BY p.role, p.full_name;
  ELSE
    -- Non-administrators can only chat with administrators
    RETURN QUERY
    SELECT p.id, p.full_name, p.role, p.is_online
    FROM profiles p
    WHERE p.role = 'Administrator'
      AND p.id != current_user_id
    ORDER BY p.full_name;
  END IF;
END;
$$;