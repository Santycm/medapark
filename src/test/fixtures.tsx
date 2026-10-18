import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, type InitialEntry } from 'react-router';
import { AuthContext } from '../context/authContext';
import { MyParkingContext, type MyParkingContextValue, type MyParkingState } from '../context/myParkingContext';
import type { ParkingLot, VehicleConfig, VehicleType } from '../domain/parking';
import { makeAuth } from './renderWithAuth';
import Where from './Where';

export const makeConfig = (
  type: VehicleType,
  o: { total?: number; occupied?: number; rate?: number; id?: string } = {},
): VehicleConfig => ({
  id: o.id ?? type.toLowerCase(),
  parking_lot_id: 'lot1',
  vehicle_type: type,
  hourly_rate: o.rate ?? (type === 'CAR' ? 5000 : 2000),
  total_spaces: o.total ?? 20,
  occupied_spaces: o.occupied ?? 5,
  created_at: '',
  updated_at: '2026-10-17T00:00:00Z',
});

export const makeLot = (o: Partial<ParkingLot> = {}): ParkingLot => ({
  id: 'lot1',
  admin_id: 'u1',
  name: 'Parqueadero Centro',
  status: true,
  address: 'Calle 50 # 45-10, Medellín',
  latitude: 6.2442,
  longitude: -75.5812,
  phone: '3001234567',
  contact_email: 'contacto@dominio.com',
  opening_hours: 'Lunes a Domingo, 6:00 a.m. - 10:00 p.m.',
  created_at: '',
  updated_at: '2026-10-17T00:00:00Z',
  parking_vehicle_configs: [makeConfig('CAR'), makeConfig('MOTORCYCLE', { total: 10, occupied: 2 })],
  ...o,
});


type Options = {
  /** Ruta donde se monta la pantalla (por defecto `/admin`). */
  path?: string;
  route?: InitialEntry;
  my?: MyParkingState;
  myOverrides?: Partial<MyParkingContextValue>;
};

/** Renderiza con sesión aal2 simulada y el estado del parqueadero indicado. */
export function renderWithParking(ui: ReactElement, options: Options = {}) {
  const my: MyParkingContextValue = {
    ...(options.my ?? { state: 'con_parqueadero', parking: makeLot() }),
    reload: vi.fn().mockResolvedValue(null),
    applyOccupancy: vi.fn(),
    ...options.myOverrides,
  } as MyParkingContextValue;
  const auth = makeAuth({ stage: 'autenticado', user: { id: 'u1', email: 'admin@medapark.co' } });

  const utils = render(
    <AuthContext.Provider value={auth}>
      <MyParkingContext.Provider value={my}>
        <MemoryRouter initialEntries={[options.route ?? options.path ?? '/admin']}>
          <Routes>
            <Route path={options.path ?? '/admin'} element={ui} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </MyParkingContext.Provider>
    </AuthContext.Provider>,
  );
  return { my, auth, ...utils };
}
