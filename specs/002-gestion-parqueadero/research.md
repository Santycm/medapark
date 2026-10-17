# Research: Gestión del Parqueadero (002)

**Feature**: `002-gestion-parqueadero` · **Fecha**: 2026-10-17 (rev. back existente, solo front)

Formato *Decision / Rationale / Alternatives considered*. No quedan `NEEDS CLARIFICATION`.

---

## R1. Modelo de datos: el del back existente

- **Decision**: usar las tablas reales `public.parking_lots` y `public.parking_vehicle_configs`
  (`docs/supabase-esquema-actual.md`), con sus nombres en inglés, `status` booleano (`true` = Activo) y
  `vehicle_type` `'CAR' | 'MOTORCYCLE'`. Los tipos TS se generan con `supabase gen types` (solo lectura).
- **Rationale**: Principio II (el back es externo y no se modifica). El modelo existente coincide con el
  diseño de las HU (1 parqueadero por admin y 1 configuración por tipo con tarifa, capacidad y ocupadas).

## R2. Escrituras: directas a las tablas con la RLS existente

- **Decision**: registrar, editar y configurar celdas con `insert`/`update`/`delete` de supabase-js sobre
  las tablas. Las políticas existentes (`*_insert_own`, `*_update_own`, `vehicle_configs_delete_own`) ya
  limitan al dueño con `aal2`. Los payloads exactos y el orden están en `contracts/back-usage.md`.
- **Restricciones del back que el front respeta**:
  - `parking_lots.admin_id` lo envía el front (`user.id`); la política verifica que sea `auth.uid()`;
  - crear un tipo exige `total_spaces > 0` → capacidad mínima 1 al registrar o agregar un tipo;
  - borrar un tipo exige `total_spaces = 0` y `occupied_spaces = 0`;
  - `0 ≤ occupied_spaces ≤ total_spaces` (`CHECK`).
- **Dependencia externa**: hoy el rol `authenticated` no tiene privilegios `INSERT`/`UPDATE` en esas tablas
  (nota para el equipo del back, `docs/supabase-esquema-actual.md` §4). Hasta que se concedan, el front
  muestra `MSG.general.permisoDenegado` en esas operaciones.
- **Alternatives considered**: RPC transaccionales nuevas (descartadas: requieren cambiar la BD, lo que no
  está permitido).

## R3. Atomicidad sin RPC (registro y edición)

- **Decision**:
  - **Registro**: paso 1 `parking_lots`, paso 2 `parking_vehicle_configs`. Si falla el paso 2, el
    parqueadero queda sin tipos: no es publicable (la vista exige capacidad > 0), el panel lo muestra con
    `avisoSinTipos` y la edición permite agregarlos.
  - **Edición**: validación completa previa con datos recién leídos (`validateEdit`), luego escritura en
    el orden *update de tipos → delete → insert → update de datos generales*: primero lo que más
    probablemente falle. Ante un fallo intermedio: `guardadoParcial` y recarga del formulario.
- **Rationale**: es lo más seguro posible sin tocar el back. Las invariantes críticas (ocupadas ≤
  capacidad, borrar solo en 0, unicidad) las sigue garantizando la BD.
- **Alternatives considered**: guardar todo y "revertir" en el cliente si falla (complejo y también
  propenso a fallos).

## R4. Ocupación: RPC existentes

- **Decision**: `register_vehicle_entry` y `register_vehicle_exit` con `p_vehicle_config_id`. Ya son
  atómicas (`UPDATE … WHERE occupied < total`), validan dueño y `aal2`, y devuelven el nuevo
  `occupied_spaces`. El front deshabilita los botones según los conteos y mapea los textos de error
  (`sin capacidad disponible` / `sin celdas ocupadas`) a los mensajes de HU7.
- **Rationale**: cumplen FR-028 y SC-003 sin cambios.

## R5. Mapeo de errores

- **Decision**: `src/services/parkingErrors.ts` según `contracts/back-usage.md` §7. Para detectar
  operaciones que la RLS filtró sin error (`update`/`delete` sobre 0 filas), toda escritura usa
  `.select('id')` y verifica que la respuesta no esté vacía.

## R6. Estado compartido en el front

- **Decision**: `MyParkingProvider` (Context) dentro de `AdminLayout`; guards `RequireParking` y
  `RequireNoParking`; `applyOccupancy` para actualizar la UI tras ingreso o salida sin recargar.
- **Rationale**: Principio III (sin librerías de datos).

## R7. Formulario compartido de registro y edición

- **Decision**: `components/parking/ParkingForm` con react-hook-form + `makeParkingFormSchema({ mode,
  savedTypes })` (Zod). Los numéricos se manejan como string. "No desmarcar un tipo con capacidad guardada
  > 0" se aplica en el `onChange` del checkbox (`canRemoveType`). Los campos de un tipo desmarcado se
  desregistran.

## R8. Mapa selector (Leaflet + react-leaflet 5, ya en el repo)

- **Decision**: en `src/components/map/` (junto a `ParkingMap` y `ParkingMarker` existentes):
  - `MapBase.tsx`: `MapContainer` + `TileLayer` CARTO Voyager
    (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`, atribución
    `© OpenStreetMap contributors © CARTO`); centro `MEDELLIN_CENTER`, zoom 13; prop `scrollWheelZoom`.
  - `markerIcons.ts`: `L.divIcon` con SVG inline (pin `brand-600` con carro) para evitar los PNG por defecto
    de Leaflet. La 003 lo reutiliza.
  - `LocationPicker.tsx`: marcador arrastrable y `useMapEvents({ click })`; redondeo a 6 decimales;
    `map.setView` cuando las props cambian a coordenadas válidas.
- **Rationale**: decisión del wizard; `react-leaflet` 5 ya está en el repo (React 19).

## R9. Formatos y mensajes

- **Decision**: `src/lib/format.ts` (`formatCOP`, `formatCoord`, `normalizeDecimal`); los mensajes en
  `MSG.parqueadero`, `MSG.celdas` y `MSG.ocupacion` (`contracts/frontend-api.md` §5). Los mensajes de éxito
  viajan por `location.state.flash` hacia el panel.

## R10. Pruebas

- **Decision**: Vitest con `supabase` simulado: dominio (`validateEdit`, `diffConfigs`, publicabilidad,
  `isOutsideMedellin`, etc.), esquemas, mapeo del formulario, `parkingErrors`, `adminParking` (orden de
  escritura, `.select` vacío ⇒ error) y páginas con lógica condicional. **Sin** pruebas contra el back
  remoto; la integración se valida a mano con `quickstart.md`.
