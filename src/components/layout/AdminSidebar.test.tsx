import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { MyParkingContext, type MyParkingState } from '../../context/myParkingContext';
import { makeLot } from '../../test/fixtures';
import AdminSidebar from './AdminSidebar';

const show = (state: MyParkingState) =>
  render(
    <MyParkingContext.Provider value={{ ...state, reload: vi.fn(), applyOccupancy: vi.fn() }}>
      <MemoryRouter initialEntries={['/admin']}>
        <AdminSidebar />
      </MemoryRouter>
    </MyParkingContext.Provider>,
  );

describe('AdminSidebar', () => {
  it('sin parqueadero solo muestra "Mi parqueadero"', () => {
    show({ state: 'sin_parqueadero' });
    expect(screen.getByRole('link', { name: 'Mi parqueadero' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gestionar ocupación' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Configurar celdas' })).not.toBeInTheDocument();
  });

  it('con parqueadero muestra los tres ítems', () => {
    show({ state: 'con_parqueadero', parking: makeLot() });
    expect(screen.getByRole('link', { name: 'Gestionar ocupación' })).toHaveAttribute('href', '/admin/ocupacion');
    expect(screen.getByRole('link', { name: 'Configurar celdas' })).toHaveAttribute('href', '/admin/parqueadero/celdas');
  });

  it('mientras carga solo muestra el ítem principal', () => {
    show({ state: 'cargando' });
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
