export const MAX_MFA_ATTEMPTS = 5;

const key = (userId: string) => `medapark:mfa-fallos:${userId}`;

export function getFailures(userId: string): number {
  try {
    const value = Number.parseInt(sessionStorage.getItem(key(userId)) ?? '0', 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function registerFailure(userId: string): number {
  const next = getFailures(userId) + 1;
  try {
    sessionStorage.setItem(key(userId), String(next));
  } catch {
    // sin almacenamiento: el límite real lo pone Supabase
  }
  return next;
}

export function resetFailures(userId: string): void {
  try {
    sessionStorage.removeItem(key(userId));
  } catch {
    // nada que limpiar
  }
}
