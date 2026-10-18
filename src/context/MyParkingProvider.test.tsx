import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/adminParking', () => ({ getMyParkingLot: vi.fn() }));

import { useMyParking } from '../hooks/useMyParking';
import { getMyParkingLot } from '../services/adminParking';
import { makeLot } from '../test/fixtures';
import MyParkingProvider from './MyParkingProvider';

const mocked = vi.mocked(getMyParkingLot);

const mount = () => renderHook(() => useMyParking(), { wrapper: MyParkingProvider });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('MyParkingProvider', () => {
  it('sin parqueadero', async () => {
    mocked.mockResolvedValue({ ok: true, data: null });
    const { result } = mount();
    expect(result.current.state).toBe('cargando');
    await waitFor(() => expect(result.current.state).toBe('sin_parqueadero'));
  });

  it('con parqueadero', async () => {
    mocked.mockResolvedValue({ ok: true, data: makeLot() });
    const { result } = mount();
    await waitFor(() => expect(result.current.state).toBe('con_parqueadero'));
  });

  it('error y reintento', async () => {
    mocked.mockResolvedValueOnce({ ok: false, code: 'RED', message: 'sin red' });
    const { result } = mount();
    await waitFor(() => expect(result.current.state).toBe('error'));

    mocked.mockResolvedValueOnce({ ok: true, data: makeLot() });
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.state).toBe('con_parqueadero');
  });

  it('applyOccupancy actualiza las ocupadas sin recargar', async () => {
    mocked.mockResolvedValue({ ok: true, data: makeLot() });
    const { result } = mount();
    await waitFor(() => expect(result.current.state).toBe('con_parqueadero'));

    act(() => result.current.applyOccupancy('car', 9));

    const state = result.current;
    if (state.state !== 'con_parqueadero') throw new Error('estado inesperado');
    expect(state.parking.parking_vehicle_configs.find((c) => c.id === 'car')?.occupied_spaces).toBe(9);
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it('reload devuelve el parqueadero leído y conserva los datos mientras recarga', async () => {
    mocked.mockResolvedValue({ ok: true, data: makeLot() });
    const { result } = mount();
    await waitFor(() => expect(result.current.state).toBe('con_parqueadero'));

    let lot: unknown;
    await act(async () => {
      lot = await result.current.reload();
    });
    expect(lot).toMatchObject({ name: 'Parqueadero Centro' });
    expect(result.current.state).toBe('con_parqueadero');
  });
});
