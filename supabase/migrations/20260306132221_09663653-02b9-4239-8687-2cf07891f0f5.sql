
-- Project codes table (managed by LOB heads)
CREATE TABLE public.project_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_codes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read project codes
CREATE POLICY "Authenticated read project_codes" ON public.project_codes
  FOR SELECT TO authenticated USING (true);

-- Only LOB heads can manage project codes
CREATE POLICY "LOB heads insert project_codes" ON public.project_codes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'lob-head'));

CREATE POLICY "LOB heads update project_codes" ON public.project_codes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'lob-head'));

CREATE POLICY "LOB heads delete project_codes" ON public.project_codes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'lob-head'));

-- Seed default project codes
INSERT INTO public.project_codes (code) VALUES ('EEN'), ('Apex'), ('PRMG'), ('Weva'), ('Joulez');

-- Re-initiation requests table
CREATE TABLE public.re_initiation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id text NOT NULL,
  role text NOT NULL,
  project text NOT NULL,
  original_candidate_name text NOT NULL,
  backed_out_reason text NOT NULL,
  requested_by text NOT NULL,
  requested_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending-hm',
  hm_approval jsonb,
  lob_approval jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.re_initiation_requests ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read re-initiation requests
CREATE POLICY "Authenticated read re_initiation_requests" ON public.re_initiation_requests
  FOR SELECT TO authenticated USING (true);

-- TAG and hiring managers can insert
CREATE POLICY "TAG and HM insert re_initiation_requests" ON public.re_initiation_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'tag-manager')
    OR public.has_role(auth.uid(), 'hiring-manager')
  );

-- All authenticated can update (for approval workflow)
CREATE POLICY "Authenticated update re_initiation_requests" ON public.re_initiation_requests
  FOR UPDATE TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_re_initiation_requests_updated_at
  BEFORE UPDATE ON public.re_initiation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
