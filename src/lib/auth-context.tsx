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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isOwner: isOwnerEmail(parsed.email)
        };
      }
    } catch {
      // ignore
    }
    // Default logged in as repo owner for previewing convenience if not set
    return {
      id: 'usr_owner_preview',
      email: 'dannyyoungofficial1@gmail.com',
      name: 'Danny Young',
      isOwner: true
    };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
        if (sbUser) {
          const mapped: User = {
            id: sbUser.id,
            email: sbUser.email || '',
            name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
            isOwner: isOwnerEmail(sbUser.email)
          };
          setUser(mapped);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mapped));
        }
      }).catch(() => {});
    }
  }, []);

  const setUserDirect = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

  const signIn = async (email: string, _pass: string) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: _pass });
        if (error) throw error;
      }
      const loggedUser: User = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email,
        name: email.split('@')[0],
        isOwner: isOwnerEmail(email)
      };
      setUserDirect(loggedUser);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, _pass: string, name?: string) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.auth.signUp({
          email,
          password: _pass,
          options: { data: { full_name: name || '' } }
        });
        if (error) throw error;
      }
      const registeredUser: User = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email,
        name: name || email.split('@')[0],
        isOwner: isOwnerEmail(email)
      };
      setUserDirect(registeredUser);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
