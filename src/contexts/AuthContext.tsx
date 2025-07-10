
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user in localStorage
    const getInitialUser = async () => {
      try {
        const storedUser = localStorage.getItem('frc_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          // Set the current user context for RLS
          await supabase.rpc('set_current_user_code', { user_code: userData.code });
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        localStorage.removeItem('frc_user');
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();
  }, []);

  const login = async (code: string): Promise<boolean> => {
    if (code.length !== 5 || !/^\d{5}$/.test(code)) {
      return false;
    }

    try {
      // First, set the current user context for RLS
      await supabase.rpc('set_current_user_code', { user_code: code });
      
      // Check if profile exists in database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('code', code)
        .single();

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        return false;
      }

      if (!profile) {
        return false;
      }

      // Create user object from profile
      const userData: User = {
        code: profile.code,
        name: profile.name || `User ${profile.code}`,
        role: profile.role || 'Team Member',
        isAdmin: profile.is_admin || false
      };

      setUser(userData);
      localStorage.setItem('frc_user', JSON.stringify(userData));
      
      // Sign in to Supabase auth with the user code as identifier
      const { error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: { user_code: code }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Don't fail login if anonymous auth fails, we can still work with localStorage
      }
      
      console.log('Login successful for user:', userData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('frc_user');
    supabase.auth.signOut();
    console.log('User logged out');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user && !loading,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-frc-blue"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
