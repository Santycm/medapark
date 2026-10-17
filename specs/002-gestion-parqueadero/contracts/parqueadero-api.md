# Contrato: módulo `src/features/parqueadero` (API TypeScript)

Todas las funciones de `parqueaderoService` devuelven `Result<T>` (mismo tipo que en la 001) y nunca lanzan
excepciones. Si el error es `NO_AUTENTICADO_AAL2` o de sesión, llaman a `handleSessionError` (001) antes de
devolver.

```ts
// src/features/parqueadero/parqueaderoService.ts
import type { Parqueadero, OfertaVehiculo, TipoVehiculo, EstadoParqueadero } from './types';

export type OfertaInput = { tipo: TipoVehiculo; tarifa_hora: number; capacidad_total: number };
export type CapacidadInput = { tipo: TipoVehiculo; capacidad_total: number };

export type ParqueaderoInput = {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono: string;
  correo_contacto: string | null;
  horario_atencion: string;
  ofertas: OfertaInput[];          // 1..2
};

export type ParqueaderoErrorCode =
  | 'PARQUEADERO_YA_EXISTE' | 'PARQUEADERO_NO_EXISTE' | 'SIN_TIPOS' | 'TIPO_CON_CELDAS'
  | 'CAPACIDAD_MENOR_A_OCUPADAS' | 'TIPO_NO_ATENDIDO' | 'SIN_CELDAS_DISPONIBLES'
  | 'SIN_CELDAS_OCUPADAS' | 'DATOS_INVALIDOS' | 'NO_AUTENTICADO_AAL2' | 'RED';

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: ParqueaderoErrorCode; message: string };

/** HU4: lee el parqueadero propio (con ofertas). data = null si no tiene. */
export function obtenerMiParqueadero(): Promise<Result<Parqueadero | null>>;

/** HU3: rpc('registrar_parqueadero', { p_nombre, …, p_ofertas }). */
export function registrarParqueadero(input: ParqueaderoInput): Promise<Result<{ id: string }>>;

/** HU5: rpc('actualizar_parqueadero', { …, p_estado, p_ofertas }). */
export function actualizarParqueadero(
  input: ParqueaderoInput & { estado: EstadoParqueadero },
): Promise<Result<void>>;

/** HU6: rpc('configurar_celdas', { p_capacidades }). */
export function configurarCeldas(capacidades: CapacidadInput[]): Promise<Result<void>>;

/** HU7: rpc('registrar_ingreso' | 'registrar_salida', { p_tipo }) → fila actualizada. */
export function registrarIngreso(tipo: TipoVehiculo): Promise<Result<OfertaVehiculo>>;
export function registrarSalida(tipo: TipoVehiculo): Promise<Result<OfertaVehiculo>>;
```

```ts
// src/features/parqueadero/rpcErrors.ts
export function toParqueaderoError(error: unknown): { code: ParqueaderoErrorCode; message: string };
// Usa la tabla de research.md §R4: error.message (código de negocio) → MSG.*; 23505 → PARQUEADERO_YA_EXISTE;
// 23514/22P02/22003 → DATOS_INVALIDOS; 42501 → NO_AUTENTICADO_AAL2; sin respuesta → RED.
```

```ts
// src/features/parqueadero/domain.ts (funciones puras, 100 % probadas)
export const MEDELLIN_CENTRO: [number, number] = [6.2442, -75.5812];
export const VALLE_ABURRA = { latMin: 6.0, latMax: 6.5, lngMin: -75.75, lngMax: -75.3 } as const;

export function celdasDisponibles(o: Pick<OfertaVehiculo, 'capacidad_total' | 'celdas_ocupadas'>): number;
export function capacidadTotal(p: Parqueadero): number;                  // suma de capacidades
export function esPublicable(p: Parqueadero): boolean;                   // activo && capacidadTotal > 0
export function motivoNoPublicable(p: Parqueadero): 'inactivo' | 'sin_celdas' | null; // inactivo tiene prioridad
export function estaFueraDeMedellin(lat: number, lng: number): boolean;
export function puedeQuitarTipo(ofertaGuardada: OfertaVehiculo | undefined): boolean; // capacidad_total === 0 o no existe
export function capacidadValida(nueva: number, ocupadas: number): boolean;           // nueva >= ocupadas
export function ofertaDe(p: Parqueadero, tipo: TipoVehiculo): OfertaVehiculo | undefined;
export function ordenarOfertas(o: OfertaVehiculo[]): OfertaVehiculo[];   // automovil primero
```

```ts
// src/features/parqueadero/formMapping.ts
export type ParqueaderoFormValues = {
  nombre: string; direccion: string; latitud: string; longitud: string; telefono: string;
  correoContacto: string; horarioAtencion: string;
  atiendeAutomoviles: boolean; tarifaAutomoviles: string; capacidadAutomoviles: string;
  atiendeMotocicletas: boolean; tarifaMotocicletas: string; capacidadMotocicletas: string;
  estado: 'activo' | 'inactivo';
};
export const valoresVacios: ParqueaderoFormValues;                       // estado 'activo'
export function toFormValues(p: Parqueadero): ParqueaderoFormValues;
export function toParqueaderoInput(v: ParqueaderoFormValues): ParqueaderoInput; // aplica trim, normalizeDecimal y Number()
```

```ts
// src/features/parqueadero/MiParqueaderoProvider.tsx
type MiParqueaderoState =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'sin_parqueadero' }
  | { estado: 'con_parqueadero'; parqueadero: Parqueadero };
export function useMiParqueadero(): MiParqueaderoState & {
  recargar: () => Promise<void>;
  actualizarOferta: (o: OfertaVehiculo) => void;   // aplica la fila devuelta por ingreso o salida sin recargar
};
```

## Extensión de `MSG` (`src/lib/messages.ts`)

```ts
parqueadero: {
  requeridos: 'Debe completar los campos obligatorios',
  campoObligatorio: 'Este campo es obligatorio.',
  registrado: 'Parqueadero registrado exitosamente',
  actualizado: 'Información actualizada exitosamente',
  quitarTipo: 'Debe reducir a cero las celdas de este tipo de vehículo antes de quitarlo de los tipos atendidos',
  telefonoNumerico: 'Solo se permiten caracteres numéricos.',
  telefonoLongitud: 'Debe tener entre 7 y 10 dígitos.',
  correoFormato: 'Debe tener un formato de correo electrónico válido.',
  latitudRango: 'Rango válido: -90 a 90.',
  longitudRango: 'Rango válido: -180 a 180.',
  fueraDeMedellin: 'La ubicación está fuera de Medellín. Verifica las coordenadas.',
  tarifaRango: 'Ingresa un valor entero entre 1 y 999.999.',
  longitud: (min: number, max: number) => `Debe tener entre ${min} y ${max} caracteres.`,
  yaExiste: 'Ya tienes un parqueadero registrado.',
  noExiste: 'No tienes un parqueadero registrado.',
  datosInvalidos: 'Revisa los datos ingresados.',
  avisoInactivo: 'Tu parqueadero está inactivo y no aparece en el mapa público.',
  avisoSinCeldas: 'Tu parqueadero no aparece en el mapa público porque no tiene celdas configuradas.',
  correoNoRegistrado: 'No registrado',
},
celdas: {
  reducir: 'No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas',
  enteroNoNegativo: 'Valor numérico entero mayor o igual a 0.',
  actualizadas: 'Celdas actualizadas exitosamente',
  tipoNoAtendido: 'Tu parqueadero no atiende este tipo de vehículo.',
},
ocupacion: {
  sinDisponibles: 'No hay celdas disponibles de este tipo',
  sinOcupadas: 'No hay celdas ocupadas de este tipo para liberar',
  sinCapacidad: 'Configura las celdas para gestionar la ocupación',
  ingresoRegistrado: 'Ingreso registrado',
  salidaRegistrada: 'Salida registrada',
  info: 'La disponibilidad se actualiza al registrar ingresos o salidas. Los cambios se reflejarán en el panel de gestión y en la vista pública del parqueadero.',
},
```
