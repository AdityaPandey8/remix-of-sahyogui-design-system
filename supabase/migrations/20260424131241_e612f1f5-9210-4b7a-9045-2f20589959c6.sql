
-- Add blocked column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

-- ngo_details
CREATE TABLE IF NOT EXISTS public.ngo_details (
  id uuid PRIMARY KEY,
  ngo_name text NOT NULL,
  registration_number text NOT NULL,
  darpan_id text,
  pan_tax_id text NOT NULL DEFAULT '',
  ngo_type text DEFAULT 'Trust',
  document_url text,
  video_url text,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ngo_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ngo_details select authenticated" ON public.ngo_details
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ngo_details insert self" ON public.ngo_details
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ngo_details update self or admin" ON public.ngo_details
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ngo_details delete admin" ON public.ngo_details
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ngo_details_set_updated_at
  BEFORE UPDATE ON public.ngo_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- volunteer_details
CREATE TABLE IF NOT EXISTS public.volunteer_details (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  type text NOT NULL DEFAULT 'basic',
  verification_status text NOT NULL DEFAULT 'pending',
  trust_score numeric NOT NULL DEFAULT 0,
  reliability_score numeric NOT NULL DEFAULT 0,
  tasks_completed int NOT NULL DEFAULT 0,
  availability boolean NOT NULL DEFAULT true,
  blocked boolean NOT NULL DEFAULT false,
  location_text text,
  latitude numeric,
  longitude numeric,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.volunteer_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "volunteer_details select authenticated" ON public.volunteer_details
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "volunteer_details insert self" ON public.volunteer_details
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "volunteer_details update self or admin" ON public.volunteer_details
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "volunteer_details delete admin" ON public.volunteer_details
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER volunteer_details_set_updated_at
  BEFORE UPDATE ON public.volunteer_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ngo_volunteer_relations
CREATE TABLE IF NOT EXISTS public.ngo_volunteer_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id uuid NOT NULL,
  volunteer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ngo_id, volunteer_id)
);
ALTER TABLE public.ngo_volunteer_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nvr select authenticated" ON public.ngo_volunteer_relations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "nvr insert ngo or admin" ON public.ngo_volunteer_relations
  FOR INSERT TO authenticated
  WITH CHECK (ngo_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "nvr delete ngo or admin" ON public.ngo_volunteer_relations
  FOR DELETE TO authenticated
  USING (ngo_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- volunteer_join_requests
CREATE TABLE IF NOT EXISTS public.volunteer_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL,
  ngo_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.volunteer_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vjr select related" ON public.volunteer_join_requests
  FOR SELECT TO authenticated
  USING (volunteer_id = auth.uid() OR ngo_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "vjr insert volunteer" ON public.volunteer_join_requests
  FOR INSERT TO authenticated
  WITH CHECK (volunteer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "vjr update ngo or admin" ON public.volunteer_join_requests
  FOR UPDATE TO authenticated
  USING (ngo_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "vjr delete admin" ON public.volunteer_join_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER vjr_set_updated_at
  BEFORE UPDATE ON public.volunteer_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Allow admins to update profiles (for block/unblock)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
