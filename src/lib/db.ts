import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures the current user context is set for RLS policies before executing database operations
 */
export const withUserContext = async <T>(
  userCode: string | undefined,
  operation: () => Promise<T>
): Promise<T> => {
  if (userCode) {
    // Set the current user context for RLS
    await supabase.rpc('set_current_user_code', { user_code: userCode });
  }
  
  return operation();
};

/**
 * Simple wrapper to set user context for database operations
 */
export const setUserContext = async (userCode: string | undefined) => {
  if (userCode) {
    await supabase.rpc('set_current_user_code', { user_code: userCode });
  }
};