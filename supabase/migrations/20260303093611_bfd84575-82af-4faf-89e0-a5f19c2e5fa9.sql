
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'admin',
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to get admin_id for a user
-- If user is admin, returns their own id. If staff, returns their admin_id.
CREATE OR REPLACE FUNCTION public.get_admin_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT admin_id FROM public.user_roles WHERE user_id = _user_id AND role = 'staff'),
    _user_id
  )
$$;

-- RLS for user_roles: admins see their own + their staff, staff see their own
CREATE POLICY "Users can view relevant roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR admin_id = auth.uid()
);

CREATE POLICY "Admins can insert staff roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete staff roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin')
);

-- Auto-assign admin role on signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, admin_id)
  VALUES (NEW.id, 'admin', NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();

-- Update products RLS: staff can SELECT admin's products
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own or admin products"
ON public.products FOR SELECT
TO authenticated
USING (user_id = public.get_admin_id(auth.uid()));

-- Only admins can CUD products
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
TO authenticated
USING (user_id = public.get_admin_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
TO authenticated
USING (user_id = public.get_admin_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Update other tables so staff can view admin's data
DROP POLICY IF EXISTS "Users can view own suppliers" ON public.suppliers;
CREATE POLICY "Users can view own or admin suppliers"
ON public.suppliers FOR SELECT TO authenticated
USING (user_id = public.get_admin_id(auth.uid()));

DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own or admin purchases"
ON public.purchases FOR SELECT TO authenticated
USING (user_id = public.get_admin_id(auth.uid()));

DROP POLICY IF EXISTS "Users can view own sales" ON public.sales;
CREATE POLICY "Users can view own or admin sales"
ON public.sales FOR SELECT TO authenticated
USING (user_id = public.get_admin_id(auth.uid()));
