import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { toast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailConfirmed?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticating: false,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          if (!welcomeShown) {
            toast({
              title: "Welcome back!",
              description: "Successfully signed in",
            });
          }
          
          const profilePromise = new Promise<void>(async (resolve) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profile) {
                const emailConfirmed = session.user.email_confirmed_at !== null;
                
                setUser({
                  id: session.user.id,
                  email: profile.email,
                  name: profile.name,
                  role: profile.role as UserRole,
                  emailConfirmed,
                });

                if (emailConfirmed && !welcomeShown) {
                  setWelcomeShown(true);
                }
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
            } finally {
              resolve();
            }
          });
          
          Promise.race([
            profilePromise,
            new Promise(resolve => setTimeout(resolve, 3000))
          ]).finally(() => {
            setIsLoading(false);
            setIsAuthenticating(false);
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setWelcomeShown(false);
          setIsLoading(false);
          setIsAuthenticating(false);
        } else if (event === 'USER_UPDATED') {
          if (session?.user) {
            setUser(prevUser => 
              prevUser ? {
                ...prevUser,
                emailConfirmed: session.user.email_confirmed_at !== null
              } : null
            );
            
            if (session.user.email_confirmed_at !== null) {
              toast({
                title: "Email Confirmed!",
                description: "Your email has been successfully verified.",
              });
            }
          }
          setIsLoading(false);
          setIsAuthenticating(false);
        } else {
          setIsLoading(false);
          setIsAuthenticating(false);
        }
      }
    );

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profilePromise = new Promise<void>(async (resolve) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profile) {
                setUser({
                  id: session.user.id,
                  email: profile.email,
                  name: profile.name,
                  role: profile.role as UserRole,
                  emailConfirmed: session.user.email_confirmed_at !== null,
                });
              }
            } catch (error) {
              console.error('Error getting profile:', error);
            } finally {
              resolve();
            }
          });
          
          Promise.race([
            profilePromise,
            new Promise(resolve => setTimeout(resolve, 3000))
          ]).finally(() => {
            setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsAuthenticating(true);
    
    try {
      toast({
        title: "Signing in...",
        description: "Processing your login",
      });
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message,
        });
        setIsAuthenticating(false);
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || 'An unexpected error occurred',
      });
      setIsAuthenticating(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setIsAuthenticating(true);
      await supabase.auth.signOut();
      setUser(null);
      setWelcomeShown(false);
      toast({
        title: "Signed out",
        description: "You have been successfully logged out."
      });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticating, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
