
-- Restrict suppliers: only admins can insert, update, delete
DROP POLICY IF EXISTS "Users can delete own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON public.suppliers;

CREATE POLICY "Admins can insert suppliers"
ON public.suppliers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update suppliers"
ON public.suppliers FOR UPDATE TO authenticated
USING (user_id = get_admin_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE TO authenticated
USING (user_id = get_admin_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Restrict purchases: only admins can insert, update, delete
DROP POLICY IF EXISTS "Users can delete own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can update own purchases" ON public.purchases;

CREATE POLICY "Admins can insert purchases"
ON public.purchases FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update purchases"
ON public.purchases FOR UPDATE TO authenticated
USING (user_id = get_admin_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete purchases"
ON public.purchases FOR DELETE TO authenticated
USING (user_id = get_admin_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
