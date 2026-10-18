import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/auth', () => ({
  getCurrentUser: vi.fn(),
  signOutLocal: vi.fn(),
}));

import { useAuth } from '../hooks/useAuth';
import { getCurrentUser, signOutLocal } from '../services/auth';
import { handleSessionError } from './authContext';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('handleSessionError', () => {
  it('con un error de sesión cierra la sesión local, limpia los intentos y devuelve true', async () => {
    sessionStorage.setItem('medapark:mfa-fallos:u1', '3');
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1' } as never);

    await expect(handleSessionError({ code: 'session_not_found' })).resolves.toBe(true);

    expect(signOutLocal).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('medapark:mfa-fallos:u1')).toBeNull();
  });

  it('cierra la sesión aunque no se pueda leer el usuario', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('sin red'));
    await expect(handleSessionError({ status: 401 })).resolves.toBe(true);
    expect(signOutLocal).toHaveBeenCalledTimes(1);
  });

  it('ignora los errores que no son de sesión', async () => {
    await expect(handleSessionError({ code: 'invalid_credentials' })).resolves.toBe(false);
    expect(signOutLocal).not.toHaveBeenCalled();
  });
});

describe('useAuth', () => {
  it('lanza un error claro fuera de <AuthProvider>', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});
