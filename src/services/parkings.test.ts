import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => ({
  result: { data: null as unknown, error: null as unknown },
  eq: vi.fn(),
}));

vi.mock('../lib/supabase', () => {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.order = () => Promise.resolve(query.result);
  builder.eq = (...args: unknown[]) => {
    query.eq(...args);
    return builder;
  };
  builder.maybeSingle = () => Promise.resolve(query.result);
  return { supabase: { from: () => builder } };
});

import { getPublicParkingById, getPublicParkings } from './parkings';

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: 'Centro',
  latitude: 6.24,
  longitude: -75.58,
  ...overrides,
});

beforeEach(() => {
  query.result = { data: null, error: null };
  query.eq.mockReset();
});

describe('getPublicParkings', () => {
  it('descarta las filas sin id o sin coordenadas', async () => {
    query.result = {
      data: [row(), row({ id: null }), row({ latitude: null }), row({ longitude: null })],
      error: null,
    };
    const result = await getPublicParkings();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('devuelve una lista vacía si no hay datos', async () => {
    expect(await getPublicParkings()).toEqual([]);
  });

  it('lanza el error del servidor', async () => {
    const error = { code: 'x' };
    query.result = { data: null, error };
    await expect(getPublicParkings()).rejects.toBe(error);
  });
});

describe('getPublicParkingById', () => {
  it('filtra por id y devuelve el parqueadero', async () => {
    query.result = { data: row(), error: null };
    expect((await getPublicParkingById('p1'))?.name).toBe('Centro');
    expect(query.eq).toHaveBeenCalledWith('id', 'p1');
  });

  it('devuelve null si no existe o no tiene coordenadas', async () => {
    query.result = { data: null, error: null };
    expect(await getPublicParkingById('zz')).toBeNull();
    query.result = { data: row({ latitude: null }), error: null };
    expect(await getPublicParkingById('p1')).toBeNull();
  });

  it('lanza el error del servidor', async () => {
    const error = { code: 'x' };
    query.result = { data: null, error };
    await expect(getPublicParkingById('p1')).rejects.toBe(error);
  });
});
