# Research: Gestión del Parqueadero (002)

**Feature**: `002-gestion-parqueadero` · **Fecha**: 2026-10-17

Formato *Decision / Rationale / Alternatives considered*. No quedan `NEEDS CLARIFICATION`.

---

## R1. Modelo relacional: parqueadero + ofertas por tipo

- **Decision**: dos tablas.
  - `public.parqueaderos`: 1 fila por administrador (`admin_id` **UNIQUE**).
  - `public.ofertas_vehiculo`: PK `(parqueadero_id, tipo)`, con `tarifa_hora`, `capacidad_total` y
    `celdas_ocupadas`. Que exista una fila significa que el tipo es atendido.

  Las invariantes van en `CHECK`: `0 ≤ celdas_ocupadas ≤ capacidad_total`, rangos de tarifa y capacidad, y
  formatos de teléfono, correo y coordenadas.
- **Rationale**: el conteo por tipo vive en una sola fila, de modo que "ingreso" y "salida" son un `UPDATE`
  atómico con condición. Los tipos atendidos no necesitan banderas redundantes. El 1:1 se garantiza con un
  `UNIQUE`.
- **Alternatives considered**: (a) una sola tabla con columnas `*_autos`/`*_motos` (duplica columnas y
  complica las reglas por tipo); (b) una tabla de celdas individuales (fuera de alcance según la aclaración
  de HU6).

## R2. Escrituras solo mediante RPC `SECURITY DEFINER`

- **Decision**: el rol `authenticated` solo tiene `SELECT` (filtrado por RLS) sobre ambas tablas. **Todas**
  las escrituras pasan por 5 funciones `security definer` con `set search_path = ''`:
  `registrar_parqueadero`, `actualizar_parqueadero`, `configurar_celdas`, `registrar_ingreso` y
  `registrar_salida`. Cada una:
  1. exige `public.es_sesion_aal2()` (helper de la 001), y si falla lanza `NO_AUTENTICADO_AAL2` (errcode `42501`);
  2. resuelve el parqueadero **por `auth.uid()`**, sin recibir ids de parqueadero desde el cliente;
  3. aplica las reglas de negocio y lanza excepciones con **códigos de negocio** como mensaje.
- **Rationale**: Principio II. Las reglas que cruzan filas ("al menos un tipo", "no quitar un tipo con
  celdas", "capacidad ≥ ocupadas" atómico con la edición) no se pueden expresar solo con RLS y `CHECK`. Un
  único camino de escritura evita saltarse las reglas por la API REST. Al no recibir `parqueadero_id`, el
  aislamiento entre administradores no depende del cliente (FR-003).
- **Alternatives considered**: (a) `INSERT`/`UPDATE` directos con RLS + triggers (las reglas quedan
  dispersas en triggers y el cliente arma transacciones de varias tablas sin atomicidad); (b) RPC `security
  invoker` + RLS de escritura (válido, pero duplica la comprobación de propiedad en políticas y funciones).

## R3. Concurrencia en ingresos y salidas (FR-028, SC-003)

- **Decision**: un `UPDATE … SET celdas_ocupadas = celdas_ocupadas + 1 WHERE parqueadero_id = v_id AND tipo
  = p_tipo AND celdas_ocupadas < capacidad_total RETURNING *`. Si no devuelve fila, se distingue
  `TIPO_NO_ATENDIDO` de `SIN_CELDAS_DISPONIBLES`. La salida es simétrica (`> 0`). El `CHECK` actúa como red
  de seguridad.
- **Rationale**: el bloqueo de fila de PostgreSQL serializa los `UPDATE` concurrentes sobre la misma fila,
  y el `WHERE` condicional evita sobrepasar los límites sin `SELECT … FOR UPDATE` explícito.
- **Alternatives considered**: leer, calcular en el cliente y escribir el valor absoluto (pierde
  movimientos ante concurrencia).

## R4. Contrato de errores RPC → mensajes

PostgREST devuelve `error.message` con el texto de `raise exception` y `error.code` con el SQLSTATE.

| `error.message` (código de negocio) | SQLSTATE | Mensaje al usuario |
|-------------------------------------|----------|--------------------|
| `NO_AUTENTICADO_AAL2` | 42501 | (sin mensaje) → `handleSessionError` de la 001: cierre de sesión y login |
| `PARQUEADERO_YA_EXISTE` | P0001 (o 23505 por `UNIQUE`) | Ya tienes un parqueadero registrado. |
| `PARQUEADERO_NO_EXISTE` | P0001 | No tienes un parqueadero registrado. |
| `SIN_TIPOS` | P0001 | Debe completar los campos obligatorios |
| `TIPO_CON_CELDAS` | P0001 | Debe reducir a cero las celdas de este tipo de vehículo antes de quitarlo de los tipos atendidos |
| `CAPACIDAD_MENOR_A_OCUPADAS` | P0001 | No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas |
| `TIPO_NO_ATENDIDO` | P0001 | Tu parqueadero no atiende este tipo de vehículo. |
| `SIN_CELDAS_DISPONIBLES` | P0001 | No hay celdas disponibles de este tipo |
| `SIN_CELDAS_OCUPADAS` | P0001 | No hay celdas ocupadas de este tipo para liberar |
| `DATOS_INVALIDOS` / 23514 / 22P02 / 22003 | P0001 / check / cast | Revisa los datos ingresados. |
| Red o desconocido | — | No fue posible conectar con el servidor. Intenta nuevamente. |

- **Decision**: `src/features/parqueadero/rpcErrors.ts` con `toParqueaderoError(error)` →
  `{ codigo, mensaje }`, más pruebas.

## R5. Lecturas del administrador

- **Decision**: `supabase.from('parqueaderos').select('*, ofertas_vehiculo(*)').maybeSingle()`. Con RLS:
  - política PERMISSIVE `select` `to authenticated using (admin_id = (select auth.uid()))`;
  - política RESTRICTIVE `select` `to authenticated using ((select public.es_sesion_aal2()))`.

  Lo mismo aplica a `ofertas_vehiculo` (propiedad vía `exists` sobre `parqueaderos`). `anon` no tiene
  `SELECT` sobre las tablas; el acceso público lo define la feature 003 con una función de solo lectura.
- **Rationale**: una sola consulta con relación embebida trae todo lo que necesitan el panel y los
  formularios. Al usar `maybeSingle()`, "sin parqueadero" no es un error.

## R6. Estado del parqueadero en el frontend

- **Decision**: `MiParqueaderoProvider` (React Context) montado dentro de `AdminLayout`. Carga una vez y
  expone `{ estado: 'cargando' | 'sin_parqueadero' | 'con_parqueadero' | 'error', parqueadero, recargar() }`.
  Tras cada RPC exitosa se llama a `recargar()`, o se actualiza el estado con la fila devuelta, en el caso
  de ingreso y salida. Hay dos guards nuevos: `RequireParqueadero` y `RequireSinParqueadero`.
- **Rationale**: Principio III (sin react-query ni Redux). El menú lateral, el panel y los guards comparten
  el mismo dato.

## R7. Formulario compartido de registro y edición

- **Decision**: `ParqueaderoForm` con `mode: 'registrar' | 'editar'`, usando react-hook-form y el esquema
  Zod `parqueaderoFormSchema`. Los campos numéricos se manejan como `string` en el formulario y se
  transforman a número en `toRpcPayload()`. Los campos por tipo se validan con `superRefine` según
  `atiendeAutomoviles` y `atiendeMotocicletas`. La regla "no desmarcar un tipo con capacidad guardada > 0"
  se aplica **en el `onChange` del checkbox** (no permite desmarcar y muestra la advertencia) y se
  revalida en el servidor (`TIPO_CON_CELDAS`).
- **Rationale**: HU3 y HU5 comparten campos y validaciones; un componente evita divergencias.

## R8. Mapa selector (Leaflet)

- **Decision**: `leaflet@1.9` + `react-leaflet@4.2` (compatible con React 18; la v5 exige React 19).
  Componentes compartidos en `src/components/map/`:
  - `MapBase.tsx`: `MapContainer` con mosaicos **CARTO Voyager**
    (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`, atribución
    `© OpenStreetMap contributors © CARTO`), centro por defecto Medellín `[6.2442, -75.5812]`, zoom 13,
    `scrollWheelZoom` desactivado en el formulario.
  - `markerIcons.ts`: íconos `L.divIcon` con SVG inline (pin verde con carro) para evitar el problema de
    rutas del ícono por defecto de Leaflet con Vite.
  - `LocationPicker.tsx`: marcador `draggable`; `useMapEvents({ click })` para fijar la posición; `onChange(lat,
    lng)` redondea a 6 decimales; cuando cambian las props `lat`/`lng` válidas, `map.setView`.
  - Importar `leaflet/dist/leaflet.css` en `main.tsx`.
- **Rationale**: decisión del wizard (Leaflet/OSM sin API key). CARTO Voyager se parece a los mapas de los
  prototipos y es gratuito para uso de bajo volumen. La feature 003 reutiliza `MapBase` y `markerIcons`.
- **Alternatives considered**: mosaicos estándar de OSM (más recargados visualmente; quedan como respaldo en
  una constante) y Google Maps JS (requiere API key con facturación).

## R9. Formatos

- **Decision**: `src/lib/format.ts`:
  - `formatCOP(5000)` → `"$ 5.000"` (`Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })` con el
    prefijo `"$ "`);
  - `formatCoord(6.2442)` → `"6.2442"` (punto decimal y sin ceros sobrantes);
  - `normalizeDecimal("6,2442")` → `"6.2442"`.
- **Rationale**: Principio V (es-CO) y el caso límite de la coma decimal.

## R10. Mensajes de éxito tras redirección

- **Decision**: `navigate('/admin', { state: { flash: MSG.parqueadero.registrado } })`. El `PanelPage`
  muestra `location.state.flash` en un `Alert` de éxito (`role="status"`) que se oculta a los 5 s, y luego
  limpia el state con `navigate('.', { replace: true, state: null })`.
- **Rationale**: no se necesita una librería de toasts (Principio III).

## R11. Pruebas de base de datos

- **Decision**: pgTAP en `supabase/tests/002_*.test.sql` contra el proyecto enlazado. Los usuarios de
  prueba se crean **dentro de la transacción** con
  `insert into auth.users (id, email, aud, role) values (...)` (se revierte con `rollback`). Las sesiones
  se simulan con `set local role authenticated` + `request.jwt.claims` que incluyen `sub` y `aal`.
- **Cobertura mínima**: RLS de lectura (dueño y no dueño, aal1 y aal2, anon), cada RPC en su camino feliz
  y en cada código de error, los `CHECK`, y el `UNIQUE` de `admin_id`.
- **Concurrencia (SC-003)**: se verifica con un script Vitest de integración opcional
  (`tests/integration/ocupacion-concurrente.test.ts`) que lanza 100 llamadas `Promise.all` a
  `registrar_ingreso` con una cuenta de prueba aal2. Se omite (`describe.skipIf`) si no existen las
  variables `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` y `E2E_TOTP_SECRET`. Para generar el TOTP se usa la
  dependencia de desarrollo `otpauth`.
