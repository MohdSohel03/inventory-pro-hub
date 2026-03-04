
CREATE POLICY "Admins can view staff profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.admin_id = auth.uid() AND ur.role = 'staff'
  )
);
