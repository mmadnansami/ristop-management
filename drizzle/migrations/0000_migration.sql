CREATE POLICY affiliate_application_admin_insert ON public.affiliate_applications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));