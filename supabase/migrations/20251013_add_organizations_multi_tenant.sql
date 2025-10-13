-- =====================================================
-- MULTI-TENANT ORGANIZATION SYSTEM
-- Purpose: Allow multiple users to share same company/organization
-- Fix: Resolves loading issues when multiple users from same company log in
-- Created: 2025-10-13
-- =====================================================

-- ========================================
-- 1. CREATE ORGANIZATIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  
  -- Company details (migrated from company_settings)
  company_name TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Nederland',
  kvk_number TEXT,
  btw_number TEXT,
  
  -- Settings
  general_terms TEXT,
  default_attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Subscription/plan info
  plan_type TEXT DEFAULT 'basic', -- 'basic', 'pro', 'enterprise'
  max_users INTEGER DEFAULT 10,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_kvk ON public.organizations(kvk_number) WHERE kvk_number IS NOT NULL;

-- Comments
COMMENT ON TABLE public.organizations IS 'Organizations/bedrijven - meerdere users kunnen tot dezelfde organisatie behoren';
COMMENT ON COLUMN public.organizations.plan_type IS 'Subscription plan type';
COMMENT ON COLUMN public.organizations.max_users IS 'Maximum aantal users voor deze organisatie';

-- ========================================
-- 2. ADD ORGANIZATION_ID TO PROFILES
-- ========================================

-- Add organization_id column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- Comment
COMMENT ON COLUMN public.profiles.organization_id IS 'Link naar organisatie - users binnen zelfde org delen data';

-- ========================================
-- 3. UPDATE COMPANY_SETTINGS WITH ORGANIZATION_ID
-- ========================================

-- Add organization_id to company_settings (for backwards compatibility)
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Index
CREATE INDEX IF NOT EXISTS idx_company_settings_organization_id ON public.company_settings(organization_id);

-- ========================================
-- 4. MIGRATE EXISTING DATA TO ORGANIZATIONS
-- ========================================

-- Create organizations from existing company_settings
INSERT INTO public.organizations (id, company_name, address, postal_code, city, country, kvk_number, btw_number, general_terms, default_attachments, created_at)
SELECT 
  gen_random_uuid(),
  COALESCE(company_name, 'Bedrijf ' || user_id::text),
  address,
  postal_code,
  city,
  country,
  kvk_number,
  btw_number,
  general_terms,
  default_attachments,
  created_at
FROM public.company_settings
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE company_settings.kvk_number = organizations.kvk_number AND company_settings.kvk_number IS NOT NULL)
ON CONFLICT DO NOTHING;

-- Link profiles to their organization based on company_settings
UPDATE public.profiles p
SET organization_id = (
  SELECT o.id
  FROM public.company_settings cs
  JOIN public.organizations o ON (
    -- Match on KVK number if available
    (cs.kvk_number IS NOT NULL AND o.kvk_number = cs.kvk_number)
    OR
    -- Otherwise match on company name
    (cs.kvk_number IS NULL AND o.company_name = cs.company_name)
  )
  WHERE cs.user_id = p.id
  LIMIT 1
)
WHERE p.organization_id IS NULL;

-- Update company_settings with organization_id
UPDATE public.company_settings cs
SET organization_id = (
  SELECT o.id
  FROM public.organizations o
  WHERE (
    (cs.kvk_number IS NOT NULL AND o.kvk_number = cs.kvk_number)
    OR
    (cs.kvk_number IS NULL AND o.company_name = cs.company_name)
  )
  LIMIT 1
);

-- Create organization for profiles without one (admins who haven't set up company_settings yet)
DO $$
DECLARE
  profile_record RECORD;
  new_org_id UUID;
BEGIN
  FOR profile_record IN 
    SELECT id, full_name, role
    FROM public.profiles 
    WHERE organization_id IS NULL AND role = 'Administrator'
  LOOP
    -- Create a new organization for this admin
    INSERT INTO public.organizations (name, company_name, created_at)
    VALUES (
      COALESCE(profile_record.full_name || '''s Organisatie', 'Nieuwe Organisatie'),
      COALESCE(profile_record.full_name || '''s Bedrijf', 'Nieuw Bedrijf'),
      NOW()
    )
    RETURNING id INTO new_org_id;
    
    -- Link profile to new organization
    UPDATE public.profiles
    SET organization_id = new_org_id
    WHERE id = profile_record.id;
    
    RAISE NOTICE 'Created organization % for admin %', new_org_id, profile_record.id;
  END LOOP;
END $$;

-- ========================================
-- 5. RLS POLICIES FOR ORGANIZATIONS
-- ========================================

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Users can view their own organization
CREATE POLICY "Users can view their organization"
ON public.organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Only admins can update their organization
CREATE POLICY "Admins can update their organization"
ON public.organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Administrator'
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Administrator'
  )
);

-- Only admins can insert organizations
CREATE POLICY "Admins can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- 6. UPDATE COMPANY_SETTINGS RLS POLICIES
-- ========================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can manage their own company settings" ON public.company_settings;

-- Create new organization-based policies
CREATE POLICY "Users can view organization company settings"
ON public.company_settings FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
  OR user_id = auth.uid() -- Backwards compatibility
);

CREATE POLICY "Admins can manage organization company settings"
ON public.company_settings FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Administrator'
  )
  OR (user_id = auth.uid() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrator')
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Administrator'
  )
  OR (user_id = auth.uid() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Administrator')
);

-- ========================================
-- 7. HELPER FUNCTIONS
-- ========================================

-- Function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id_param UUID)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = user_id_param;
$$;

-- Function to check if users are in same organization
CREATE OR REPLACE FUNCTION public.same_organization(user_id_1 UUID, user_id_2 UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT 
    (SELECT organization_id FROM public.profiles WHERE id = user_id_1) = 
    (SELECT organization_id FROM public.profiles WHERE id = user_id_2)
  AND
    (SELECT organization_id FROM public.profiles WHERE id = user_id_1) IS NOT NULL;
$$;

-- ========================================
-- 8. UPDATE TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION public.update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_organizations_updated_at();

-- ========================================
-- 9. GRANT PERMISSIONS
-- ========================================

GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-tenant organization system installed successfully!';
  RAISE NOTICE '📊 Organizations created: %', (SELECT COUNT(*) FROM public.organizations);
  RAISE NOTICE '👥 Profiles linked: %', (SELECT COUNT(*) FROM public.profiles WHERE organization_id IS NOT NULL);
END $$;

