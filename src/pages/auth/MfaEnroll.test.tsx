import { StrictMode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/auth', () => ({
  startTotpEnrollment: vi.fn(),
  createChallenge: vi.fn(),
  verifyCode: vi.fn(),
}));

import { MSG } from '../../lib/messages';
import { createChallenge, startTotpEnrollment, verifyCode } from '../../services/auth';
import { renderWithAuth } from '../../test/renderWithAuth';
import MfaEnroll from './MfaEnroll';

const Where = () => <p data-testid="where">{useLocation().pathname}</p>;

const setup = () =>
  renderWithAuth(
    <StrictMode>
      <Routes>
        <Route path="/admin/mfa/configurar" element={<MfaEnroll />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </StrictMode>,
    { route: '/admin/mfa/configurar', auth: { stage: 'requiere_enrolamiento' } },
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(startTotpEnrollment).mockResolvedValue({
    ok: true,
    data: { factorId: 'f1', qrCodeSvg: 'data:image/svg+xml;base64,AAA', secret: 'ABCDEF' },
  });
});

describe('MfaEnroll', () => {
  it('en StrictMode inicia el enrolamiento una sola vez y muestra QR y clave', async () => {
    setup();
    expect(await screen.findByAltText('Código QR para tu app autenticadora')).toBeInTheDocument();
    expect(screen.getByText('ABCDEF')).toBeInTheDocument();
    expect(startTotpEnrollment).toHaveBeenCalledTimes(1);
  });

  it('código incorrecto → mensaje', async () => {
    const user = userEvent.setup();
    vi.mocked(createChallenge).mockResolvedValue({ ok: true, data: { challengeId: 'c1' } });
    vi.mocked(verifyCode).mockResolvedValue({
      ok: false,
      code: 'codigo_incorrecto',
      message: MSG.mfa.incorrecto,
    });
    setup();
    await screen.findByAltText('Código QR para tu app autenticadora');
    await user.type(screen.getByLabelText('Código de verificación'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verificar código' }));

    expect(await screen.findByText(MSG.mfa.incorrecto)).toBeInTheDocument();
  });

  it('código correcto → challenge, verify, refresh y /admin', async () => {
    const user = userEvent.setup();
    vi.mocked(createChallenge).mockResolvedValue({ ok: true, data: { challengeId: 'c1' } });
    vi.mocked(verifyCode).mockResolvedValue({ ok: true, data: undefined });
    const { auth } = setup();
    await screen.findByAltText('Código QR para tu app autenticadora');
    await user.type(screen.getByLabelText('Código de verificación'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verificar código' }));

    await waitFor(() => expect(auth.refresh).toHaveBeenCalled());
    expect(verifyCode).toHaveBeenCalledWith('f1', 'c1', '123456');
    expect(await screen.findByTestId('where')).toHaveTextContent('/admin');
  });

  it('"Volver al inicio de sesión" cierra sesión', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await screen.findByAltText('Código QR para tu app autenticadora');
    await user.click(screen.getByRole('button', { name: 'Volver al inicio de sesión' }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    expect(await screen.findByTestId('where')).toHaveTextContent('/admin/login');
  });

  it('si falla el enrolamiento ofrece Reintentar', async () => {
    vi.mocked(startTotpEnrollment).mockResolvedValueOnce({
      ok: false,
      code: 'red',
      message: MSG.general.red,
    });
    setup();
    expect(await screen.findByText(MSG.general.red)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
