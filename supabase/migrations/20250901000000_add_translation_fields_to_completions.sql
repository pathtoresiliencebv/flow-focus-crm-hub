-- Add translation fields to project_completions table
-- These store the original text when installer writes in their own language

ALTER TABLE project_completions
ADD COLUMN IF NOT EXISTS original_work_performed TEXT,
ADD COLUMN IF NOT EXISTS original_materials_used TEXT,
ADD COLUMN IF NOT EXISTS original_recommendations TEXT,
ADD COLUMN IF NOT EXISTS original_notes TEXT,
ADD COLUMN IF NOT EXISTS installer_language VARCHAR(10) DEFAULT 'nl';

-- Add index for language filtering
CREATE INDEX IF NOT EXISTS idx_project_completions_installer_language 
ON project_completions(installer_language);

-- Comment explaining the columns
COMMENT ON COLUMN project_completions.original_work_performed IS 'Original text in installer''s language before translation to Dutch';
COMMENT ON COLUMN project_completions.original_materials_used IS 'Original materials description in installer''s language';
COMMENT ON COLUMN project_completions.original_recommendations IS 'Original recommendations in installer''s language';
COMMENT ON COLUMN project_completions.original_notes IS 'Original notes in installer''s language';
COMMENT ON COLUMN project_completions.installer_language IS 'ISO 639-1 language code of the installer who completed the project';

-- Example data showing the translation flow:
-- Installer (Polish) writes: "Zainstalowano nowe okna PCV"
-- System saves:
--   - work_performed: "Nieuwe PVC ramen geïnstalleerd" (translated to Dutch)
--   - original_work_performed: "Zainstalowano nowe okna PCV" (original Polish)
--   - installer_language: "pl"

-- This allows:
-- 1. Admins see Dutch version for consistency
-- 2. Original text is preserved for reference
-- 3. Can detect which language installer used

