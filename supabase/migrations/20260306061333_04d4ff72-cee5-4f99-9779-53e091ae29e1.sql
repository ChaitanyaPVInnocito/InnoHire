
-- REQUISITIONS TABLE
CREATE TABLE public.requisitions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  project TEXT NOT NULL,
  manager TEXT NOT NULL,
  lob TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Junior', 'Mid', 'Senior', 'Lead')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'approved', 'rejected', 'interview', 'hold', 'offer',
    're-initiation-requested', 're-initiation-rejected', 'open'
  )),
  salary TEXT,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  interview_state JSONB,
  candidates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on requisitions" ON public.requisitions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on requisitions" ON public.requisitions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on requisitions" ON public.requisitions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on requisitions" ON public.requisitions FOR DELETE USING (true);

-- OFFERS TABLE
CREATE TABLE public.offers (
  id TEXT PRIMARY KEY,
  requisition_id TEXT NOT NULL REFERENCES public.requisitions(id),
  candidate_name TEXT NOT NULL,
  role TEXT NOT NULL,
  project TEXT NOT NULL,
  proposed_salary TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending-approval' CHECK (status IN (
    'pending-approval', 'approved', 'rejected', 'offer-sent', 'accepted',
    'declined', 'no-show', 'backed-out', 'joining-date-revised', 'joined'
  )),
  joining_date DATE,
  joined_date DATE,
  joining_date_history JSONB DEFAULT '[]'::jsonb,
  backed_out_reason TEXT,
  backed_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on offers" ON public.offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on offers" ON public.offers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on offers" ON public.offers FOR DELETE USING (true);

-- AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
  id TEXT PRIMARY KEY,
  requisition_id TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by_role TEXT NOT NULL,
  changed_by_name TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'submitted', 'approved', 'rejected', 'updated', 'status_changed',
    'interview_updated', 'routed_to_offer', 'joining_date_pushed', 'marked_no_show',
    'marked_backed_out', 're_initiation_requested', 're_initiation_approved',
    're_initiation_rejected', 'requisition_reopened'
  )),
  metadata JSONB
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Deny update on audit_logs" ON public.audit_logs FOR UPDATE USING (false);
CREATE POLICY "Deny delete on audit_logs" ON public.audit_logs FOR DELETE USING (false);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_requisitions_updated_at BEFORE UPDATE ON public.requisitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- INDEXES
CREATE INDEX idx_requisitions_status ON public.requisitions(status);
CREATE INDEX idx_requisitions_project ON public.requisitions(project);
CREATE INDEX idx_offers_requisition_id ON public.offers(requisition_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_audit_logs_requisition_id ON public.audit_logs(requisition_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
