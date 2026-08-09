CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  n bigint;
  code text;
  supplied_referral text;
  referrer_id uuid;
BEGIN
  n := nextval('public.profile_user_number_seq');
  code := public.make_partner_code(
    'RSTM',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    n
  );

  INSERT INTO public.profiles(id,email,full_name,avatar_url,user_number,referral_code)
  VALUES(
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name',split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    n,
    code
  )
  ON CONFLICT(id) DO NOTHING;

  IF NEW.email='muttakiadnansami@gmail.com' THEN
    INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.subscriptions(user_id,plan,status,expires_at,is_paid)
    VALUES(NEW.id,'lifetime','active',NULL,false) ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'user') ON CONFLICT DO NOTHING;
  END IF;

  supplied_referral := upper(btrim(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  IF supplied_referral <> '' THEN
    SELECT id INTO referrer_id
    FROM public.profiles
    WHERE referral_code = supplied_referral
    LIMIT 1;

    IF referrer_id IS NULL THEN
      RAISE EXCEPTION 'Invalid referral code';
    END IF;
    IF referrer_id = NEW.id THEN
      RAISE EXCEPTION 'Self referral is not allowed';
    END IF;

    INSERT INTO public.referrals(referrer_id, referred_user_id, referral_code)
    VALUES(referrer_id, NEW.id, supplied_referral)
    ON CONFLICT (referred_user_id) DO NOTHING;

    UPDATE public.profiles
    SET referred_by = referrer_id,
        referral_status = 'pending',
        reward_status = 'pending'
    WHERE id = NEW.id AND referred_by IS NULL;
  END IF;

  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.claim_affiliate_click(_click_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  click_row public.affiliate_clicks%ROWTYPE;
  affiliate_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO click_row
  FROM public.affiliate_clicks
  WHERE id = _click_id
  FOR UPDATE;

  IF click_row.id IS NULL OR click_row.expires_at <= now() THEN
    RETURN false;
  END IF;

  SELECT user_id INTO affiliate_owner
  FROM public.affiliate_applications
  WHERE id = click_row.affiliate_id AND status = 'approved';

  IF affiliate_owner IS NULL OR affiliate_owner = auth.uid() THEN
    RETURN false;
  END IF;

  IF click_row.signed_up_user_id IS NOT NULL THEN
    RETURN click_row.signed_up_user_id = auth.uid();
  END IF;

  UPDATE public.affiliate_clicks
  SET signed_up_user_id = auth.uid()
  WHERE id = click_row.id AND signed_up_user_id IS NULL;

  IF FOUND THEN
    UPDATE public.affiliate_applications
    SET total_signups = total_signups + 1
    WHERE id = click_row.affiliate_id;
    RETURN true;
  END IF;

  RETURN false;
END
$function$;

REVOKE ALL ON FUNCTION public.claim_affiliate_click(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_affiliate_click(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.attach_referral(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attach_referral(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.approve_subscription_request(uuid, plan_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_subscription_request(uuid, plan_type) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.track_affiliate_click(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_affiliate_click(text, text, text, text, text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.validate_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated, service_role;