CREATE SEQUENCE IF NOT EXISTS public.profile_user_number_seq START 1;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_number bigint,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS referral_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reward_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reward_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_referral_count integer NOT NULL DEFAULT 0;

UPDATE public.profiles SET user_number = nextval('public.profile_user_number_seq') WHERE user_number IS NULL;
ALTER TABLE public.profiles ALTER COLUMN user_number SET DEFAULT nextval('public.profile_user_number_seq');
ALTER TABLE public.profiles ALTER COLUMN user_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_number_key ON public.profiles(user_number);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles(referred_by);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_referral_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_referral_status_check CHECK (referral_status IN ('none','pending','successful','rejected'));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_reward_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_reward_status_check CHECK (reward_status IN ('none','pending','rewarded','rejected'));

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE OR REPLACE FUNCTION public.make_partner_code(_prefix text, _name text, _number bigint)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public, extensions AS $$
  SELECT upper(_prefix || '-' || coalesce(nullif(regexp_replace(extensions.unaccent(coalesce(_name, 'USER')), '[^a-zA-Z0-9]+', '', 'g'), ''), 'USER') || _number::text)
$$;

UPDATE public.profiles SET referral_code = public.make_partner_code('RSTM', full_name, user_number) WHERE referral_code IS NULL;
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','successful','rejected')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid')),
  reward_status text NOT NULL DEFAULT 'pending' CHECK (reward_status IN ('pending','approved','rejected')),
  referrer_reward_days integer NOT NULL DEFAULT 0,
  referred_reward_days integer NOT NULL DEFAULT 0,
  subscription_id uuid,
  registered_at timestamptz NOT NULL DEFAULT now(),
  subscribed_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_not_self CHECK (referrer_id <> referred_user_id)
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY referrals_participant_select ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY referrals_admin_update ON public.referrals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_id, status);

ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS affiliate_code text,
  ADD COLUMN IF NOT EXISTS affiliate_click_id uuid;
CREATE INDEX IF NOT EXISTS subscription_requests_user_idx ON public.subscription_requests(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_requests_transaction_unique ON public.subscription_requests(payment_method, transaction_id);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS source_request_id uuid,
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bonus_days integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_source_request_unique ON public.subscriptions(source_request_id) WHERE source_request_id IS NOT NULL;

CREATE TABLE public.affiliate_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 120),
  business_name text,
  email text NOT NULL CHECK (length(email) <= 255),
  phone text NOT NULL CHECK (length(phone) BETWEEN 5 AND 30),
  country text NOT NULL CHECK (length(country) BETWEEN 2 AND 80),
  city text NOT NULL CHECK (length(city) BETWEEN 1 AND 100),
  website text,
  social_link text,
  experience text CHECK (experience IS NULL OR length(experience) <= 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  affiliate_code text UNIQUE,
  monthly_rate numeric(5,2) NOT NULL DEFAULT 10,
  quarterly_rate numeric(5,2) NOT NULL DEFAULT 12,
  biannual_rate numeric(5,2) NOT NULL DEFAULT 15,
  total_clicks integer NOT NULL DEFAULT 0,
  total_signups integer NOT NULL DEFAULT 0,
  total_sales integer NOT NULL DEFAULT 0,
  pending_commission numeric(12,2) NOT NULL DEFAULT 0,
  paid_commission numeric(12,2) NOT NULL DEFAULT 0,
  lifetime_earnings numeric(12,2) NOT NULL DEFAULT 0,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.affiliate_applications TO authenticated;
GRANT ALL ON public.affiliate_applications TO service_role;
ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY affiliate_application_self_select ON public.affiliate_applications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY affiliate_application_self_insert ON public.affiliate_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending' AND affiliate_code IS NULL);
CREATE POLICY affiliate_application_admin_update ON public.affiliate_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_applications(id) ON DELETE CASCADE,
  visitor_token_hash text NOT NULL,
  landing_path text NOT NULL DEFAULT '/',
  user_agent_hash text,
  ip_hash text,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  signed_up_user_id uuid,
  converted_at timestamptz
);
GRANT INSERT ON public.affiliate_clicks TO anon, authenticated;
GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT ALL ON public.affiliate_clicks TO service_role;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY affiliate_click_owner_select ON public.affiliate_clicks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.affiliate_applications a WHERE a.id = affiliate_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE INDEX affiliate_clicks_affiliate_idx ON public.affiliate_clicks(affiliate_id, clicked_at);
CREATE UNIQUE INDEX affiliate_click_dedupe_idx ON public.affiliate_clicks(affiliate_id, visitor_token_hash, ((clicked_at AT TIME ZONE 'UTC')::date));

CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_applications(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  payment_request_id uuid NOT NULL REFERENCES public.subscription_requests(id) ON DELETE CASCADE,
  plan text NOT NULL,
  payment_amount numeric(12,2) NOT NULL,
  rate numeric(5,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  UNIQUE(payment_request_id)
);
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT ALL ON public.affiliate_commissions TO service_role;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY affiliate_commission_owner_select ON public.affiliate_commissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.affiliate_applications a WHERE a.id = affiliate_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY affiliate_commission_admin_update ON public.affiliate_commissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.affiliate_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_applications(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('bank','bkash','nagad','sslcommerz','stripe','paypal','usdt')),
  account_details text NOT NULL CHECK (length(account_details) BETWEEN 3 AND 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
GRANT SELECT, INSERT, UPDATE ON public.affiliate_withdrawals TO authenticated;
GRANT ALL ON public.affiliate_withdrawals TO service_role;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY affiliate_withdrawal_owner_select ON public.affiliate_withdrawals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.affiliate_applications a WHERE a.id = affiliate_id AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY affiliate_withdrawal_owner_insert ON public.affiliate_withdrawals FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.affiliate_applications a WHERE a.id = affiliate_id AND a.user_id = auth.uid() AND a.status = 'approved'));
CREATE POLICY affiliate_withdrawal_admin_update ON public.affiliate_withdrawals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.affiliate_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  minimum_withdrawal numeric(12,2) NOT NULL DEFAULT 50 CHECK (minimum_withdrawal > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.affiliate_settings TO authenticated;
GRANT ALL ON public.affiliate_settings TO service_role;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY affiliate_settings_read ON public.affiliate_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY affiliate_settings_admin_all ON public.affiliate_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.affiliate_settings(id, minimum_withdrawal) VALUES (true, 50) ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name text NOT NULL,
  position text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  cv_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','interview','hired','rejected')),
  interview_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.career_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.career_applications TO authenticated;
GRANT ALL ON public.career_applications TO service_role;
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY career_apply_public ON public.career_applications FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND length(applicant_name) BETWEEN 1 AND 120 AND length(phone) BETWEEN 5 AND 30 AND length(email) <= 255);
CREATE POLICY career_admin_select ON public.career_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY career_admin_update ON public.career_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER referrals_touch BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER affiliate_applications_touch BEFORE UPDATE ON public.affiliate_applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER career_applications_touch BEFORE UPDATE ON public.career_applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.set_affiliate_code() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE p public.profiles%ROWTYPE;
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' AND NEW.affiliate_code IS NULL THEN
    SELECT * INTO p FROM public.profiles WHERE id = NEW.user_id;
    NEW.affiliate_code := public.make_partner_code('RSTA', p.full_name, p.user_number);
    NEW.reviewed_at := now(); NEW.reviewed_by := auth.uid();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER affiliate_code_on_approval BEFORE UPDATE ON public.affiliate_applications FOR EACH ROW EXECUTE FUNCTION public.set_affiliate_code();

CREATE OR REPLACE FUNCTION public.validate_referral_code(_code text)
RETURNS TABLE(valid boolean, referrer_id uuid, referrer_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT true, p.id, p.full_name FROM public.profiles p WHERE p.referral_code = upper(btrim(_code)) LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.attach_referral(_user_id uuid, _code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rid uuid;
BEGIN
  IF auth.uid() IS DISTINCT FROM _user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT id INTO rid FROM public.profiles WHERE referral_code = upper(btrim(_code));
  IF rid IS NULL THEN RAISE EXCEPTION 'Invalid referral code'; END IF;
  IF rid = _user_id THEN RAISE EXCEPTION 'Self referral is not allowed'; END IF;
  INSERT INTO public.referrals(referrer_id, referred_user_id, referral_code) VALUES (rid, _user_id, upper(btrim(_code))) ON CONFLICT (referred_user_id) DO NOTHING;
  UPDATE public.profiles SET referred_by = rid, referral_status = 'pending', reward_status = 'pending' WHERE id = _user_id AND referred_by IS NULL;
END $$;
GRANT EXECUTE ON FUNCTION public.attach_referral(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.track_affiliate_click(_code text, _visitor_hash text, _landing_path text, _user_agent_hash text DEFAULT NULL, _ip_hash text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE aid uuid; click_id uuid;
BEGIN
  SELECT id INTO aid FROM public.affiliate_applications WHERE affiliate_code = upper(btrim(_code)) AND status = 'approved';
  IF aid IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.affiliate_clicks(affiliate_id, visitor_token_hash, landing_path, user_agent_hash, ip_hash)
  VALUES (aid, _visitor_hash, left(coalesce(_landing_path,'/'),500), _user_agent_hash, _ip_hash)
  ON CONFLICT DO NOTHING RETURNING id INTO click_id;
  IF click_id IS NOT NULL THEN UPDATE public.affiliate_applications SET total_clicks = total_clicks + 1 WHERE id = aid; END IF;
  RETURN click_id;
END $$;
GRANT EXECUTE ON FUNCTION public.track_affiliate_click(text,text,text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.approve_subscription_request(_request_id uuid, _plan public.plan_type)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE req public.subscription_requests%ROWTYPE; uid uuid; sid uuid; months integer; base_expiry timestamptz; ref public.referrals%ROWTYPE; aff public.affiliate_applications%ROWTYPE; rate numeric; commission numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO req FROM public.subscription_requests WHERE id = _request_id FOR UPDATE;
  IF req.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF req.status <> 'pending' THEN RAISE EXCEPTION 'Request already processed'; END IF;
  SELECT id INTO uid FROM public.profiles WHERE lower(email) = lower(req.email);
  IF uid IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  months := CASE _plan WHEN 'monthly' THEN 1 WHEN 'quarterly' THEN 3 WHEN 'biannual' THEN 6 ELSE NULL END;
  UPDATE public.subscriptions SET status = 'cancelled' WHERE user_id = uid AND status = 'active';
  base_expiry := CASE WHEN months IS NULL THEN NULL ELSE now() + make_interval(months => months) END;
  SELECT * INTO ref FROM public.referrals WHERE referred_user_id = uid FOR UPDATE;
  IF ref.id IS NOT NULL AND ref.status = 'pending' THEN base_expiry := base_expiry + interval '15 days'; END IF;
  INSERT INTO public.subscriptions(user_id, plan, status, expires_at, source_request_id, is_paid, bonus_days)
  VALUES (uid, _plan, 'active', base_expiry, req.id, true, CASE WHEN ref.id IS NOT NULL AND ref.status='pending' THEN 15 ELSE 0 END) RETURNING id INTO sid;
  UPDATE public.subscription_requests SET status = 'approved', user_id = uid WHERE id = req.id;
  IF ref.id IS NOT NULL AND ref.status = 'pending' THEN
    UPDATE public.referrals SET status='successful', payment_status='paid', reward_status='approved', referrer_reward_days=30, referred_reward_days=15, subscription_id=sid, subscribed_at=now(), reviewed_at=now(), reviewed_by=auth.uid() WHERE id=ref.id;
    UPDATE public.profiles SET referral_status='successful', reward_status='rewarded', reward_months=reward_months+1, successful_referral_count=successful_referral_count+1 WHERE id=ref.referrer_id;
    UPDATE public.profiles SET referral_status='successful', reward_status='rewarded' WHERE id=uid;
    UPDATE public.subscriptions SET expires_at = coalesce(expires_at, now()) + interval '30 days' WHERE id = (SELECT id FROM public.subscriptions WHERE user_id=ref.referrer_id AND status='active' ORDER BY created_at DESC LIMIT 1);
  END IF;
  IF req.affiliate_code IS NOT NULL THEN
    SELECT * INTO aff FROM public.affiliate_applications WHERE affiliate_code=upper(req.affiliate_code) AND status='approved' FOR UPDATE;
    IF aff.id IS NOT NULL AND aff.user_id <> uid THEN
      rate := CASE _plan WHEN 'monthly' THEN aff.monthly_rate WHEN 'quarterly' THEN aff.quarterly_rate WHEN 'biannual' THEN aff.biannual_rate ELSE 0 END;
      commission := CASE _plan WHEN 'monthly' THEN 20 WHEN 'quarterly' THEN 95 WHEN 'biannual' THEN 180 ELSE round(req.amount*rate/100,2) END;
      INSERT INTO public.affiliate_commissions(affiliate_id,customer_id,subscription_id,payment_request_id,plan,payment_amount,rate,commission_amount) VALUES(aff.id,uid,sid,req.id,_plan::text,req.amount,rate,commission) ON CONFLICT(payment_request_id) DO NOTHING;
      UPDATE public.affiliate_applications SET total_sales=total_sales+1,pending_commission=pending_commission+commission,lifetime_earnings=lifetime_earnings+commission WHERE id=aff.id;
    END IF;
  END IF;
  RETURN sid;
END $$;
GRANT EXECUTE ON FUNCTION public.approve_subscription_request(uuid,public.plan_type) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE n bigint; code text;
BEGIN
  n := nextval('public.profile_user_number_seq');
  code := public.make_partner_code('RSTM', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), n);
  INSERT INTO public.profiles(id,email,full_name,avatar_url,user_number,referral_code)
  VALUES(NEW.id,NEW.email,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name',split_part(NEW.email,'@',1)),NEW.raw_user_meta_data->>'avatar_url',n,code)
  ON CONFLICT(id) DO NOTHING;
  IF NEW.email='muttakiadnansami@gmail.com' THEN
    INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.subscriptions(user_id,plan,status,expires_at,is_paid) VALUES(NEW.id,'lifetime','active',NULL,false) ON CONFLICT DO NOTHING;
  ELSE INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'user') ON CONFLICT DO NOTHING; END IF;
  RETURN NEW;
END $$;