import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

vi.mock('../services/auth', () => ({
  signInAdmin: vi.fn(),
  createChallenge: vi.fn(),
  verifyCode: vi.fn(),
  startTotpEnrollment: vi.fn().mockResolvedValue({ ok: false, code: 'red', message: 'x' }),
  getVerifiedTotpFactor: vi.fn().mockResolvedValue(null),
}));

import LogoutDialog from '../components/auth/LogoutDialog';
import AdminLayout from '../components/layout/AdminLayout';
import AuthLayout from '../components/layout/AuthLayout';
import MfaLayout from '../components/layout/MfaLayout';
import PublicLayout from '../components/layout/PublicLayout';
import Login from '../pages/auth/Login';
import MfaEnroll from '../pages/auth/MfaEnroll';
import VerifyMfa from '../pages/auth/VerifyMfa';
import { renderWithAuth } from '../test/renderWithAuth';

const LATENT = ['/forgot-password', '/update-password', '/profile', '/setup-mfa'];

const expectNoLatentLinks = (container: HTMLElement) => {
  const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
  for (const route of LATENT) {
    expect(hrefs).not.toContain(route);
  }
  for (const route of LATENT) {
    expect(container.innerHTML).not.toContain(`href="${route}"`);
  }
};

const auth = { stage: 'autenticado' as const, user: { id: 'u1', email: 'a@b.co' } };

describe('FR-032: rutas latentes sin enlaces desde el MVP', () => {
  it.each([
    ['Login', <Login key="l" />],
    ['VerifyMfa', <VerifyMfa key="v" />],
    ['MfaEnroll', <MfaEnroll key="m" />],
    ['AuthLayout', <AuthLayout key="a" />],
    ['MfaLayout', <MfaLayout key="mf" />],
    ['AdminLayout', <AdminLayout key="ad" />],
    ['PublicLayout', <PublicLayout key="p" />],
    ['LogoutDialog', <LogoutDialog key="d" open onClose={() => {}} />],
  ])('%s', async (_name, element) => {
    const { container } = renderWithAuth(element, { auth });
    await waitFor(() => expect(container.firstChild).not.toBeNull());
    expectNoLatentLinks(container);
  });
});
