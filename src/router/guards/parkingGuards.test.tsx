import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeLot, renderWithParking } from '../../test/fixtures';
import type { MyParkingState } from '../../context/myParkingContext';
import RequireNoParking from './RequireNoParking';
import RequireParking from './RequireParking';

const withParking = (Guard: typeof RequireParking, my: MyParkingState, route = '/admin/x') =>
  renderWithParking(
    <Guard />,
    { my, route, path: '/admin/x' },
  );

describe('RequireParking', () => {
  it('muestra el indicador de carga mientras lee', () => {
    withParking(RequireParking, { state: 'cargando' });
    expect(screen.getByText('Cargando MedaPark')).toBeInTheDocument();
  });

  it('con error muestra el mensaje y "Reintentar"', async () => {
    const user = userEvent.setup();
    const { my } = withParking(RequireParking, { state: 'error', message: 'No hay conexión' });
    expect(screen.getByText('No hay conexión')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(my.reload).toHaveBeenCalledTimes(1);
  });

  it('sin parqueadero redirige a /admin', () => {
    withParking(RequireParking, { state: 'sin_parqueadero' });
    expect(screen.getByTestId('where')).toHaveTextContent('/admin');
  });

  it('con parqueadero deja pasar', () => {
    const { container } = withParking(RequireParking, { state: 'con_parqueadero', parking: makeLot() });
    expect(screen.queryByTestId('where')).not.toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });
});

describe('RequireNoParking', () => {
  it('carga y error', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    const { unmount } = withParking(RequireNoParking, { state: 'cargando' });
    expect(screen.getByText('Cargando MedaPark')).toBeInTheDocument();
    unmount();

    renderWithParking(<RequireNoParking />, {
      my: { state: 'error', message: 'Falló' },
      path: '/admin/x',
      myOverrides: { reload },
    });
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reload).toHaveBeenCalled();
  });

  it('con parqueadero redirige a /admin', () => {
    withParking(RequireNoParking, { state: 'con_parqueadero', parking: makeLot() });
    expect(screen.getByTestId('where')).toHaveTextContent('/admin');
  });

  it('sin parqueadero deja pasar', () => {
    withParking(RequireNoParking, { state: 'sin_parqueadero' });
    expect(screen.queryByTestId('where')).not.toBeInTheDocument();
  });
});
