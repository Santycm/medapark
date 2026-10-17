# Contrato: API del front para la gestión del parqueadero (002)

Complementa [back-usage.md](./back-usage.md) (acceso a datos). Aquí se definen las reglas puras, el mapeo del
formulario, el estado compartido y los mensajes.

## 1. Reglas puras (`src/domain/parking.ts`, 100 % probadas)

```ts
export const MEDELLIN_CENTER: [number, number] = [6.2442, -75.5812];
export const VALLE_ABURRA = { latMin: 6.0, latMax: 6.5, lngMin: -75.75, lngMax: -75.3 } as const;

export function availableSpaces(c: Pick<VehicleConfig, 'total_spaces' | 'occupied_spaces'>): number;
export function totalCapacity(p: ParkingLot): number;                       // suma de total_spaces
export function isPublishable(p: ParkingLot): boolean;                      // status && totalCapacity > 0
export function unpublishedReason(p: ParkingLot): 'inactivo' | 'sin_tipos' | 'sin_celdas' | null;
//   prioridad: inactivo > sin_tipos (0 configs) > sin_celdas
export function isOutsideMedellin(lat: number, lng: number): boolean;
export function canRemoveType(saved: VehicleConfig | undefined): boolean;   // !saved || (total 0 && occupied 0)
export function isCapacityValid(next: number, occupied: number): boolean;   // next >= occupied
export function configOf(p: ParkingLot, t: VehicleType): VehicleConfig | undefined;
export function sortConfigs(cs: VehicleConfig[]): VehicleConfig[];          // CAR primero

/** HU5 §4 de back-usage: devuelve el primer error de negocio o null. */
export function validateEdit(current: VehicleConfig[], desired: ConfigInput[]):
  | null
  | { code: 'SIN_TIPOS' }
  | { code: 'TIPO_CON_CELDAS'; type: VehicleType }
  | { code: 'CAPACIDAD_MENOR_A_OCUPADAS'; type: VehicleType }
  | { code: 'CAPACIDAD_NUEVO_TIPO'; type: VehicleType };

/** HU5: plan de escritura (qué actualizar, borrar o insertar). */
export function diffConfigs(current: VehicleConfig[], desired: ConfigInput[]): {
  toUpdate: { id: string; hourly_rate: number; total_spaces: number }[];
  toDelete: { id: string; vehicle_type: VehicleType }[];
  toInsert: ConfigInput[];
};
```

## 2. Formulario (`src/domain/parkingForm.ts` y `src/domain/schemas/parking.ts`)

```ts
export type ParkingFormValues = {
  name: string; address: string; latitude: string; longitude: string; phone: string;
  contactEmail: string; openingHours: string;
  servesCars: boolean; carRate: string; carSpaces: string;
  servesMotorcycles: boolean; motorcycleRate: string; motorcycleSpaces: string;
  status: 'activo' | 'inactivo';
};
export const emptyParkingForm: ParkingFormValues;                 // status 'activo'
export function toFormValues(p: ParkingLot): ParkingFormValues;
export function toParkingInput(v: ParkingFormValues): ParkingInput;  // trim, normalizeDecimal, Number(), '' → null
export function makeParkingFormSchema(opts: {
  mode: 'registrar' | 'editar';
  savedTypes: VehicleType[];      // en edición, los tipos ya existentes admiten capacidad 0
}): ZodType<ParkingFormValues>;
export const spacesSchema: ZodType<{ [configId: string]: string }>;  // enteros 0–9999
```

Reglas del esquema: ver `data-model.md` §Esquema del formulario. Capacidad: mínimo **1** en `registrar` y
para los tipos no incluidos en `savedTypes`; mínimo **0** para los tipos guardados en `editar`.

## 3. Estado compartido (`src/context/MyParkingProvider.tsx` + `src/hooks/useMyParking.ts`)

```ts
type MyParkingState =
  | { state: 'cargando' }
  | { state: 'error'; message: string }
  | { state: 'sin_parqueadero' }
  | { state: 'con_parqueadero'; parking: ParkingLot };

export function useMyParking(): MyParkingState & {
  reload: () => Promise<ParkingLot | null>;
  applyOccupancy: (configId: string, occupied: number) => void;  // tras ingreso o salida, sin recargar
};
```

Se monta dentro de `AdminLayout` (envuelve el `<Outlet/>`).

## 4. Formatos (`src/lib/format.ts`)

`formatCOP(5000)` → `"$ 5.000"` · `formatCoord(6.2442)` → `"6.2442"` · `normalizeDecimal("6,2442")` → `"6.2442"`.

## 5. Extensión de `MSG` (`src/lib/messages.ts`)

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
  capacidadNueva: 'Ingresa un valor entero entre 1 y 9.999.',
  longitud: (min: number, max: number) => `Debe tener entre ${min} y ${max} caracteres.`,
  yaExiste: 'Ya tienes un parqueadero registrado.',
  registroIncompleto: 'El parqueadero se registró, pero no se pudieron guardar los tipos de vehículo. Agrégalos desde Editar información.',
  guardadoParcial: 'Algunos cambios no se pudieron guardar. Revisa la información e intenta nuevamente.',
  datosInvalidos: 'Revisa los datos ingresados.',
  avisoInactivo: 'Tu parqueadero está inactivo y no aparece en el mapa público.',
  avisoSinCeldas: 'Tu parqueadero no aparece en el mapa público porque no tiene celdas configuradas.',
  avisoSinTipos: 'Tu parqueadero no tiene tipos de vehículo configurados.',
  correoNoRegistrado: 'No registrado',
},
celdas: {
  reducir: 'No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas',
  enteroNoNegativo: 'Valor numérico entero mayor o igual a 0.',
  actualizadas: 'Celdas actualizadas exitosamente',
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
