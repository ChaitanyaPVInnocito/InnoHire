-- Fix 1: Tighten audit_logs INSERT
DROP POLICY IF EXISTS "Authenticated insert audit_logs" ON public.audit_logs;
CREATE POLICY "Authenticated insert audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: Tighten invitations UPDATE for non-LOB users
DROP POLICY IF EXISTS "Authenticated can mark own invitation used" ON public.invitations;
CREATE POLICY "Authenticated can mark own invitation used" ON public.invitations
  FOR UPDATE TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND used = true
  );

-- Fix 3: Tighten re_initiation_requests UPDATE
DROP POLICY IF EXISTS "Authenticated update re_initiation_requests" ON public.re_initiation_requests;
CREATE POLICY "Role-based update re_initiation_requests" ON public.re_initiation_requests
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'hiring-manager'::app_role) 
    OR has_role(auth.uid(), 'lob-head'::app_role)
    OR has_role(auth.uid(), 'tag-manager'::app_role)
  );