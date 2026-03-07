
DROP POLICY IF EXISTS "Authenticated users can insert own sales" ON public.sales;
CREATE POLICY "Authenticated users can insert sales"
ON public.sales FOR INSERT TO authenticated
WITH CHECK (user_id = get_admin_id(auth.uid()));
