DROP POLICY IF EXISTS user_roles_self_insert_user ON public.user_roles;
CREATE POLICY user_roles_self_insert_user
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'user'::public.app_role);