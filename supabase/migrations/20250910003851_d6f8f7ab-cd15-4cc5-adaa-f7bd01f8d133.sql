-- Fix security issues from the previous migration

-- Drop and recreate the view without SECURITY DEFINER (it's a view, not a function)
DROP VIEW IF EXISTS public.user_hours_summary;

-- Recreate as a regular view (views don't use SECURITY DEFINER)
CREATE VIEW public.user_hours_summary AS
SELECT 
  p.code,
  p.name,
  p.role,
  COALESCE(SUM(ts.total_hours), 0) as total_hours,
  COUNT(CASE WHEN ts.is_flagged THEN 1 END) as flagged_sessions,
  MAX(ts.updated_at) as last_activity
FROM profiles p
LEFT JOIN time_sessions ts ON p.code = ts.user_code AND ts.check_out_time IS NOT NULL
GROUP BY p.code, p.name, p.role
ORDER BY total_hours DESC;

-- Fix the function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_time_sessions_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;