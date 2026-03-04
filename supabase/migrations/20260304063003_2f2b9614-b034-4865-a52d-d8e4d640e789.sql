
-- Fix profiles table default role to 'admin'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'admin';

-- Update handle_new_user to set role as 'admin' in profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'admin');
  RETURN NEW;
END;
$$;

-- Ensure handle_new_user_role sets 'admin' (not 'staff')
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, admin_id)
  VALUES (NEW.id, 'admin', NULL);
  RETURN NEW;
END;
$$;
