import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, fetchAdminStatus, trackPresence } from '../lib/supabase';

const AuthContext = createContext(null);

const ADMIN_EMAILS = ['kingorwot007@gmail.com', 'mohitoza338@gmail.com'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshAdmin = useCallback(async (u) => {
    if (!u) {
      setIsAdmin(false);
      return;
    }
    let rpcAdmin = false;
    try {
      rpcAdmin = await fetchAdminStatus();
    } catch (e) {
      console.error('is_admin check failed:', e);
    }
    const emailAdmin = ADMIN_EMAILS.includes((u.email || '').toLowerCase());
    setIsAdmin(rpcAdmin || emailAdmin);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await refreshAdmin(session?.user ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        refreshAdmin(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshAdmin]);

  // Presence tracking — jab user login kare to "online abhi" me show ho
  const presenceChannelRef = useRef(null);
  useEffect(() => {
    if (!user) {
      if (presenceChannelRef.current) {
        supabase?.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      return;
    }
    const channel = trackPresence(user);
    presenceChannelRef.current = channel;
    return () => {
      if (presenceChannelRef.current) {
        supabase?.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [user]);

  const sendOTP = useCallback(async (email) => {
    if (!supabase) throw new Error('Supabase not configured. Please add .env credentials.');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return true;
  }, []);

  const verifyOTP = useCallback(async (email, token) => {
    if (!supabase) throw new Error('Supabase not configured. Please add .env credentials.');
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  }, []);

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    sendOTP,
    verifyOTP,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
