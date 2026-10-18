import { createContext } from 'react';
import type { AuthStage } from '../domain/authStage';
import { resetFailures } from '../domain/mfaAttempts';
import { isSessionError } from '../lib/errors';
import { getCurrentUser, signOutLocal } from '../services/auth';

export type AuthUser = { id: string; email: string };

export type AuthContextValue = {
  stage: AuthStage;
  user: AuthUser | null;
  refresh: () => Promise<AuthStage>;
  /** signOutLocal + limpieza del contador de intentos MFA. */
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Ante un error de sesión (401, JWT inválido…) cierra la sesión local.
 * Devuelve true si el error era de sesión y se cerró.
 */
export async function handleSessionError(error: unknown): Promise<boolean> {
  if (!isSessionError(error)) return false;

  try {
    const user = await getCurrentUser().catch(() => null);
    if (user) resetFailures(user.id);
  } finally {
    await signOutLocal();
  }
  return true;
}
