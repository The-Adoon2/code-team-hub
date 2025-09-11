-- Fix the security warning for the function search path
CREATE OR REPLACE FUNCTION public.set_current_user_code(user_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set the configuration parameter for the current transaction
  PERFORM set_config('app.current_user_code', user_code, false);
END;
$function$;