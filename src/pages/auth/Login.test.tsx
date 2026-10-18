import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/auth', () => ({ signInAdmin: vi.fn() }));

import { signInAdmin } from '../../services/auth';
import { MSG } from '../../lib/messages';
import { renderWithAuth } from '../../test/renderWithAuth';
import Login from './Login';

const mockedSignIn = vi.mocked(signInAdmin);

beforeEach(() => {
  vi.resetAllMocks();
});

const setup = (route: string | { pathname: string; state: unknown } = '/admin/login') =>
  renderWithAuth(<Login />, { route });

describe('Login', () => {
  it('vacío → errores por campo y resumen, sin llamar al servicio', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText(MSG.login.correoObligatorio)).toBeInTheDocument();
    expect(screen.getByText(MSG.login.contrasenaObligatoria)).toBeInTheDocument();
    expect(screen.getByText(MSG.login.requeridos)).toBeInTheDocument();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it('formato inválido → "Verificar correo electrónico" sin el resumen de requeridos', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/Correo electrónico/), 'admin@dominio');
    await user.type(screen.getByLabelText(/Contraseña/), 'clave');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText(MSG.login.correoFormato)).toBeInTheDocument();
    expect(screen.queryByText(MSG.login.requeridos)).not.toBeInTheDocument();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it('credenciales inválidas → mensaje literal y contraseña limpia', async () => {
    const user = userEvent.setup();
    mockedSignIn.mockResolvedValue({
      ok: false,
      code: 'credenciales_invalidas',
      message: MSG.login.credenciales,
    });
    setup();
    await user.type(screen.getByLabelText(/Correo electrónico/), 'admin@medapark.co');
    await user.type(screen.getByLabelText(/Contraseña/), 'mala');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText(MSG.login.credenciales)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toHaveValue('');
  });

  it('deshabilita el botón durante la carga: doble clic = 1 llamada', async () => {
    const user = userEvent.setup();
    let resolve!: (value: Awaited<ReturnType<typeof signInAdmin>>) => void;
    mockedSignIn.mockReturnValue(new Promise((r) => (resolve = r)));
    const { auth } = setup();
    auth.refresh = vi.fn().mockResolvedValue('requiere_verificacion');

    await user.type(screen.getByLabelText(/Correo electrónico/), 'admin@medapark.co');
    await user.type(screen.getByLabelText(/Contraseña/), 'clave');
    const button = screen.getByRole('button', { name: 'Ingresar' });
    await user.dblClick(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    resolve({ ok: false, code: 'red', message: MSG.general.red });
  });

  it('el ojo muestra y oculta la contraseña', async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByLabelText(/Contraseña/);
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('muestra el aviso de location.state.notice', () => {
    setup({ pathname: '/admin/login', state: { notice: MSG.mfa.demasiadosIntentos } });
    expect(screen.getByText(MSG.mfa.demasiadosIntentos)).toBeInTheDocument();
  });

  it('no ofrece registro ni recuperar contraseña', () => {
    setup();
    expect(screen.queryByText(/Registrarse/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/¿Olvidaste tu contraseña\?/)).not.toBeInTheDocument();
  });
});
