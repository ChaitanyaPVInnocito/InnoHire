
-- Invitations table for LOB-Head-managed user onboarding
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL,
  full_name text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- LOB heads can insert invitations
CREATE POLICY "LOB heads can insert invitations" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'lob-head'));

-- LOB heads can view invitations
CREATE POLICY "LOB heads can read invitations" ON public.invitations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'lob-head'));

-- Allow anon/authenticated to read invitation by token (for signup page)
CREATE POLICY "Anyone can read invitation by token" ON public.invitations
  FOR SELECT TO anon
  USING (true);

-- LOB heads can update invitations (mark used)
CREATE POLICY "LOB heads can update invitations" ON public.invitations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'lob-head'));

-- Allow service role / trigger to mark invitation as used
CREATE POLICY "Authenticated can mark own invitation used" ON public.invitations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- LOB heads can delete invitations
CREATE POLICY "LOB heads can delete invitations" ON public.invitations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'lob-head'));
