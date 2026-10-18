import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ParkingLot } from '../domain/parking';
import { getMyParkingLot } from '../services/adminParking';
import {
  MyParkingContext,
  type MyParkingContextValue,
  type MyParkingState,
} from './myParkingContext';

const MyParkingProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<MyParkingState>({ state: 'cargando' });
  const mounted = useRef(true);

  const load = useCallback(async (): Promise<ParkingLot | null> => {
    const result = await getMyParkingLot();
    let next: MyParkingState;
    let parking: ParkingLot | null = null;

    if (!result.ok) {
      next = { state: 'error', message: result.message };
    } else if (result.data) {
      parking = result.data;
      next = { state: 'con_parqueadero', parking };
    } else {
      next = { state: 'sin_parqueadero' };
    }

    if (mounted.current) setState(next);
    return parking;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  // Recarga silenciosa: conserva los datos actuales (y las pantallas montadas) mientras se lee;
  // solo vuelve a "cargando" si venía de un error, para mostrar el indicador del reintento.
  const reload = useCallback(async () => {
    setState((current) => (current.state === 'error' ? { state: 'cargando' } : current));
    return load();
  }, [load]);

  const applyOccupancy = useCallback((configId: string, occupied: number) => {
    setState((current) => {
      if (current.state !== 'con_parqueadero') return current;
      return {
        state: 'con_parqueadero',
        parking: {
          ...current.parking,
          parking_vehicle_configs: current.parking.parking_vehicle_configs.map((c) =>
            c.id === configId ? { ...c, occupied_spaces: occupied } : c,
          ),
        },
      };
    });
  }, []);

  const value = useMemo<MyParkingContextValue>(
    () => ({ ...state, reload, applyOccupancy }),
    [state, reload, applyOccupancy],
  );

  return <MyParkingContext.Provider value={value}>{children}</MyParkingContext.Provider>;
};

export default MyParkingProvider;
