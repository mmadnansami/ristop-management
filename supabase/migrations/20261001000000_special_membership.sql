-- Migration for Ristop Special Membership™ system
CREATE SEQUENCE IF NOT EXISTS public.membership_id_seq START 1001;

-- 1. Membership Tiers
CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL, -- 'special', 'premium', 'elite'
  name text NOT NULL,
  name_bn text NOT NULL,
  description text,
  price_bdt numeric(10,2) NOT NULL DEFAULT 0,
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'annual', -- 'annual', 'lifetime'
  discount_percent integer NOT NULL DEFAULT 0, -- 15, 20, 30
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default tiers if empty
INSERT INTO public.membership_tiers (slug, name, name_bn, description, price_bdt, price_usd, billing_period, discount_percent, benefits, is_active)
VALUES
(
  'special',
  'Special Member',
  'স্পেশাল মেম্বার',
  'Free exclusive membership with digital card, community access and 15% discount on subscriptions.',
  0,
  0,
  'annual',
  15,
  '[
    "Digital Special Member Card (Purple & White)",
    "15%+ Extra Discount on Subscriptions",
    "Eligible member-only offers",
    "Basic membership benefits",
    "Future community access"
  ]'::jsonb,
  true
),
(
  'premium',
  'Premium Member',
  'প্রিমিয়াম মেম্বার',
  'Paid annual membership with premium card, priority support and 20% discount on subscriptions.',
  299,
  4,
  'annual',
  20,
  '[
    "Premium Digital Member Card (Deep Purple & Silver)",
    "20% Extra Discount on Subscriptions",
    "Priority support channel",
    "Eligible exclusive business offers",
    "Early access eligibility",
    "Premium membership benefits"
  ]'::jsonb,
  true
),
(
  'elite',
  'Elite Member',
  'ইলিট মেম্বার',
  'Top-tier annual membership with elite gold card, highest discounts, priority onboarding & support.',
  999,
  12,
  'annual',
  30,
  '[
    "Elite Digital Member Card (Deep Purple & Gold)",
    "30% Highest Discount on Subscriptions",
    "Priority onboarding & dedicated assistance",
    "Exclusive business opportunities when available",
    "24/7 VIP priority support",
    "Elite member benefits"
  ]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  price_bdt = EXCLUDED.price_bdt,
  price_usd = EXCLUDED.price_usd,
  discount_percent = EXCLUDED.discount_percent,
  benefits = EXCLUDED.benefits;

-- 2. Membership Applications
CREATE TABLE IF NOT EXISTS public.membership_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  business_name text,
  business_category text NOT NULL,
  country text NOT NULL DEFAULT 'Bangladesh',
  requested_tier text NOT NULL DEFAULT 'special',
  reason text NOT NULL,
  terms_agreed boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'payment_pending', 'active', 'rejected', 'expired', 'suspended')),
  admin_notes text,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Memberships
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.membership_applications(id) ON DELETE SET NULL,
  tier text NOT NULL CHECK (tier IN ('special', 'premium', 'elite')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
  member_id text UNIQUE NOT NULL, -- e.g. RST-SP-1001
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  renewal_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Membership Cards
CREATE TABLE IF NOT EXISTS public.membership_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_number text UNIQUE NOT NULL,
  verification_token text UNIQUE NOT NULL,
  qr_code_data text NOT NULL,
  is_revoked boolean NOT NULL DEFAULT false,
  revoked_reason text,
  revoked_at timestamptz,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Membership Invitations
CREATE TABLE IF NOT EXISTS public.membership_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  tier text NOT NULL CHECK (tier IN ('special', 'premium', 'elite')),
  email text,
  invitee_name text,
  note text,
  expires_at timestamptz NOT NULL,
  is_revoked boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Membership Payments
CREATE TABLE IF NOT EXISTS public.membership_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.membership_applications(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  payment_method text NOT NULL,
  transaction_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Membership Audit Logs
CREATE TABLE IF NOT EXISTS public.membership_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Membership In-App Notifications
CREATE TABLE IF NOT EXISTS public.membership_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tier ON public.memberships(tier);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_membership_apps_user ON public.membership_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_apps_status ON public.membership_applications(status);
CREATE INDEX IF NOT EXISTS idx_membership_cards_token ON public.membership_cards(verification_token);
CREATE INDEX IF NOT EXISTS idx_membership_invitations_token ON public.membership_invitations(token);
CREATE INDEX IF NOT EXISTS idx_membership_payments_user ON public.membership_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_notifications_user ON public.membership_notifications(user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.membership_tiers TO authenticated;
GRANT SELECT ON public.membership_tiers TO anon;
GRANT ALL ON public.membership_tiers TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.membership_applications TO authenticated;
GRANT SELECT, INSERT ON public.membership_applications TO anon;
GRANT ALL ON public.membership_applications TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.membership_cards TO authenticated;
GRANT SELECT ON public.membership_cards TO anon;
GRANT ALL ON public.membership_cards TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.membership_invitations TO authenticated;
GRANT SELECT ON public.membership_invitations TO anon;
GRANT ALL ON public.membership_invitations TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.membership_payments TO authenticated;
GRANT ALL ON public.membership_payments TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.membership_notifications TO authenticated;
GRANT ALL ON public.membership_notifications TO service_role;

GRANT SELECT, INSERT ON public.membership_audit_logs TO authenticated;
GRANT ALL ON public.membership_audit_logs TO service_role;

-- Enable RLS
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. membership_tiers
DROP POLICY IF EXISTS "tiers_read" ON public.membership_tiers;
CREATE POLICY "tiers_read" ON public.membership_tiers FOR SELECT USING (true);
DROP POLICY IF EXISTS "tiers_admin_write" ON public.membership_tiers;
CREATE POLICY "tiers_admin_write" ON public.membership_tiers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. membership_applications
DROP POLICY IF EXISTS "apps_self_select" ON public.membership_applications;
CREATE POLICY "apps_self_select" ON public.membership_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "apps_insert" ON public.membership_applications;
CREATE POLICY "apps_insert" ON public.membership_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "apps_admin_write" ON public.membership_applications;
CREATE POLICY "apps_admin_write" ON public.membership_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. memberships
DROP POLICY IF EXISTS "memberships_self_select" ON public.memberships;
CREATE POLICY "memberships_self_select" ON public.memberships FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "memberships_admin_all" ON public.memberships;
CREATE POLICY "memberships_admin_all" ON public.memberships FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. membership_cards
DROP POLICY IF EXISTS "cards_public_verify" ON public.membership_cards;
CREATE POLICY "cards_public_verify" ON public.membership_cards FOR SELECT USING (true);
DROP POLICY IF EXISTS "cards_admin_all" ON public.membership_cards;
CREATE POLICY "cards_admin_all" ON public.membership_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. membership_invitations
DROP POLICY IF EXISTS "invites_read_valid" ON public.membership_invitations;
CREATE POLICY "invites_read_valid" ON public.membership_invitations FOR SELECT USING (true);
DROP POLICY IF EXISTS "invites_admin_all" ON public.membership_invitations;
CREATE POLICY "invites_admin_all" ON public.membership_invitations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. membership_payments
DROP POLICY IF EXISTS "payments_self_select" ON public.membership_payments;
CREATE POLICY "payments_self_select" ON public.membership_payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "payments_insert" ON public.membership_payments;
CREATE POLICY "payments_insert" ON public.membership_payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "payments_admin_all" ON public.membership_payments;
CREATE POLICY "payments_admin_all" ON public.membership_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. membership_notifications
DROP POLICY IF EXISTS "notif_self" ON public.membership_notifications;
CREATE POLICY "notif_self" ON public.membership_notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. membership_audit_logs
DROP POLICY IF EXISTS "audit_admin_only" ON public.membership_audit_logs;
CREATE POLICY "audit_admin_only" ON public.membership_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ==============================================================================
-- Secure RPC Functions (SECURITY DEFINER)
-- ==============================================================================

-- 1. Helper function to generate Member ID
CREATE OR REPLACE FUNCTION public.generate_member_id(_tier text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  seq_val bigint;
  prefix text;
BEGIN
  SELECT nextval('public.membership_id_seq') INTO seq_val;
  prefix := CASE _tier
    WHEN 'elite' THEN 'RST-EL-'
    WHEN 'premium' THEN 'RST-PR-'
    ELSE 'RST-SP-'
  END;
  RETURN prefix || seq_val;
END;
$$;

-- 2. Claim membership invitation
CREATE OR REPLACE FUNCTION public.claim_membership_invitation(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv record;
  user_id_val uuid;
  existing_membership record;
  new_member_id text;
  new_membership_id uuid;
  new_card_id uuid;
  card_num text;
  verif_tok text;
  tier_name text;
BEGIN
  user_id_val := auth.uid();
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Authentication required to claim invitation';
  END IF;

  SELECT * INTO inv FROM public.membership_invitations
  WHERE token = _token FOR UPDATE;

  IF inv.id IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  IF inv.is_revoked THEN
    RAISE EXCEPTION 'This invitation has been revoked';
  END IF;

  IF inv.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'This invitation has already been claimed';
  END IF;

  IF inv.expires_at < now() THEN
    RAISE EXCEPTION 'This invitation has expired';
  END IF;

  -- Deactivate previous active memberships if any
  UPDATE public.memberships SET status = 'expired'
  WHERE user_id = user_id_val AND status = 'active';

  -- Generate ID & Tokens
  new_member_id := public.generate_member_id(inv.tier);
  card_num := 'PC-' || upper(substr(md5(random()::text), 1, 4)) || '-' || upper(substr(md5(random()::text), 5, 4));
  verif_tok := 'rst_m_' || lower(substr(md5(random()::text), 1, 16)) || '_' || extract(epoch from now())::bigint;

  -- Insert Membership
  INSERT INTO public.memberships (
    user_id,
    tier,
    status,
    member_id,
    starts_at,
    expires_at
  ) VALUES (
    user_id_val,
    inv.tier,
    'active',
    new_member_id,
    now(),
    now() + interval '1 year'
  ) RETURNING id INTO new_membership_id;

  -- Insert Card
  INSERT INTO public.membership_cards (
    membership_id,
    user_id,
    card_number,
    verification_token,
    qr_code_data
  ) VALUES (
    new_membership_id,
    user_id_val,
    card_num,
    verif_tok,
    verif_tok
  ) RETURNING id INTO new_card_id;

  -- Update Invitation
  UPDATE public.membership_invitations
  SET used_by = user_id_val, used_at = now()
  WHERE id = inv.id;

  -- Audit log
  INSERT INTO public.membership_audit_logs (actor_id, action, target_id, details)
  VALUES (
    user_id_val,
    'claim_invitation',
    new_membership_id,
    jsonb_build_object('token', _token, 'tier', inv.tier, 'member_id', new_member_id)
  );

  -- Notification
  tier_name := CASE inv.tier WHEN 'elite' THEN 'Elite' WHEN 'premium' THEN 'Premium' ELSE 'Special' END;
  INSERT INTO public.membership_notifications (user_id, title, message, type)
  VALUES (
    user_id_val,
    'Welcome to Ristop ' || tier_name || ' Membership!',
    'Your invitation was verified successfully and your Privilege Card has been issued.',
    'success'
  );

  RETURN jsonb_build_object(
    'success', true,
    'membership_id', new_membership_id,
    'member_id', new_member_id,
    'tier', inv.tier
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_membership_invitation(text) TO authenticated;

-- 3. Admin review membership application
CREATE OR REPLACE FUNCTION public.admin_review_application(
  _app_id uuid,
  _action text, -- 'approve', 'reject', 'request_info'
  _admin_notes text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_id uuid;
  app record;
  new_member_id text;
  new_membership_id uuid;
  card_num text;
  verif_tok text;
  tier_name text;
BEGIN
  caller_id := auth.uid();
  IF NOT public.has_role(caller_id, 'admin') THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  SELECT * INTO app FROM public.membership_applications
  WHERE id = _app_id FOR UPDATE;

  IF app.id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  tier_name := CASE app.requested_tier WHEN 'elite' THEN 'Elite' WHEN 'premium' THEN 'Premium' ELSE 'Special' END;

  IF _action = 'approve' THEN
    IF app.requested_tier = 'special' THEN
      -- Free tier: activate immediately
      UPDATE public.memberships SET status = 'expired'
      WHERE user_id = app.user_id AND status = 'active';

      new_member_id := public.generate_member_id(app.requested_tier);
      card_num := 'PC-' || upper(substr(md5(random()::text), 1, 4)) || '-' || upper(substr(md5(random()::text), 5, 4));
      verif_tok := 'rst_m_' || lower(substr(md5(random()::text), 1, 16)) || '_' || extract(epoch from now())::bigint;

      INSERT INTO public.memberships (
        user_id,
        application_id,
        tier,
        status,
        member_id,
        starts_at,
        expires_at
      ) VALUES (
        app.user_id,
        app.id,
        app.requested_tier,
        'active',
        new_member_id,
        now(),
        now() + interval '1 year'
      ) RETURNING id INTO new_membership_id;

      INSERT INTO public.membership_cards (
        membership_id,
        user_id,
        card_number,
        verification_token,
        qr_code_data
      ) VALUES (
        new_membership_id,
        app.user_id,
        card_num,
        verif_tok,
        verif_tok
      );

      UPDATE public.membership_applications
      SET status = 'active',
          admin_notes = coalesce(_admin_notes, admin_notes),
          reviewer_id = caller_id,
          reviewed_at = now(),
          updated_at = now()
      WHERE id = app.id;

      IF app.user_id IS NOT NULL THEN
        INSERT INTO public.membership_notifications (user_id, title, message, type)
        VALUES (
          app.user_id,
          'Membership Approved & Active!',
          'Congratulations! Your Ristop Special Membership application has been approved and your Privilege Card is ready.',
          'success'
        );
      END IF;

    ELSE
      -- Paid tier: status becomes 'payment_pending'
      UPDATE public.membership_applications
      SET status = 'payment_pending',
          admin_notes = coalesce(_admin_notes, admin_notes),
          reviewer_id = caller_id,
          reviewed_at = now(),
          updated_at = now()
      WHERE id = app.id;

      IF app.user_id IS NOT NULL THEN
        INSERT INTO public.membership_notifications (user_id, title, message, type)
        VALUES (
          app.user_id,
          'Application Approved - Payment Required',
          'Your application for Ristop ' || tier_name || ' Membership has been approved. Please complete payment to activate your card.',
          'info'
        );
      END IF;
    END IF;

  ELSIF _action = 'reject' THEN
    UPDATE public.membership_applications
    SET status = 'rejected',
        admin_notes = coalesce(_admin_notes, admin_notes),
        reviewer_id = caller_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = app.id;

    IF app.user_id IS NOT NULL THEN
      INSERT INTO public.membership_notifications (user_id, title, message, type)
      VALUES (
        app.user_id,
        'Application Update',
        'Your membership application was reviewed and could not be approved at this time. ' || coalesce(_admin_notes, ''),
        'warning'
      );
    END IF;

  ELSIF _action = 'request_info' THEN
    UPDATE public.membership_applications
    SET status = 'under_review',
        admin_notes = coalesce(_admin_notes, admin_notes),
        reviewer_id = caller_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = app.id;

    IF app.user_id IS NOT NULL THEN
      INSERT INTO public.membership_notifications (user_id, title, message, type)
      VALUES (
        app.user_id,
        'Additional Information Requested',
        'Our administration team reviewed your application and requested additional information: ' || coalesce(_admin_notes, ''),
        'info'
      );
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid action: %', _action;
  END IF;

  INSERT INTO public.membership_audit_logs (actor_id, action, target_id, details)
  VALUES (
    caller_id,
    'admin_review_application',
    app.id,
    jsonb_build_object('action', _action, 'tier', app.requested_tier, 'notes', _admin_notes)
  );

  RETURN jsonb_build_object('success', true, 'action', _action, 'status', (SELECT status FROM public.membership_applications WHERE id = app.id));
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_review_application(uuid, text, text) TO authenticated;

-- 4. Admin revoke / reissue membership card
CREATE OR REPLACE FUNCTION public.admin_toggle_card_revocation(
  _card_id uuid,
  _revoke boolean,
  _reason text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_id uuid;
  card record;
BEGIN
  caller_id := auth.uid();
  IF NOT public.has_role(caller_id, 'admin') THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  SELECT * INTO card FROM public.membership_cards WHERE id = _card_id;
  IF card.id IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  UPDATE public.membership_cards
  SET is_revoked = _revoke,
      revoked_reason = CASE WHEN _revoke THEN _reason ELSE NULL END,
      revoked_at = CASE WHEN _revoke THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = _card_id;

  INSERT INTO public.membership_audit_logs (actor_id, action, target_id, details)
  VALUES (
    caller_id,
    CASE WHEN _revoke THEN 'revoke_card' ELSE 'reinstate_card' END,
    _card_id,
    jsonb_build_object('reason', _reason)
  );

  RETURN jsonb_build_object('success', true, 'is_revoked', _revoke);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_toggle_card_revocation(uuid, boolean, text) TO authenticated;
