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
const LOCAL_STORAGE_USER_KEY = 'zenixmind_current_user';

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
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const nextUser = session?.user ? mapSupabaseUser(session.user) : null;
      setUser(nextUser);
      if (nextUser) localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      setLoading(false);
    }).catch(() => {
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const nextUser = session?.user ? mapSupabaseUser(session.user) : null;
      setUser(nextUser);
      if (nextUser) localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setUserDirect = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
    else localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Authentication is not configured. Please try again later.');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      if (data.user) setUserDirect(mapSupabaseUser(data.user));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Authentication is not configured. Please try again later.');
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name || '' } }
      });
      if (error) throw error;
      if (data.user) setUserDirect(mapSupabaseUser(data.user));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try { await supabase.auth.signOut(); } catch {}
    }
    setUserDirect(null);
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
