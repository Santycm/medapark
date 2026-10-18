import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/auth', () => ({
  signInAdmin: vi.fn(),
  createChallenge: vi.fn().mockResolvedValue({ ok: true, data: { challengeId: 'c1' } }),
  verifyCode: vi.fn(),
  startTotpEnrollment: vi.fn().mockResolvedValue({ ok: false, code: 'red', message: 'x' }),
  getVerifiedTotpFactor: vi.fn().mockResolvedValue({ id: 'f1' }),
  getCurrentUser: vi.fn(),
  signOutLocal: vi.fn(),
}));

vi.mock('../services/adminParking', () => ({
  getMyParkingLot: vi.fn().mockResolvedValue({ ok: true, data: null }),
}));

import { renderWithAuth } from '../test/renderWithAuth';
import AppRouter from './index';

beforeEach(() => {
  vi.clearAllMocks();
});

const at = (route: string, stage: 'anonimo' | 'requiere_verificacion' | 'requiere_enrolamiento' | 'autenticado') =>
  renderWithAuth(<AppRouter />, {
    route,
    auth: { stage, user: stage === 'anonimo' ? null : { id: 'u1', email: 'admin@medapark.co' } },
  });

describe('AppRouter', () => {
  it('/login redirige a /admin/login', async () => {
    at('/login', 'anonimo');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('/admin sin sesión redirige al login', async () => {
    at('/admin', 'anonimo');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('/verify-mfa redirige a la verificación cuando el stage lo exige', async () => {
    at('/verify-mfa', 'requiere_verificacion');
    expect(await screen.findByRole('heading', { name: 'Verificación en dos pasos' })).toBeInTheDocument();
  });

  it('/admin/mfa/configurar con enrolamiento pendiente muestra la configuración', async () => {
    at('/admin/mfa/configurar', 'requiere_enrolamiento');
    expect(
      await screen.findByRole('heading', { name: 'Configurar verificación en dos pasos' }),
    ).toBeInTheDocument();
  });

  it('/admin con aal2 muestra el panel dentro del layout de administración', async () => {
    at('/admin', 'autenticado');
    expect(
      await screen.findByRole('heading', { name: 'Aún no has registrado tu parqueadero' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Menú de administración' })).toBeInTheDocument();
    expect(screen.getByText('admin@medapark.co')).toBeInTheDocument();
  });

  it('una ruta inexistente de /admin muestra "Página no encontrada" con enlace al panel', async () => {
    at('/admin/no-existe', 'autenticado');
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al panel' })).toHaveAttribute('href', '/admin');
  });

  it('una ruta pública inexistente enlaza al inicio', async () => {
    at('/nada', 'anonimo');
    expect(await screen.findByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });
});
