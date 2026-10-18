import { describe, expect, it } from 'vitest';
import { MSG } from '../lib/messages';
import { toParkingErrorCode, toParkingMessage, type ParkingErrorCode } from './parkingErrors';

describe('toParkingErrorCode', () => {
  it.each([
    [{ code: '23505' }, 'YA_EXISTE'],
    [{ code: '23514', message: 'violates check constraint "parking_vehicle_configs_check"' }, 'CAPACIDAD_MENOR_A_OCUPADAS'],
    [{ code: '23514', message: 'violates check constraint "otro"' }, 'DATOS_INVALIDOS'],
    [{ code: '23514' }, 'DATOS_INVALIDOS'],
    [{ code: '22P02' }, 'DATOS_INVALIDOS'],
    [{ code: '22003' }, 'DATOS_INVALIDOS'],
    [{ code: '42501' }, 'PERMISO_DENEGADO'],
    [{ message: 'No se pudo registrar el ingreso: configuración inexistente, ajena o sin capacidad disponible.' }, 'SIN_DISPONIBLES'],
    [{ message: 'No se pudo registrar la salida: configuración inexistente, ajena o sin celdas ocupadas.' }, 'SIN_OCUPADAS'],
    [{ message: 'Se requiere una sesión autenticada con MFA.' }, 'SESION'],
    [{ status: 401 }, 'SESION'],
    [{ code: 'PGRST301' }, 'SESION'],
    [{ code: 'algo' }, 'RED'],
    [null, 'RED'],
    ['texto', 'RED'],
  ] as const)('%j → %s', (error, expected) => {
    expect(toParkingErrorCode(error)).toBe(expected);
  });
});

describe('toParkingMessage', () => {
  it.each<[ParkingErrorCode, string]>([
    ['YA_EXISTE', MSG.parqueadero.yaExiste],
    ['CAPACIDAD_MENOR_A_OCUPADAS', MSG.celdas.reducir],
    ['DATOS_INVALIDOS', MSG.parqueadero.datosInvalidos],
    ['PERMISO_DENEGADO', MSG.general.permisoDenegado],
    ['SIN_EFECTO', MSG.general.permisoDenegado],
    ['SIN_DISPONIBLES', MSG.ocupacion.sinDisponibles],
    ['SIN_OCUPADAS', MSG.ocupacion.sinOcupadas],
    ['SESION', ''],
    ['SIN_TIPOS', MSG.parqueadero.requeridos],
    ['TIPO_CON_CELDAS', MSG.parqueadero.quitarTipo],
    ['CAPACIDAD_NUEVO_TIPO', MSG.parqueadero.capacidadNueva],
    ['REGISTRO_INCOMPLETO', MSG.parqueadero.registroIncompleto],
    ['GUARDADO_PARCIAL', MSG.parqueadero.guardadoParcial],
    ['RED', MSG.general.red],
  ])('%s', (code, message) => {
    expect(toParkingMessage(code)).toBe(message);
  });
});
