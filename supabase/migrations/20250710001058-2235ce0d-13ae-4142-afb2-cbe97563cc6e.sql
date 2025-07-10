
-- Drop existing RLS policies that are causing issues
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles; 
DROP POLICY IF EXISTS "Only permanent admin can delete profiles" ON public.profiles;

-- Create new RLS policies that work with our authentication system
-- Allow anyone to view profiles (needed for login checks)
-- This policy already exists and works fine

-- Allow authenticated users to insert profiles if they are admin
CREATE POLICY "Authenticated admins can insert profiles" ON public.profiles
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE code = current_setting('request.jwt.claims', true)::json->>'sub' 
    AND is_admin = true
  )
);

-- Allow authenticated users to update profiles if they are admin  
CREATE POLICY "Authenticated admins can update profiles" ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE code = current_setting('request.jwt.claims', true)::json->>'sub'
    AND is_admin = true
  )
);

-- Allow permanent admin to delete profiles
CREATE POLICY "Permanent admin can delete profiles" ON public.profiles
FOR DELETE
TO authenticated
USING (
  current_setting('request.jwt.claims', true)::json->>'sub' = '10101'
);

-- Create a function to set the current user context for RLS
CREATE OR REPLACE FUNCTION public.set_current_user_code(user_code text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_code', user_code, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_current_user_code(text) TO authenticated;
