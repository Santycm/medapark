import { render, screen, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
  listener: { current: null as null | ((event: string) => void) },
  getAuthSnapshot: vi.fn(),
  signOutLocal: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (callback: (event: string) => void) => {
        hoisted.listener.current = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  },
}));

vi.mock('../services/auth', () => ({
  getAuthSnapshot: hoisted.getAuthSnapshot,
  signOutLocal: hoisted.signOutLocal,
  getCurrentUser: vi.fn(),
}));

import AuthProvider from './AuthProvider';
import { useAuth } from '../hooks/useAuth';

const Probe = () => {
  const { stage, user } = useAuth();
  return (
    <p data-testid="probe">
      {stage}:{user?.email ?? '-'}
    </p>
  );
};

const anonymous = { hasSession: false, user: null, currentLevel: null, verifiedTotpFactorId: null };
const complete = {
  hasSession: true,
  user: { id: 'u1', email: 'a@b.co' },
  currentLevel: 'aal2',
  verifiedTotpFactorId: 'f1',
};

const mountProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
});

describe('AuthProvider', () => {
  it('resuelve el estado inicial con el servidor', async () => {
    hoisted.getAuthSnapshot.mockResolvedValue(complete);
    mountProvider();
    expect(screen.getByTestId('probe')).toHaveTextContent('cargando');
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('autenticado:a@b.co'));
  });

  it('SIGNED_OUT → anónimo', async () => {
    hoisted.getAuthSnapshot.mockResolvedValue(complete);
    mountProvider();
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('autenticado'));

    hoisted.getAuthSnapshot.mockResolvedValue(anonymous);
    act(() => hoisted.listener.current?.('SIGNED_OUT'));
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('anonimo:-'));
  });

  it('MFA_CHALLENGE_VERIFIED con snapshot aal2 → autenticado', async () => {
    hoisted.getAuthSnapshot.mockResolvedValue({ ...complete, currentLevel: 'aal1' });
    mountProvider();
    await waitFor(() =>
      expect(screen.getByTestId('probe')).toHaveTextContent('requiere_verificacion'),
    );

    hoisted.getAuthSnapshot.mockResolvedValue(complete);
    act(() => hoisted.listener.current?.('MFA_CHALLENGE_VERIFIED'));
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('autenticado'));
  });

  it('si la validación con el servidor falla (sin sesión) → anónimo', async () => {
    hoisted.getAuthSnapshot.mockResolvedValue(anonymous);
    mountProvider();
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('anonimo'));
  });
});
