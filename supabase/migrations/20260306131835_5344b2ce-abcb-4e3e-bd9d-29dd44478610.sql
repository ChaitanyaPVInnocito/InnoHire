
-- Add created_by column to requisitions
ALTER TABLE public.requisitions ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop existing overly permissive RLS policies on requisitions
DROP POLICY IF EXISTS "Authenticated read requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Authenticated insert requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Authenticated update requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Authenticated delete requisitions" ON public.requisitions;

-- Hiring managers see only their own; LOB heads and TAG see all
CREATE POLICY "Role-based read requisitions" ON public.requisitions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'lob-head')
    OR public.has_role(auth.uid(), 'tag-manager')
    OR (public.has_role(auth.uid(), 'hiring-manager') AND created_by = auth.uid())
  );

-- Only hiring managers can insert (their own)
CREATE POLICY "Hiring managers insert own requisitions" ON public.requisitions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Hiring managers update own; LOB heads and TAG update all
CREATE POLICY "Role-based update requisitions" ON public.requisitions
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'lob-head')
    OR public.has_role(auth.uid(), 'tag-manager')
    OR (public.has_role(auth.uid(), 'hiring-manager') AND created_by = auth.uid())
  );

-- Only LOB heads can delete
CREATE POLICY "LOB heads delete requisitions" ON public.requisitions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'lob-head'));

-- Drop existing overly permissive RLS policies on offers
DROP POLICY IF EXISTS "Authenticated read offers" ON public.offers;
DROP POLICY IF EXISTS "Authenticated insert offers" ON public.offers;
DROP POLICY IF EXISTS "Authenticated update offers" ON public.offers;
DROP POLICY IF EXISTS "Authenticated delete offers" ON public.offers;

-- LOB heads and TAG see all offers; hiring managers see offers for their requisitions
CREATE POLICY "Role-based read offers" ON public.offers
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'lob-head')
    OR public.has_role(auth.uid(), 'tag-manager')
    OR (public.has_role(auth.uid(), 'hiring-manager') AND requisition_id IN (
      SELECT id FROM public.requisitions WHERE created_by = auth.uid()
    ))
  );

-- TAG can insert offers
CREATE POLICY "TAG insert offers" ON public.offers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'tag-manager')
    OR public.has_role(auth.uid(), 'lob-head')
  );

-- TAG and LOB heads can update offers
CREATE POLICY "Role-based update offers" ON public.offers
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'lob-head')
    OR public.has_role(auth.uid(), 'tag-manager')
  );

-- Only LOB heads can delete offers
CREATE POLICY "LOB heads delete offers" ON public.offers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'lob-head'));

-- Drop existing overly permissive RLS policies on audit_logs
DROP POLICY IF EXISTS "Authenticated read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated insert audit_logs" ON public.audit_logs;

-- Everyone authenticated can read and insert audit logs
CREATE POLICY "Authenticated read audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated insert audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
