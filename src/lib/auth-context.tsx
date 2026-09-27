import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSupabase } from './supabase';
import { isOwnerEmail } from './owners';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isOwner?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  getAccessToken: () => Promise<string | null>;
  setUserDirect: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CLIENT_SESSION_KEY = 'zenixmind_client_session_id';

function mapSupabaseUser(sbUser: any): User {
  const meta = sbUser?.user_metadata || {};
  return {
    id: sbUser.id,
    email: (sbUser.email || '').trim().toLowerCase(),
    name: meta.full_name || meta.name || (sbUser.email || '').split('@')[0] || 'User',
    avatarUrl:
      meta.avatar_url ||
      meta.picture ||
      meta.photo_url ||
      meta.avatar ||
      '',
    isOwner: isOwnerEmail(sbUser.email)
  };
}

function getOrCreateClientSessionId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_SESSION_KEY);
    if (existing) return existing;
    const id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CLIENT_SESSION_KEY, id);
    return id;
  } catch {
    return `sess_${Date.now().toString(36)}`;
  }
}

async function postSessionHeartbeat(accessToken: string) {
  try {
    await fetch('/api/session/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ clientSessionId: getOrCreateClientSessionId() })
    });
  } catch {
    // Non-blocking
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);
  const lastHeartbeat = useRef(0);

  const maybeHeartbeat = useCallback((token: string | null | undefined) => {
    if (!token) return;
    const now = Date.now();
    if (now - lastHeartbeat.current < 60000) return;
    lastHeartbeat.current = now;
    void postSessionHeartbeat(token);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setUser(session?.user ? mapSupabaseUser(session.user) : null);
        setAccessToken(session?.access_token || null);
        setLoading(false);
        if (session?.access_token) maybeHeartbeat(session.access_token);
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
          setAccessToken(null);
          setLoading(false);
        }
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setAccessToken(session?.access_token || null);
      setLoading(false);
      if (session?.access_token) maybeHeartbeat(session.access_token);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [maybeHeartbeat]);

  const setUserDirect = (newUser: User | null) => {
    setUser(newUser);
  };

  const signIn = async (email: string, pass: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass
    });
    if (error) throw error;
    if (data.user) setUser(mapSupabaseUser(data.user));
    if (data.session?.access_token) {
      setAccessToken(data.session.access_token);
      lastHeartbeat.current = 0;
      maybeHeartbeat(data.session.access_token);
    }
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: pass,
      options: {
        data: { full_name: name?.trim() || '' },
        emailRedirectTo: window.location.origin + '/login'
      }
    });
    if (error) throw error;
    if (data.user) setUser(mapSupabaseUser(data.user));
    if (data.session?.access_token) {
      setAccessToken(data.session.access_token);
      lastHeartbeat.current = 0;
      maybeHeartbeat(data.session.access_token);
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    try {
      localStorage.removeItem(CLIENT_SESSION_KEY);
    } catch {}
  };

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;

    const work = (async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          setAccessToken(null);
          return null;
        }
        if (data.user) setUser(mapSupabaseUser(data.user));
        setAccessToken(data.session.access_token);
        maybeHeartbeat(data.session.access_token);
        return data.session.access_token;
      } catch {
        setAccessToken(null);
        return null;
      } finally {
        refreshInFlight.current = null;
      }
    })();

    refreshInFlight.current = work;
    return work;
  }, [maybeHeartbeat]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (accessToken) return accessToken;
    return refreshSession();
  }, [accessToken, refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        signIn,
        signUp,
        signOut,
        refreshSession,
        getAccessToken,
        setUserDirect
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
