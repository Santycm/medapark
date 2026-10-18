import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MyParkingContext, type MyParkingState } from '../../context/myParkingContext';
import { MSG } from '../../lib/messages';
import { makeConfig, makeLot, renderWithParking } from '../../test/fixtures';
import Panel from './Panel';

const show = (my: MyParkingState, route = '/admin') => renderWithParking(<Panel />, { my, route, path: '/admin' });
const withLot = (overrides = {}) => show({ state: 'con_parqueadero', parking: makeLot(overrides) });

afterEach(() => {
  vi.useRealTimers();
});

describe('Panel sin parqueadero', () => {
  it('solo ofrece "Registrar parqueadero"', () => {
    show({ state: 'sin_parqueadero' });
    expect(screen.getByRole('heading', { name: 'Aún no has registrado tu parqueadero' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar parqueadero/ })).toHaveAttribute(
      'href',
      '/admin/parqueadero/registrar',
    );
    expect(screen.queryByText('Gestionar ocupación')).not.toBeInTheDocument();
  });
});

describe('Panel cargando y con error', () => {
  it('muestra el indicador de carga', () => {
    show({ state: 'cargando' });
    expect(screen.getByText('Cargando MedaPark')).toBeInTheDocument();
  });

  it('muestra el error con "Reintentar"', () => {
    show({ state: 'error', message: 'No fue posible conectar' });
    expect(screen.getByText('No fue posible conectar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});

describe('Panel con parqueadero', () => {
  it('muestra los datos, tarifas y disponibilidad por tipo', () => {
    withLot();
    expect(screen.getByRole('heading', { name: 'Mi parqueadero' })).toBeInTheDocument();
    expect(screen.getByText('Parqueadero Centro')).toBeInTheDocument();
    expect(screen.getByText('Calle 50 # 45-10, Medellín')).toBeInTheDocument();
    expect(screen.getByText('Latitud: 6.2442')).toBeInTheDocument();
    expect(screen.getByText('Automóviles: $ 5.000')).toBeInTheDocument();
    expect(screen.getByText('Motocicletas: $ 2.000')).toBeInTheDocument();
    expect(screen.getByText('Automóviles: 15 disponibles / 20')).toBeInTheDocument();
    expect(screen.getByText('Motocicletas: 8 disponibles / 10')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.queryByText(MSG.parqueadero.avisoInactivo)).not.toBeInTheDocument();
  });

  it('sin correo muestra "No registrado"', () => {
    withLot({ contact_email: null });
    expect(screen.getByText(MSG.parqueadero.correoNoRegistrado)).toBeInTheDocument();
  });

  it('solo motos → no muestra automóviles en la disponibilidad', () => {
    withLot({ parking_vehicle_configs: [makeConfig('MOTORCYCLE', { total: 10, occupied: 2 })] });
    expect(screen.queryByText(/Automóviles: \d+ disponibles/)).not.toBeInTheDocument();
    expect(screen.getByText('Motocicletas: 8 disponibles / 10')).toBeInTheDocument();
  });

  it('inactivo → aviso de inactivo y badge "Inactivo"', () => {
    withLot({ status: false });
    expect(screen.getByText(MSG.parqueadero.avisoInactivo)).toBeInTheDocument();
    expect(screen.getAllByText('Inactivo').length).toBeGreaterThan(0);
  });

  it('capacidad total 0 → aviso y "Gestionar ocupación" deshabilitado con su nota', () => {
    withLot({
      parking_vehicle_configs: [makeConfig('CAR', { total: 0, occupied: 0 }), makeConfig('MOTORCYCLE', { total: 0, occupied: 0 })],
    });
    expect(screen.getByText(MSG.parqueadero.avisoSinCeldas)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gestionar ocupación' })).toBeDisabled();
    expect(screen.getByText(MSG.ocupacion.sinCapacidad)).toBeInTheDocument();
  });

  it('sin tipos → aviso, y celdas y ocupación deshabilitadas; editar sigue activo', () => {
    withLot({ parking_vehicle_configs: [] });
    expect(screen.getAllByText(MSG.parqueadero.avisoSinTipos).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Gestionar ocupación' })).toBeDisabled();
    expect(screen.getAllByRole('link', { name: /Editar información/ })[0]).toHaveAttribute(
      'href',
      '/admin/parqueadero/editar',
    );
  });
});

describe('flash', () => {
  const renderWithFlash = () =>
    render(
      <MyParkingContext.Provider
        value={{
          state: 'con_parqueadero',
          parking: makeLot(),
          reload: vi.fn(),
          applyOccupancy: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={[{ pathname: '/admin', state: { flash: MSG.parqueadero.registrado } }]}>
          <Routes>
            <Route path="/admin" element={<Panel />} />
          </Routes>
        </MemoryRouter>
      </MyParkingContext.Provider>,
    );

  it('se muestra y se oculta a los 5 segundos', () => {
    vi.useFakeTimers();
    renderWithFlash();
    expect(screen.getByText(MSG.parqueadero.registrado)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.queryByText(MSG.parqueadero.registrado)).not.toBeInTheDocument();
  });
});
