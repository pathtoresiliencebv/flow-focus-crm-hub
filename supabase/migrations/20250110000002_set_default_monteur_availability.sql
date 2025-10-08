-- =====================================================
-- SET DEFAULT AVAILABILITY FOR ALL MONTEURS
-- Purpose: Set Ma-Vr 07:00-17:00 for all Installateurs
-- Created: 2025-01-10
-- =====================================================

-- Insert default availability for all users with role 'Installateur'
-- Only if they don't already have availability set

DO $$
DECLARE
  monteur_record RECORD;
  days INTEGER[] := ARRAY[1, 2, 3, 4, 5]; -- Monday to Friday
  day_num INTEGER;
BEGIN
  -- Loop through all Installateurs
  FOR monteur_record IN 
    SELECT DISTINCT p.id, p.full_name
    FROM profiles p
    WHERE p.role = 'Installateur'
  LOOP
    RAISE NOTICE 'Processing monteur: % (ID: %)', monteur_record.full_name, monteur_record.id;
    
    -- Check if this user already has availability set
    IF NOT EXISTS (
      SELECT 1 FROM user_availability 
      WHERE user_id = monteur_record.id
    ) THEN
      -- Insert availability for Monday through Friday
      FOREACH day_num IN ARRAY days
      LOOP
        INSERT INTO user_availability (
          user_id,
          day_of_week,
          start_time,
          end_time,
          is_available,
          break_start_time,
          break_end_time,
          notes,
          created_at,
          updated_at
        ) VALUES (
          monteur_record.id,
          day_num,
          '07:00:00',
          '17:00:00',
          true,
          '12:00:00',
          '13:00:00',
          'Standaard werkweek (automatisch ingesteld)',
          NOW(),
          NOW()
        );
      END LOOP;
      
      RAISE NOTICE '✅ Availability set for: %', monteur_record.full_name;
    ELSE
      RAISE NOTICE '⏭️  Skipped (already has availability): %', monteur_record.full_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '🎉 Done! All monteurs now have availability set.';
END $$;

-- Verify results
DO $$
DECLARE
  total_monteurs INTEGER;
  monteurs_with_availability INTEGER;
BEGIN
  SELECT COUNT(DISTINCT p.id) INTO total_monteurs
  FROM profiles p
  WHERE p.role = 'Installateur';
  
  SELECT COUNT(DISTINCT ua.user_id) INTO monteurs_with_availability
  FROM user_availability ua
  INNER JOIN profiles p ON p.id = ua.user_id
  WHERE p.role = 'Installateur';
  
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   Total Monteurs: %', total_monteurs;
  RAISE NOTICE '   With Availability: %', monteurs_with_availability;
  
  IF total_monteurs = monteurs_with_availability THEN
    RAISE NOTICE '   ✅ All monteurs have availability set!';
  ELSE
    RAISE NOTICE '   ⚠️  % monteurs still need availability', (total_monteurs - monteurs_with_availability);
  END IF;
END $$;

-- Show the results
SELECT 
  p.full_name as "Monteur",
  p.email as "Email",
  COUNT(ua.id) as "Dagen Ingesteld",
  CASE 
    WHEN COUNT(ua.id) >= 5 THEN '✅ Compleet'
    WHEN COUNT(ua.id) > 0 THEN '⚠️ Gedeeltelijk'
    ELSE '❌ Geen'
  END as "Status"
FROM profiles p
LEFT JOIN user_availability ua ON ua.user_id = p.id
WHERE p.role = 'Installateur'
GROUP BY p.id, p.full_name, p.email
ORDER BY p.full_name;

-- Show detailed availability per monteur
SELECT 
  p.full_name as "Monteur",
  CASE ua.day_of_week
    WHEN 1 THEN 'Maandag'
    WHEN 2 THEN 'Dinsdag'
    WHEN 3 THEN 'Woensdag'
    WHEN 4 THEN 'Donderdag'
    WHEN 5 THEN 'Vrijdag'
    WHEN 6 THEN 'Zaterdag'
    WHEN 0 THEN 'Zondag'
  END as "Dag",
  ua.start_time as "Start",
  ua.end_time as "Eind",
  ua.break_start_time as "Pauze Start",
  ua.break_end_time as "Pauze Eind",
  CASE WHEN ua.is_available THEN '✅ Ja' ELSE '❌ Nee' END as "Beschikbaar"
FROM profiles p
INNER JOIN user_availability ua ON ua.user_id = p.id
WHERE p.role = 'Installateur'
ORDER BY p.full_name, ua.day_of_week;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 MIGRATION COMPLEET!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alle monteurs hebben nu standaard beschikbaarheid:';
  RAISE NOTICE '📅 Maandag t/m Vrijdag';
  RAISE NOTICE '⏰ 07:00 - 17:00';
  RAISE NOTICE '☕ Pauze: 12:00 - 13:00';
  RAISE NOTICE '';
  RAISE NOTICE 'Je kunt dit aanpassen via:';
  RAISE NOTICE 'Dashboard → Gebruikers → [Monteur] → Beschikbaarheid';
END $$;

