import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { MSG } from '../../lib/messages';
import { renderWithAuth } from '../../test/renderWithAuth';
import LogoutDialog from './LogoutDialog';

const Where = () => <p data-testid="where">{useLocation().pathname}</p>;

const Harness = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <p data-testid="state">{open ? 'abierto' : 'cerrado'}</p>
      <LogoutDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const setup = () =>
  renderWithAuth(
    <Routes>
      <Route path="/admin" element={<Harness />} />
      <Route path="*" element={<Where />} />
    </Routes>,
    { route: '/admin', auth: { stage: 'autenticado' } },
  );

describe('LogoutDialog', () => {
  it('muestra título y textos de la HU8, con el foco inicial en Cancelar', () => {
    setup();
    expect(screen.getByText(MSG.logout.pregunta)).toBeInTheDocument();
    expect(screen.getByText(MSG.logout.detalle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('Cancelar cierra el diálogo sin cerrar sesión', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByTestId('state')).toHaveTextContent('cerrado');
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('Esc cierra el diálogo sin cerrar sesión', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.keyboard('{Escape}');
    expect(screen.getByTestId('state')).toHaveTextContent('cerrado');
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('clic fuera cierra el diálogo sin cerrar sesión', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    const dialog = screen.getByRole('dialog');
    await user.click(dialog.parentElement!);
    expect(screen.getByTestId('state')).toHaveTextContent('cerrado');
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('"Cerrar sesión" cierra sesión y va a /admin/login', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId('where')).toHaveTextContent('/admin/login');
  });
});
