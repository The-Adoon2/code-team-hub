
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        const userData: User = {
          code: profile.code,
          name: profile.name || `User ${profile.code}`,
          role: profile.role || 'Team Member',
          isAdmin: profile.is_admin || false
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (code: string): Promise<boolean> => {
    if (code.length !== 5 || !/^\d{5}$/.test(code)) {
      return false;
    }

    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('code', code)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile lookup error:', profileError);
        return false;
      }

      let userProfile = profile;

      // If profile doesn't exist, create a new one
      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            code,
            name: `User ${code}`,
            role: 'Team Member',
            is_admin: false
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return false;
        }
        userProfile = newProfile;
      }

      // Create or sign in the user with Supabase Auth using the profile ID
      const email = `${code}@frcteam.local`;
      const password = `frc_${code}_temp`;

      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If sign in fails, try to sign up
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              profile_id: userProfile.id,
              code: userProfile.code
            }
          }
        });

        if (signUpError) {
          console.error('Error signing up:', signUpError);
          return false;
        }
      }

      // Update the profiles table to link with auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && userProfile) {
        await supabase
          .from('profiles')
          .update({ id: authUser.id })
          .eq('code', code);
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
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
