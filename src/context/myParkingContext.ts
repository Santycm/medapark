import { createContext } from 'react';
import type { ParkingLot } from '../domain/parking';

export type MyParkingState =
  | { state: 'cargando' }
  | { state: 'error'; message: string }
  | { state: 'sin_parqueadero' }
  | { state: 'con_parqueadero'; parking: ParkingLot };

export type MyParkingContextValue = MyParkingState & {
  /** Vuelve a leer el parqueadero del administrador. */
  reload: () => Promise<ParkingLot | null>;
  /** Refleja en el estado el número de ocupadas devuelto por una RPC, sin recargar. */
  applyOccupancy: (configId: string, occupied: number) => void;
};

export const MyParkingContext = createContext<MyParkingContextValue | null>(null);
