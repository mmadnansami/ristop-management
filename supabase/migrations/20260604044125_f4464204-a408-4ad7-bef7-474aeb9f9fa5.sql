
-- 1) user_roles: block writes except by admins
CREATE POLICY user_roles_admin_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_delete ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) subscription_requests: tighten insert with validation; allow only authenticated submitters
DROP POLICY IF EXISTS subreq_anyone_insert ON public.subscription_requests;
CREATE POLICY subreq_auth_insert ON public.subscription_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 120
    AND length(btrim(email)) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(btrim(phone)) BETWEEN 5 AND 30
    AND length(btrim(transaction_id)) BETWEEN 3 AND 120
    AND payment_method IN ('bkash','nagad','rocket','bank')
    AND amount > 0 AND amount <= 1000000
    AND (notes IS NULL OR length(notes) <= 1000)
  );
REVOKE INSERT ON public.subscription_requests FROM anon;

-- 3) Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated.
-- has_role is called from RLS policies (runs as definer regardless of caller execute), trigger function runs on auth signup.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
