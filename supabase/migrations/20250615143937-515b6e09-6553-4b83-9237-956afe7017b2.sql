
-- Create enum for customer status
CREATE TYPE public.customer_status AS ENUM (
    'Actief',
    'In behandeling',
    'Inactief'
);

-- Create customers table
CREATE TABLE public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    notes TEXT,
    status public.customer_status DEFAULT 'Actief',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id)
);

-- Add Row Level Security (RLS) to customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policies for customers table
CREATE POLICY "Allow authenticated users to view customers"
ON public.customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete customers"
ON public.customers FOR DELETE
TO authenticated
USING (true);

-- Create enum for project status
CREATE TYPE public.project_status AS ENUM (
    'te-plannen',
    'gepland',
    'in-uitvoering',
    'herkeuring',
    'afgerond'
);

-- Create projects table
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    date DATE,
    value NUMERIC,
    status public.project_status DEFAULT 'te-plannen',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id)
);

-- Add Row Level Security (RLS) to projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policies for projects table
CREATE POLICY "Allow authenticated users to view projects"
ON public.projects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (true);
