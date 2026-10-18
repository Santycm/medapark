import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { resolveAuthStage, type AuthStage } from '../domain/authStage';
import { resetFailures } from '../domain/mfaAttempts';
import { getAuthSnapshot, signOutLocal } from '../services/auth';
import { AuthContext, type AuthContextValue, type AuthUser } from './authContext';

const WATCHED_EVENTS = [
  'SIGNED_IN',
  'SIGNED_OUT',
  'TOKEN_REFRESHED',
  'MFA_CHALLENGE_VERIFIED',
  'USER_UPDATED',
];

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [stage, setStage] = useState<AuthStage>('cargando');
  const [user, setUser] = useState<AuthUser | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async (): Promise<AuthStage> => {
    const snapshot = await getAuthSnapshot();
    const next = resolveAuthStage({
      hasSession: snapshot.hasSession,
      currentLevel: snapshot.currentLevel,
      verifiedTotpCount: snapshot.verifiedTotpFactorId ? 1 : 0,
    });

    if (mounted.current) {
      setUser(snapshot.user);
      setStage(next);
    }
    return next;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!WATCHED_EVENTS.includes(event)) return;
      // Diferido: no se llama a supabase dentro del callback del evento.
      setTimeout(() => void refresh(), 0);
    });

    return () => {
      mounted.current = false;
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  const signOut = useCallback(async () => {
    if (user) resetFailures(user.id);
    await signOutLocal();
    await refresh();
  }, [user, refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({ stage, user, refresh, signOut }),
    [stage, user, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
