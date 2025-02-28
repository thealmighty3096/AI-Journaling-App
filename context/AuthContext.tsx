import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateAndSetSession = async (currentSession: Session | null) => {
    if (!currentSession) {
      setSession(null);
      return;
    }

    try {
      // Verify the session is still valid with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(currentSession.access_token);
      
      if (error || !user) {
        console.log('Session invalid:', error);
        // If there's an error or no user, clear the session
        await supabase.auth.signOut();
        setSession(null);
      } else {
        // Session is valid
        setSession(currentSession);
      }
    } catch (error) {
      console.error('Session validation error:', error);
      await supabase.auth.signOut();
      setSession(null);
    }
  };

  useEffect(() => {
    // Get and validate initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      validateAndSetSession(initialSession);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('Auth state changed:', { event: _event, newSession });
      await validateAndSetSession(newSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 