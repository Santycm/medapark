import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/auth', () => ({
  createChallenge: vi.fn(),
  verifyCode: vi.fn(),
  getVerifiedTotpFactor: vi.fn(),
}));

import { getFailures } from '../../domain/mfaAttempts';
import { MSG } from '../../lib/messages';
import { createChallenge, getVerifiedTotpFactor, verifyCode } from '../../services/auth';
import { renderWithAuth } from '../../test/renderWithAuth';
import VerifyMfa from './VerifyMfa';

const mockedChallenge = vi.mocked(createChallenge);
const mockedVerify = vi.mocked(verifyCode);

const Where = () => {
  const location = useLocation();
  return <p data-testid="where">{location.pathname}</p>;
};

const setup = () =>
  renderWithAuth(
    <Routes>
      <Route path="/admin/mfa/verificar" element={<VerifyMfa />} />
      <Route path="*" element={<Where />} />
    </Routes>,
    {
      route: '/admin/mfa/verificar',
      auth: { stage: 'requiere_verificacion', user: { id: 'u1', email: 'a@b.co' } },
    },
  );

const enter = async (code: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Código de verificación'), code);
  await user.click(screen.getByRole('button', { name: 'Verificar código' }));
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getVerifiedTotpFactor).mockResolvedValue({ id: 'f1' } as never);
  mockedChallenge.mockResolvedValue({ ok: true, data: { challengeId: 'c1' } });
});

describe('VerifyMfa', () => {
  it('crea el challenge al montar y no ofrece reenviar', async () => {
    setup();
    await waitFor(() => expect(mockedChallenge).toHaveBeenCalledWith('f1'));
    expect(screen.getByText(MSG.mfa.ayudaCodigoNuevo)).toBeInTheDocument();
    expect(screen.queryByText(/Reenviar código/i)).not.toBeInTheDocument();
  });

  it('el botón está deshabilitado con menos de 6 dígitos', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText('Código de verificación'), '123');
    expect(screen.getByRole('button', { name: 'Verificar código' })).toBeDisabled();
  });

  it('código incorrecto → mensaje, limpia y suma un fallo', async () => {
    mockedVerify.mockResolvedValue({
      ok: false,
      code: 'codigo_incorrecto',
      message: MSG.mfa.incorrecto,
    });
    setup();
    await waitFor(() => expect(mockedChallenge).toHaveBeenCalled());
    await enter('000000');

    expect(await screen.findByText(MSG.mfa.incorrecto)).toBeInTheDocument();
    expect(screen.getByLabelText('Código de verificación')).toHaveValue('');
    expect(getFailures('u1')).toBe(1);
  });

  it('código expirado → mensaje, nuevo challenge y sin sumar fallo', async () => {
    mockedVerify.mockResolvedValue({
      ok: false,
      code: 'codigo_expirado',
      message: MSG.mfa.expirado,
    });
    setup();
    await waitFor(() => expect(mockedChallenge).toHaveBeenCalledTimes(1));
    const before = mockedChallenge.mock.calls.length;
    await enter('000000');

    expect(await screen.findByText(MSG.mfa.expirado)).toBeInTheDocument();
    await waitFor(() => expect(mockedChallenge.mock.calls.length).toBeGreaterThan(before));
    expect(getFailures('u1')).toBe(0);
  });

  it('el 5.º fallo cierra sesión y vuelve a login', async () => {
    sessionStorage.setItem('medapark:mfa-fallos:u1', '4');
    mockedVerify.mockResolvedValue({
      ok: false,
      code: 'codigo_incorrecto',
      message: MSG.mfa.incorrecto,
    });
    const { auth } = setup();
    await waitFor(() => expect(mockedChallenge).toHaveBeenCalled());
    await enter('000000');

    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    expect(await screen.findByTestId('where')).toHaveTextContent('/admin/login');
    expect(getFailures('u1')).toBe(0);
  });

  it('"Volver al inicio de sesión" cierra sesión', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.click(screen.getByRole('button', { name: 'Volver al inicio de sesión' }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    expect(await screen.findByTestId('where')).toHaveTextContent('/admin/login');
  });

  it('éxito → refresh y /admin', async () => {
    mockedVerify.mockResolvedValue({ ok: true, data: undefined });
    const { auth } = setup();
    await waitFor(() => expect(mockedChallenge).toHaveBeenCalled());
    await enter('123456');

    await waitFor(() => expect(auth.refresh).toHaveBeenCalled());
    expect(await screen.findByTestId('where')).toHaveTextContent('/admin');
  });
});
