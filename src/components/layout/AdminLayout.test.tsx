import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/adminParking', () => ({
  getMyParkingLot: vi.fn().mockResolvedValue({ ok: true, data: null }),
}));

import { renderWithAuth } from '../../test/renderWithAuth';
import AdminLayout from './AdminLayout';

const setup = () =>
  renderWithAuth(
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<p>contenido del panel</p>} />
      </Route>
    </Routes>,
    { route: '/admin', auth: { stage: 'autenticado', user: { id: 'u1', email: 'a@b.co' } } },
  );

describe('AdminLayout', () => {
  it('renderiza el contenido y el menú "Mi parqueadero"', () => {
    setup();
    expect(screen.getByText('contenido del panel')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Mi parqueadero' }).length).toBeGreaterThan(0);
  });

  it('el botón del encabezado abre el diálogo de cierre de sesión y Cancelar lo cierra', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el menú hamburguesa muestra y oculta la barra lateral móvil', async () => {
    const user = userEvent.setup();
    setup();
    const before = screen.getAllByRole('navigation', { name: 'Menú de administración' }).length;

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.getAllByRole('navigation', { name: 'Menú de administración' })).toHaveLength(before + 1);

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.getAllByRole('navigation', { name: 'Menú de administración' })).toHaveLength(before);
  });
});
