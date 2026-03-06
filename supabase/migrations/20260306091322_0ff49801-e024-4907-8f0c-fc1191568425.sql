
-- Allow staff to insert sales (need permissive policy since all current ones are restrictive)
-- First, drop existing restrictive INSERT policy on sales
DROP POLICY IF EXISTS "Users can insert own sales" ON public.sales;

-- Create permissive INSERT policy for all authenticated users
CREATE POLICY "Authenticated users can insert own sales"
ON public.sales FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure SELECT policies work - drop restrictive and create permissive
DROP POLICY IF EXISTS "Users can view own or admin sales" ON public.sales;

CREATE POLICY "Users can view own or admin sales"
ON public.sales FOR SELECT TO authenticated
USING (user_id = get_admin_id(auth.uid()));

-- Fix DELETE - only admins should delete
DROP POLICY IF EXISTS "Users can delete own sales" ON public.sales;

CREATE POLICY "Admins can delete sales"
ON public.sales FOR DELETE TO authenticated
USING (user_id = get_admin_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Fix UPDATE 
DROP POLICY IF EXISTS "Users can update own sales" ON public.sales;

CREATE POLICY "Admins can update sales"
ON public.sales FOR UPDATE TO authenticated
USING (user_id = get_admin_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Fix products SELECT - make permissive so staff can see products
DROP POLICY IF EXISTS "Users can view own or admin products" ON public.products;

CREATE POLICY "Users can view own or admin products"
ON public.products FOR SELECT TO authenticated
USING (user_id = get_admin_id(auth.uid()));

-- Fix purchases SELECT - make permissive so staff can see in reports
DROP POLICY IF EXISTS "Users can view own or admin purchases" ON public.purchases;

CREATE POLICY "Users can view own or admin purchases"
ON public.purchases FOR SELECT TO authenticated
USING (user_id = get_admin_id(auth.uid()));

-- Fix suppliers SELECT
DROP POLICY IF EXISTS "Users can view own or admin suppliers" ON public.suppliers;

CREATE POLICY "Users can view own or admin suppliers"
ON public.suppliers FOR SELECT TO authenticated
USING (user_id = get_admin_id(auth.uid()));
