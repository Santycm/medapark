import { beforeEach, describe, expect, it, vi } from 'vitest';

type Reply = { data?: unknown; error?: unknown };

const db = vi.hoisted(() => ({
  calls: [] as string[],
  inserted: [] as { table: string; payload: unknown }[],
  updated: [] as { table: string; payload: unknown; id?: unknown }[],
  replies: [] as Reply[],
  readReply: { data: null, error: null } as Reply,
  rpcReply: { data: 0, error: null } as Reply,
  handleSessionError: vi.fn(),
}));

vi.mock('../context/authContext', () => ({ handleSessionError: db.handleSessionError }));

vi.mock('../lib/supabase', () => {
  const next = () => db.replies.shift() ?? { data: [{ id: 'x' }], error: null };
  const from = (table: string) => {
    const state: { op: string; payload?: unknown } = { op: 'select' };
    const builder: Record<string, unknown> = {};
    builder.select = () => {
      if (state.op === 'select' || state.op === 'insert') return builder;
      return Promise.resolve(next());
    };
    builder.single = () => {
      db.calls.push(`${table}.insert`);
      return Promise.resolve(next());
    };
    builder.maybeSingle = () => Promise.resolve(db.readReply);
    builder.insert = (payload: unknown) => {
      state.op = 'insert';
      db.inserted.push({ table, payload });
      if (table === 'parking_vehicle_configs') {
        db.calls.push(`${table}.insert`);
        return Promise.resolve(next());
      }
      return builder;
    };
    builder.update = (payload: unknown) => {
      state.op = 'update';
      state.payload = payload;
      return builder;
    };
    builder.delete = () => {
      state.op = 'delete';
      return builder;
    };
    builder.eq = (_column: string, id: unknown) => {
      db.calls.push(`${table}.${state.op}`);
      if (state.op === 'update') db.updated.push({ table, payload: state.payload, id });
      return builder;
    };
    return builder;
  };
  return { supabase: { from, rpc: () => Promise.resolve(db.rpcReply) } };
});

import { MSG } from '../lib/messages';
import {
  configureSpaces,
  getMyParkingLot,
  registerEntry,
  registerExit,
  registerParkingLot,
  updateParkingLot,
} from './adminParking';

const cfg = (type: string, total: number, occupied = 0, id = type.toLowerCase()) => ({
  id,
  parking_lot_id: 'lot',
  vehicle_type: type,
  hourly_rate: 5000,
  total_spaces: total,
  occupied_spaces: occupied,
  created_at: '',
  updated_at: '',
});

const lotRow = (configs: unknown[]) => ({
  id: 'lot',
  admin_id: 'u1',
  name: 'Centro',
  status: true,
  address: 'Calle 50',
  latitude: 6.2442,
  longitude: -75.5812,
  phone: '3001234567',
  contact_email: null,
  opening_hours: '24h',
  created_at: '',
  updated_at: '',
  parking_vehicle_configs: configs,
});

const baseInput = {
  name: 'Centro',
  address: 'Calle 50 # 45-10',
  latitude: 6.2442,
  longitude: -75.5812,
  phone: '3001234567',
  contact_email: null,
  opening_hours: '24 horas',
};

beforeEach(() => {
  db.calls.length = 0;
  db.inserted.length = 0;
  db.updated.length = 0;
  db.replies.length = 0;
  db.readReply = { data: null, error: null };
  db.rpcReply = { data: 0, error: null };
  db.handleSessionError.mockReset();
});

describe('getMyParkingLot', () => {
  it('data null → sin parqueadero (no es un error)', async () => {
    expect(await getMyParkingLot()).toEqual({ ok: true, data: null });
  });

  it('ordena las configuraciones con CAR primero', async () => {
    db.readReply = { data: lotRow([cfg('MOTORCYCLE', 3), cfg('CAR', 4)]), error: null };
    const result = await getMyParkingLot();
    expect(result.ok && result.data?.parking_vehicle_configs.map((c) => c.vehicle_type)).toEqual(['CAR', 'MOTORCYCLE']);
  });

  it('un error de sesión cierra la sesión local', async () => {
    db.readReply = { data: null, error: { status: 401 } };
    const result = await getMyParkingLot();
    expect(result).toMatchObject({ ok: false, code: 'SESION' });
    expect(db.handleSessionError).toHaveBeenCalled();
  });

  it('42501 → permiso denegado', async () => {
    db.readReply = { data: null, error: { code: '42501' } };
    expect(await getMyParkingLot()).toMatchObject({ ok: false, code: 'PERMISO_DENEGADO', message: MSG.general.permisoDenegado });
  });
});

describe('registerParkingLot', () => {
  const input = {
    ...baseInput,
    contact_email: '',
    configs: [{ vehicle_type: 'CAR' as const, hourly_rate: 5000, total_spaces: 2 }],
  };

  it('envía admin_id y contact_email null si está vacío, y luego los tipos', async () => {
    db.replies.push({ data: { id: 'lot1' }, error: null }, { error: null });
    const result = await registerParkingLot('user-1', input);

    expect(result).toEqual({ ok: true, data: { id: 'lot1' } });
    expect(db.inserted[0].payload).toMatchObject({ admin_id: 'user-1', contact_email: null, status: true });
    expect(db.inserted[1]).toMatchObject({
      table: 'parking_vehicle_configs',
      payload: [{ parking_lot_id: 'lot1', vehicle_type: 'CAR', hourly_rate: 5000, total_spaces: 2 }],
    });
  });

  it('23505 → yaExiste', async () => {
    db.replies.push({ data: null, error: { code: '23505' } });
    expect(await registerParkingLot('u', input)).toMatchObject({ ok: false, code: 'YA_EXISTE', message: MSG.parqueadero.yaExiste });
  });

  it('si el paso 2 falla → registroIncompleto', async () => {
    db.replies.push({ data: { id: 'lot1' }, error: null }, { error: { code: '42501' } });
    expect(await registerParkingLot('u', input)).toMatchObject({ ok: false, code: 'REGISTRO_INCOMPLETO', message: MSG.parqueadero.registroIncompleto });
  });
});

describe('updateParkingLot', () => {
  const desired = (cars: number, motos?: number) => ({
    ...baseInput,
    status: true,
    configs: [
      { vehicle_type: 'CAR' as const, hourly_rate: 6000, total_spaces: cars },
      ...(motos === undefined ? [] : [{ vehicle_type: 'MOTORCYCLE' as const, hourly_rate: 2000, total_spaces: motos }]),
    ],
  });

  it('no escribe nada si la validación previa falla', async () => {
    db.readReply = { data: lotRow([cfg('CAR', 10, 6)]), error: null };
    const result = await updateParkingLot(desired(5));
    expect(result).toMatchObject({ ok: false, code: 'CAPACIDAD_MENOR_A_OCUPADAS', vehicleType: 'CAR' });
    expect(db.calls).toEqual([]);
  });

  it('respeta el orden update → delete → insert → update del parqueadero', async () => {
    db.readReply = { data: lotRow([cfg('CAR', 5), cfg('MOTORCYCLE', 0)]), error: null };
    const result = await updateParkingLot({ ...desired(8), configs: [{ vehicle_type: 'CAR', hourly_rate: 6000, total_spaces: 8 }] });
    expect(result.ok).toBe(true);
    expect(db.calls).toEqual([
      'parking_vehicle_configs.update',
      'parking_vehicle_configs.delete',
      'parking_lots.update',
    ]);

    db.calls.length = 0;
    db.readReply = { data: lotRow([cfg('CAR', 5)]), error: null };
    await updateParkingLot(desired(5, 2));
    expect(db.calls).toEqual([
      'parking_vehicle_configs.update',
      'parking_vehicle_configs.insert',
      'parking_lots.update',
    ]);
  });

  it('un delete que devuelve [] → quitarTipo', async () => {
    db.readReply = { data: lotRow([cfg('CAR', 5), cfg('MOTORCYCLE', 0)]), error: null };
    db.replies.push({ data: [{ id: 'car' }], error: null }, { data: [], error: null });
    const result = await updateParkingLot({ ...desired(5), configs: [{ vehicle_type: 'CAR', hourly_rate: 6000, total_spaces: 5 }] });
    expect(result).toMatchObject({ ok: false, code: 'GUARDADO_PARCIAL' });
  });

  it('el primer fallo sin escrituras previas devuelve el error propio', async () => {
    db.readReply = { data: lotRow([cfg('CAR', 5)]), error: null };
    db.replies.push({ data: [], error: null });
    expect(await updateParkingLot(desired(5))).toMatchObject({ ok: false, code: 'PERMISO_DENEGADO' });
  });

  it('un fallo posterior al primer paso → guardadoParcial', async () => {
    db.readReply = { data: lotRow([cfg('CAR', 5)]), error: null };
    db.replies.push({ data: [{ id: 'car' }], error: null }, { data: [], error: null });
    const result = await updateParkingLot(desired(5));
    expect(result).toMatchObject({ ok: false, code: 'GUARDADO_PARCIAL', message: MSG.parqueadero.guardadoParcial });
  });

  it('sin parqueadero → datos inválidos', async () => {
    expect(await updateParkingLot(desired(5))).toMatchObject({ ok: false, code: 'DATOS_INVALIDOS' });
  });

  it('propaga el error de lectura', async () => {
    db.readReply = { data: null, error: { code: '42501' } };
    expect(await updateParkingLot(desired(5))).toMatchObject({ ok: false, code: 'PERMISO_DENEGADO' });
  });
});

describe('configureSpaces', () => {
  it('valida contra las ocupadas antes de escribir', async () => {
    db.readReply = { data: lotRow([cfg('CAR', 10, 6, 'c1')]), error: null };
    const result = await configureSpaces([{ config_id: 'c1', total_spaces: 5 }]);
    expect(result).toMatchObject({ ok: false, code: 'CAPACIDAD_MENOR_A_OCUPADAS', message: MSG.celdas.reducir });
    expect(db.calls).toEqual([]);
  });

  it('actualiza solo los tipos cambiados', async () => {
    db.readReply = { data: lotRow([cfg('CAR', 10, 2, 'c1'), cfg('MOTORCYCLE', 5, 0, 'm1')]), error: null };
    const result = await configureSpaces([{ config_id: 'c1', total_spaces: 12 }]);
    expect(result.ok).toBe(true);
    expect(db.updated).toEqual([{ table: 'parking_vehicle_configs', payload: { total_spaces: 12 }, id: 'c1' }]);
  });

  it('23514 por concurrencia → reducir; update vacío → permiso denegado', async () => {
    db.readReply = { data: lotRow([cfg('CAR', 10, 2, 'c1')]), error: null };
    db.replies.push({ data: null, error: { code: '23514', message: 'parking_vehicle_configs_check' } });
    expect(await configureSpaces([{ config_id: 'c1', total_spaces: 8 }])).toMatchObject({ ok: false, code: 'CAPACIDAD_MENOR_A_OCUPADAS' });

    db.replies.push({ data: [], error: null });
    expect(await configureSpaces([{ config_id: 'c1', total_spaces: 8 }])).toMatchObject({ ok: false, code: 'PERMISO_DENEGADO' });
  });

  it('un id desconocido o sin parqueadero → datos inválidos', async () => {
    expect(await configureSpaces([{ config_id: 'c1', total_spaces: 1 }])).toMatchObject({ code: 'DATOS_INVALIDOS' });
    db.readReply = { data: lotRow([cfg('CAR', 10, 2, 'c1')]), error: null };
    expect(await configureSpaces([{ config_id: 'zz', total_spaces: 1 }])).toMatchObject({ code: 'DATOS_INVALIDOS' });
  });
});

describe('registerEntry / registerExit', () => {
  it('devuelve el número de ocupadas', async () => {
    db.rpcReply = { data: 7, error: null };
    expect(await registerEntry('c1')).toEqual({ ok: true, data: 7 });
    expect(await registerExit('c1')).toEqual({ ok: true, data: 7 });
  });

  it('mapea los mensajes de las RPC', async () => {
    db.rpcReply = { data: null, error: { message: 'configuración inexistente, ajena o sin capacidad disponible.' } };
    expect(await registerEntry('c1')).toMatchObject({ ok: false, code: 'SIN_DISPONIBLES', message: MSG.ocupacion.sinDisponibles });
    db.rpcReply = { data: null, error: { message: 'configuración inexistente, ajena o sin celdas ocupadas.' } };
    expect(await registerExit('c1')).toMatchObject({ ok: false, code: 'SIN_OCUPADAS', message: MSG.ocupacion.sinOcupadas });
  });
});
