import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from './supabase';
import { isOwnerEmail } from './owners';

export interface User {
  id: string;
  email: string;
  name?: string;
  isOwner?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUserDirect: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(sbUser: any): User {
  return {
    id: sbUser.id,
    email: sbUser.email || '',
    name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
    isOwner: isOwnerEmail(sbUser.email)
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setLoading(false);
    }).catch(() => {
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setUserDirect = (newUser: User | null) => {
    // Kept for the auth context contract, but authentication itself is always
    // owned by Supabase. UI code must never manufacture a logged-in user.
    setUser(newUser);
  };

  const signIn = async (email: string, pass: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass
    });
    if (error) throw error;
    if (data.user) setUser(mapSupabaseUser(data.user));
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: { full_name: name?.trim() || '' },
        emailRedirectTo: window.location.origin + '/login'
      }
    });
    if (error) throw error;
    if (data.user) setUser(mapSupabaseUser(data.user));
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setUserDirect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
