CREATE TABLE public.members (
  id integer PRIMARY KEY,
  name text NOT NULL,
  birth_month integer,
  birth_day integer,
  address text NOT NULL DEFAULT '',
  spouse text NOT NULL DEFAULT '',
  habits text NOT NULL DEFAULT '',
  profession text NOT NULL DEFAULT '',
  current_position text NOT NULL DEFAULT '',
  family text NOT NULL DEFAULT '',
  awards text NOT NULL DEFAULT '',
  social_media text NOT NULL DEFAULT '',
  photo_url text NOT NULL DEFAULT '',
  certificates jsonb NOT NULL DEFAULT '[]'::jsonb,
  profile_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view batch members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Anyone can add batch members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can edit batch members" ON public.members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can remove batch members" ON public.members FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();