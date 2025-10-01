-- 🔧 FIX FOREIGN KEY CONSTRAINT VOOR CHAT
-- Het probleem: profiles!from_user_id foreign key bestaat niet

-- STAP 1: Check bestaande foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='direct_messages';

-- STAP 2: Drop oude foreign keys (als ze bestaan met verkeerde naam)
ALTER TABLE direct_messages 
DROP CONSTRAINT IF EXISTS direct_messages_from_user_id_fkey;

ALTER TABLE direct_messages 
DROP CONSTRAINT IF EXISTS direct_messages_to_user_id_fkey;

-- STAP 3: Maak NIEUWE foreign keys met correcte naam
ALTER TABLE direct_messages
ADD CONSTRAINT direct_messages_from_user_id_fkey 
FOREIGN KEY (from_user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE direct_messages
ADD CONSTRAINT direct_messages_to_user_id_fkey 
FOREIGN KEY (to_user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- STAP 4: Verifieer
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='direct_messages';

