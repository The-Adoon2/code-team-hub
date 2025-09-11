-- Update the RLS policy to allow admins to insert time sessions for any user
DROP POLICY IF EXISTS "Users can insert their own time sessions" ON public.time_sessions;

-- Create new policy that allows users to insert their own sessions OR admins to insert any session
CREATE POLICY "Users can insert their own time sessions or admins can insert any" 
ON public.time_sessions 
FOR INSERT 
WITH CHECK (
  user_code = current_setting('app.current_user_code'::text, true) 
  OR 
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE code = current_setting('app.current_user_code'::text, true) 
    AND is_admin = true
  )
);