import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithAuth } from '../../test/renderWithAuth';
import AdminHeader from './AdminHeader';

describe('AdminHeader', () => {
  it('muestra el correo y el botón abre el diálogo de cierre de sesión', async () => {
    const user = userEvent.setup();
    const onLogoutClick = vi.fn();
    renderWithAuth(<AdminHeader onLogoutClick={onLogoutClick} />, {
      auth: { stage: 'autenticado', user: { id: 'u1', email: 'admin@medapark.co' } },
    });

    expect(screen.getByText('admin@medapark.co')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Cerrar sesión/ }));
    expect(onLogoutClick).toHaveBeenCalledTimes(1);
  });
});
