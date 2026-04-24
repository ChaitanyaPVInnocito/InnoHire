
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('hiring-manager', 'lob-head', 'tag-manager');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (roles MUST be separate)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing table RLS to require authentication
DROP POLICY IF EXISTS "Allow public read on requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Allow public insert on requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Allow public update on requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Allow public delete on requisitions" ON public.requisitions;

CREATE POLICY "Authenticated read requisitions" ON public.requisitions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert requisitions" ON public.requisitions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update requisitions" ON public.requisitions
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete requisitions" ON public.requisitions
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read on offers" ON public.offers;
DROP POLICY IF EXISTS "Allow public insert on offers" ON public.offers;
DROP POLICY IF EXISTS "Allow public update on offers" ON public.offers;
DROP POLICY IF EXISTS "Allow public delete on offers" ON public.offers;

CREATE POLICY "Authenticated read offers" ON public.offers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert offers" ON public.offers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update offers" ON public.offers
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete offers" ON public.offers
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public insert on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny update on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny delete on audit_logs" ON public.audit_logs;

CREATE POLICY "Authenticated read audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Deny update on audit_logs" ON public.audit_logs
  FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Deny delete on audit_logs" ON public.audit_logs
  FOR DELETE TO authenticated USING (false);
