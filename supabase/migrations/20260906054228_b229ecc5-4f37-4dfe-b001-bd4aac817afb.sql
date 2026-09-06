
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE IF NOT EXISTS public.market_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  category text,
  region text NOT NULL DEFAULT 'bangladesh',
  product_name text,
  price_direction text NOT NULL DEFAULT 'unknown',
  source_name text,
  source_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.market_insights TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.market_insights TO authenticated;
GRANT ALL ON public.market_insights TO service_role;

ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_insights_read" ON public.market_insights;
CREATE POLICY "market_insights_read" ON public.market_insights
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "market_insights_admin_write" ON public.market_insights;
CREATE POLICY "market_insights_admin_write" ON public.market_insights
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS affiliate_code text;
