-- Extend ngo_details
ALTER TABLE public.ngo_details
  ADD COLUMN IF NOT EXISTS est_year integer,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS areas_of_work text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS regions_served text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS volunteer_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_resources text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_contact text,
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;

-- Extend volunteer_details
ALTER TABLE public.volunteer_details
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS experience text,
  ADD COLUMN IF NOT EXISTS certifications text,
  ADD COLUMN IF NOT EXISTS invite_code_used text;

-- Invite codes table
CREATE TABLE IF NOT EXISTS public.ngo_invite_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ngo_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ngo_invite_codes_ngo ON public.ngo_invite_codes(ngo_id);
CREATE INDEX IF NOT EXISTS idx_ngo_invite_codes_code ON public.ngo_invite_codes(code);

ALTER TABLE public.ngo_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_codes select active or owner or admin"
  ON public.ngo_invite_codes
  FOR SELECT
  TO authenticated
  USING (active = true OR ngo_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "invite_codes insert ngo or admin"
  ON public.ngo_invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (ngo_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "invite_codes update ngo or admin"
  ON public.ngo_invite_codes
  FOR UPDATE
  TO authenticated
  USING (ngo_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "invite_codes delete ngo or admin"
  ON public.ngo_invite_codes
  FOR DELETE
  TO authenticated
  USING (ngo_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_ngo_invite_codes_updated_at
  BEFORE UPDATE ON public.ngo_invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();