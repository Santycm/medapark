import { MSG } from '../lib/messages';

export type ParkingErrorCode =
  | 'YA_EXISTE'
  | 'CAPACIDAD_MENOR_A_OCUPADAS'
  | 'DATOS_INVALIDOS'
  | 'PERMISO_DENEGADO'
  | 'SIN_EFECTO'
  | 'SIN_DISPONIBLES'
  | 'SIN_OCUPADAS'
  | 'SESION'
  | 'RED'
  // Errores de negocio detectados por el front antes de escribir
  | 'SIN_TIPOS'
  | 'TIPO_CON_CELDAS'
  | 'CAPACIDAD_NUEVO_TIPO'
  // Resultados parciales
  | 'REGISTRO_INCOMPLETO'
  | 'GUARDADO_PARCIAL';

type ErrorLike = { code?: unknown; message?: unknown; status?: unknown };

const asErrorLike = (error: unknown): ErrorLike =>
  typeof error === 'object' && error !== null ? (error as ErrorLike) : {};

/** Traduce un error de Supabase/PostgREST (`back-usage.md` §7). */
export function toParkingErrorCode(error: unknown): ParkingErrorCode {
  const { code, message, status } = asErrorLike(error);
  const text = typeof message === 'string' ? message : '';

  if (code === '23505') return 'YA_EXISTE';
  if (code === '23514') {
    return text.includes('parking_vehicle_configs_check') ? 'CAPACIDAD_MENOR_A_OCUPADAS' : 'DATOS_INVALIDOS';
  }
  if (code === '22P02' || code === '22003') return 'DATOS_INVALIDOS';
  if (code === '42501') return 'PERMISO_DENEGADO';
  if (text.includes('sin capacidad disponible')) return 'SIN_DISPONIBLES';
  if (text.includes('sin celdas ocupadas')) return 'SIN_OCUPADAS';
  if (
    text.includes('Se requiere una sesión autenticada con MFA') ||
    status === 401 ||
    code === 'PGRST301'
  ) {
    return 'SESION';
  }
  return 'RED';
}

export function toParkingMessage(code: ParkingErrorCode): string {
  switch (code) {
    case 'YA_EXISTE':
      return MSG.parqueadero.yaExiste;
    case 'CAPACIDAD_MENOR_A_OCUPADAS':
      return MSG.celdas.reducir;
    case 'DATOS_INVALIDOS':
      return MSG.parqueadero.datosInvalidos;
    case 'PERMISO_DENEGADO':
    case 'SIN_EFECTO':
      return MSG.general.permisoDenegado;
    case 'SIN_DISPONIBLES':
      return MSG.ocupacion.sinDisponibles;
    case 'SIN_OCUPADAS':
      return MSG.ocupacion.sinOcupadas;
    case 'SESION':
      return '';
    case 'SIN_TIPOS':
      return MSG.parqueadero.requeridos;
    case 'TIPO_CON_CELDAS':
      return MSG.parqueadero.quitarTipo;
    case 'CAPACIDAD_NUEVO_TIPO':
      return MSG.parqueadero.capacidadNueva;
    case 'REGISTRO_INCOMPLETO':
      return MSG.parqueadero.registroIncompleto;
    case 'GUARDADO_PARCIAL':
      return MSG.parqueadero.guardadoParcial;
    case 'RED':
      return MSG.general.red;
  }
}
