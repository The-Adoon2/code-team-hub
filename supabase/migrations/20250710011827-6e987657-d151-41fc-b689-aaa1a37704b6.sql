-- First, let's check the current RLS policies and fix them
-- The issue is that some policies use 'app.current_user_code' and others use 'request.jwt.claims'
-- Since we're using a custom auth system with codes, we need to use 'app.current_user_code' consistently

-- Drop existing policies that use JWT claims (these won't work with custom auth)
DROP POLICY IF EXISTS "Authenticated admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Permanent admin can delete profiles" ON public.profiles;

-- Create new consistent policies for profiles using app.current_user_code
CREATE POLICY "Admins can insert profiles" ON public.profiles 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);

CREATE POLICY "Admins can update profiles" ON public.profiles 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE code = current_setting('app.current_user_code', true) AND is_admin = true)
);

CREATE POLICY "Permanent admin can delete profiles" ON public.profiles 
FOR DELETE USING (
  current_setting('app.current_user_code', true) = '10101'
);

-- Update the set_current_user_code function to be more robust
CREATE OR REPLACE FUNCTION public.set_current_user_code(user_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Set the configuration parameter for the current transaction
  PERFORM set_config('app.current_user_code', user_code, false);
END;
$function$;