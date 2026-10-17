---
description: "Task list for 002-gestion-parqueadero"
---

# Tasks: Gestión del Parqueadero por el Administrador

**Input**: Design documents from `specs/002-gestion-parqueadero/`

**Prerequisites**: feature 001 implementada; plan.md, spec.md, research.md, data-model.md, contracts/ (db-schema, parqueadero-api, ui), quickstart.md

**Tests**: OBLIGATORIAS (constitución, Principio IV): pgTAP para el esquema, la RLS y las RPC; Vitest para el dominio, los esquemas, los mapeos, los errores y los componentes con lógica condicional.

**Organization**: US1 = HU3 Registrar (P1), US2 = HU4 Panel (P1), US3 = HU7 Ocupación (P2), US4 = HU5 Editar (P2), US5 = HU6 Celdas (P3).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 Instalar dependencias: `leaflet@1.9 react-leaflet@4.2` y, como dev, `@types/leaflet otpauth`, en `package.json`; importar `leaflet/dist/leaflet.css` en `src/main.tsx`
- [ ] T002 [P] **Mocks (Pencil MCP, en otra sesión)**: agregar en `design/medapark.pen` las pantallas *Panel sin parqueadero*, *Panel con parqueadero* (base `docs/prototipos/HU04-consultar-mi-parqueadero.jpg`, con los avisos de publicabilidad y el menú lateral "Mi parqueadero / Gestionar ocupación / Configurar celdas"), *Registrar parqueadero* (base `HU03-registrar-parqueadero.jpg`, **sin** buscador sobre el mapa y con los campos de tarifa y capacidad **por tipo**), *Editar parqueadero* (base `HU05-editar-parqueadero.jpg`, con el correo **opcional**), *Configurar celdas* (base `HU06-configurar-celdas.jpg`, con "Ocupadas actualmente") y *Gestionar ocupación* (base `HU07-gestionar-ocupacion.jpg`, con los estados de botón deshabilitado y sus mensajes). Requisito previo de T025, T032, T037, T044 y T050

---

## Phase 2: Foundational (bloquea todas las stories)

**Purpose**: esquema, RLS, RPC y pruebas SQL; tipos; dominio; servicio; provider y guards; componentes compartidos.

### Base de datos

- [ ] T003 Crear `supabase/migrations/20261017000200_parqueaderos.sql` con **todo** el SQL de `contracts/db-schema.md` §1, §2 y §3 (enums, `set_updated_at`, tablas, triggers, RLS, `revoke`/`grant`, `_validar_ofertas` y las 5 RPC con el algoritmo de §3.2 y §3.3 completo, más los permisos de §3.5)
- [ ] T004 [P] Crear `supabase/tests/002_schema.test.sql` según `contracts/db-schema.md` §4 (fixture común + casos de esquema y `CHECK`)
- [ ] T005 [P] Crear `supabase/tests/002_rls.test.sql` (§4: dueño y no dueño, aal1 y aal2, anon, escrituras directas denegadas)
- [ ] T006 [P] Crear `supabase/tests/002_rpc_registrar.test.sql` (§4)
- [ ] T007 [P] Crear `supabase/tests/002_rpc_actualizar.test.sql` (§4, incluida la atomicidad: un error no cambia el `nombre`)
- [ ] T008 [P] Crear `supabase/tests/002_rpc_celdas.test.sql` (§4)
- [ ] T009 [P] Crear `supabase/tests/002_rpc_ocupacion.test.sql` (§4)
- [ ] T010 Aplicar y probar: `npx supabase db push` y `npx supabase test db --linked` en verde; luego `npx supabase gen types typescript --linked > src/lib/database.types.ts`

### Núcleo del frontend

- [ ] T011 [P] Crear `src/lib/result.ts` (`export type Result<T, C extends string = string> = { ok: true; data: T } | { ok: false; code: C; message: string }`) y refactorizar `src/features/auth/authService.ts` para importarlo (sin cambios de comportamiento; las pruebas de la 001 siguen en verde)
- [ ] T012 [P] Crear `src/lib/format.ts` (`formatCOP`, `formatCoord`, `normalizeDecimal`) y `src/lib/format.test.ts` (`5000` → `"$ 5.000"`, `1500000` → `"$ 1.500.000"`, `"6,2442"` → `"6.2442"`, `6.244200` → `"6.2442"`)
- [ ] T013 [P] Extender `src/lib/messages.ts` con las secciones `parqueadero`, `celdas` y `ocupacion` **exactamente** como en `contracts/parqueadero-api.md` §Extensión de MSG
- [ ] T014 [P] Crear `src/features/parqueadero/types.ts` según `data-model.md` §Tipos en el frontend
- [ ] T015 [P] Crear `src/features/parqueadero/domain.ts` con las funciones de `contracts/parqueadero-api.md`
- [ ] T016 [P] Pruebas `src/features/parqueadero/domain.test.ts`: `celdasDisponibles`; `esPublicable` y `motivoNoPublicable` (las 3 filas de la tabla de publicabilidad de `data-model.md`; con inactivo y sin celdas a la vez → `'inactivo'`); `estaFueraDeMedellin` (Parque Berrío → `false`, Bogotá → `true`, bordes 6.0/6.5/−75.75/−75.3 → `false`); `puedeQuitarTipo`; `capacidadValida`; `ordenarOfertas`
- [ ] T017 [P] Crear `src/features/parqueadero/rpcErrors.ts` y `rpcErrors.test.ts` (una fila por cada entrada de la tabla de `research.md` §R4)
- [ ] T018 Crear `src/features/parqueadero/parqueaderoService.ts` según `contracts/parqueadero-api.md` (mapea `ParqueaderoInput` a los parámetros `p_*` de las RPC; ante `NO_AUTENTICADO_AAL2` o un error de sesión llama a `handleSessionError` de la 001)
- [ ] T019 [P] Pruebas `src/features/parqueadero/parqueaderoService.test.ts` (mock de `supabase`): `registrarParqueadero` envía `p_correo_contacto: null` si el correo está vacío y `p_ofertas` con 1 o 2 elementos; `obtenerMiParqueadero` devuelve `null` sin error si no hay fila; un `SIN_CELDAS_DISPONIBLES` llega con el mensaje literal; `NO_AUTENTICADO_AAL2` invoca `handleSessionError`
- [ ] T020 Crear `src/features/parqueadero/MiParqueaderoProvider.tsx` (`useMiParqueadero`, `recargar` y `actualizarOferta`) y montarlo dentro de `src/components/layout/AdminLayout.tsx`, envolviendo el `<Outlet/>`
- [ ] T021 Crear `src/features/parqueadero/guards/RequireParqueadero.tsx` y `RequireSinParqueadero.tsx` según `contracts/ui.md`, y sus pruebas en `guards.test.tsx` (cargando, error con "Reintentar", sin parqueadero y con parqueadero)
- [ ] T022 Actualizar `src/components/layout/AdminSidebar.tsx` con los 3 ítems de `contracts/ui.md` §Menú lateral (visibles según `useMiParqueadero`)
- [ ] T023 [P] Crear los componentes UI compartidos en `src/components/ui/`: `Checkbox.tsx`, `RadioCard.tsx` (título, descripción, ícono y estado seleccionado con borde `brand-600` y fondo `brand-50`), `NumberStepper.tsx` (− input +, `min`, `max`, solo dígitos, `aria-label`, botones deshabilitados en los límites; pruebas `NumberStepper.test.tsx`), `Badge.tsx` (activo o inactivo) y `Breadcrumbs.tsx`
- [ ] T024 [P] Crear `src/components/map/markerIcons.ts` (`L.divIcon` con SVG inline: pin `brand-600` con carro blanco; variante `seleccionado` en `accent-600`) y `src/components/map/MapBase.tsx` (`MapContainer` + `TileLayer` CARTO Voyager con atribución, props `center`, `zoom`, `className`, `scrollWheelZoom`, `children`), según `research.md` §R8
- [ ] T025 Registrar en `src/app/router.tsx` las rutas de `contracts/ui.md` con sus guards; las páginas que aún no existen se apuntan a componentes temporales que se reemplazan en cada story. `/admin` pasa a usar `src/features/parqueadero/pages/PanelPage.tsx` (borrar `src/pages/admin/PanelPage.tsx`)

**Checkpoint**: `npm test` y `npm run db:test` en verde; el menú y los guards responden al estado del parqueadero.

---

## Phase 3: User Story 1 - Registrar mi parqueadero (P1) 🎯 MVP · HU3

**Goal**: el admin sin parqueadero lo registra con validaciones, mapa selector y ofertas por tipo.

**Independent Test**: `quickstart.md` §US1.

### Tests for User Story 1

- [ ] T026 [P] [US1] Pruebas `src/features/parqueadero/schemas.test.ts` (`parqueaderoFormSchema`): todo vacío → errores en los campos requeridos; ningún tipo marcado → error en el grupo; tipo marcado sin tarifa ni capacidad → errores; tipo desmarcado con campos vacíos → válido; teléfono `300-123` → "Solo se permiten caracteres numéricos."; `123456` → "Debe tener entre 7 y 10 dígitos."; correo vacío válido; `contacto@dominio` inválido; latitud `"6,2442"` válida (normalizada); `95` y `-181` → mensajes de rango; tarifa `0` y `1000000` → `tarifaRango`; capacidad `-1` y `2.5` → `enteroNoNegativo`; capacidad `0` válida; un nombre de solo espacios cuenta como vacío
- [ ] T027 [P] [US1] Pruebas `src/features/parqueadero/formMapping.test.ts`: `toParqueaderoInput` arma 1 o 2 ofertas según los checks, convierte a número, recorta espacios y devuelve el correo vacío como `null`; `toFormValues` es inversa sobre un parqueadero de ejemplo
- [ ] T028 [P] [US1] Pruebas `src/features/parqueadero/components/ParqueaderoForm.test.tsx` (mock de `LocationPicker`): marcar y desmarcar un tipo muestra y oculta sus campos; enviar vacío muestra "Debe completar los campos obligatorios" sin llamar a `onSubmit`; el aviso `fueraDeMedellin` aparece con coordenadas de Bogotá y **no** bloquea el envío; en modo `registrar` no hay campo Estado; el botón dice "Guardar"

### Implementation for User Story 1

- [ ] T029 [P] [US1] Crear `src/features/parqueadero/schemas.ts` con `parqueaderoFormSchema` (según `data-model.md` §Esquema del formulario) y `src/features/parqueadero/formMapping.ts` (según `contracts/parqueadero-api.md`)
- [ ] T030 [US1] Crear `src/components/map/LocationPicker.tsx` según `research.md` §R8 y `plan.md` (Design Notes 4): props `lat?: number`, `lng?: number` y `onChange(lat, lng)`; marcador arrastrable; clic para fijar; redondeo a 6 decimales; centro en Medellín si no hay coordenadas válidas; `aria-label="Mapa para seleccionar la ubicación del parqueadero"`
- [ ] T031 [US1] Crear `src/features/parqueadero/components/ParqueaderoForm.tsx` (props `mode`, `defaultValues`, `ofertasGuardadas?`, `onSubmit(values)`, `onCancel`, `submitting`, `serverError?`) con el layout y los textos de `contracts/ui.md` §RegistrarParqueaderoPage/EditarParqueaderoPage (en esta story sin el campo Estado ni la regla de desmarcar)
- [ ] T032 [US1] Crear `src/features/parqueadero/pages/RegistrarParqueaderoPage.tsx`: encabezado y `ParqueaderoForm mode="registrar"`; al enviar: `registrarParqueadero(toParqueaderoInput(v))`; éxito → `await recargar()` y `navigate('/admin', { replace: true, state: { flash: MSG.parqueadero.registrado } })`; `PARQUEADERO_YA_EXISTE` → `recargar()` y navegar a `/admin`; otros errores → `serverError`. "Cancelar" → `/admin`

**Checkpoint**: un admin nuevo registra su parqueadero (el panel puede ser todavía básico).

---

## Phase 4: User Story 2 - Consultar mi parqueadero / panel (P1) · HU4

**Goal**: panel en modo lectura con disponibilidad, avisos y accesos.

**Independent Test**: `quickstart.md` §US2.

### Tests for User Story 2

- [ ] T033 [P] [US2] Pruebas `src/features/parqueadero/pages/PanelPage.test.tsx` (`MiParqueaderoProvider` simulado): sin parqueadero → botón "Registrar parqueadero" y ausencia de "Gestionar ocupación", "Editar información" y "Configurar celdas"; con parqueadero → nombre, dirección, coordenadas, "No registrado" si no hay correo, "$ 5.000", y el texto "Automóviles: 15 disponibles / 20"; solo motos → no hay "Automóviles"; inactivo → `avisoInactivo`; capacidad 0 → `avisoSinCeldas` y "Gestionar ocupación" deshabilitado con `sinCapacidad`; `location.state.flash` → alerta de éxito

### Implementation for User Story 2

- [ ] T034 [P] [US2] Crear `src/features/parqueadero/components/DisponibilidadCards.tsx` (por oferta: ícono, nombre plural, "Celdas disponibles", "Capacidad total", con un texto `sr-only` del tipo "Automóviles: 15 disponibles / 20"; prop `mostrarOcupadas` para reutilizarlo en HU7)
- [ ] T035 [P] [US2] Crear `src/features/parqueadero/components/AvisoPublicacion.tsx` (usa `motivoNoPublicable`) y `src/features/parqueadero/components/ParqueaderoResumen.tsx` (nombre, dirección, coordenadas y badge)
- [ ] T036 [US2] Crear `src/features/parqueadero/pages/PanelPage.tsx` según `contracts/ui.md` §PanelPage (estado vacío, encabezado, flash con autocierre a los 5 s y limpieza del state, aviso, tarjeta de información, disponibilidad y tarjetas de acceso)

**Checkpoint**: US1 + US2 forman el MVP de la feature (registro y consulta).

---

## Phase 5: User Story 3 - Gestionar ocupación (P2) · HU7

**Goal**: ingresos y salidas atómicos con conteos inmediatos.

**Independent Test**: `quickstart.md` §US3.

### Tests for User Story 3

- [ ] T037 [P] [US3] Pruebas `src/features/parqueadero/pages/GestionarOcupacionPage.test.tsx` (mock del servicio y del provider): muestra capacidad, ocupadas y disponibles por tipo; con 0 disponibles del tipo seleccionado, "Registrar ingreso" queda deshabilitado con "No hay celdas disponibles de este tipo"; con 0 ocupadas, "Registrar salida" queda deshabilitado con "No hay celdas ocupadas de este tipo para liberar"; con un solo tipo atendido no se muestra el otro; un ingreso exitoso llama a `actualizarOferta` y muestra "Ingreso registrado"; el error `SIN_CELDAS_DISPONIBLES` muestra el mensaje y llama a `recargar`; durante la petición el botón está deshabilitado; con capacidad total 0 se muestra `sinCapacidad` con el enlace a "Configurar celdas"
- [ ] T038 [P] [US3] (Opcional) Crear `tests/integration/ocupacion-concurrente.test.ts` según `research.md` §R11 (con `describe.skipIf` si no hay variables `E2E_*`): login, MFA con `otpauth`, `configurar_celdas` a capacidad N, N+20 llamadas concurrentes a `registrar_ingreso` → exactamente N exitosas y ocupadas = N; luego N+20 salidas → 0

### Implementation for User Story 3

- [ ] T039 [US3] Crear `src/features/parqueadero/pages/GestionarOcupacionPage.tsx` según `contracts/ui.md` §GestionarOcupacionPage (`ParqueaderoResumen`, `DisponibilidadCards mostrarOcupadas` en una región `aria-live`, tarjetas de ingreso y salida con `RadioCard` por tipo, estados deshabilitados con sus mensajes, retroalimentación efímera, `Alert` info y "Volver al panel")

**Checkpoint**: las disponibilidades cambian y se ven en el panel.

---

## Phase 6: User Story 4 - Editar mi parqueadero (P2) · HU5

**Goal**: edición atómica, incluido el estado y la regla de quitar tipos.

**Independent Test**: `quickstart.md` §US4.

### Tests for User Story 4

- [ ] T040 [P] [US4] Ampliar `src/features/parqueadero/components/ParqueaderoForm.test.tsx` para el modo `editar`: precarga de valores; campo Estado con las 2 opciones y sus descripciones; desmarcar un tipo con `ofertasGuardadas` de capacidad > 0 → se mantiene marcado y aparece `MSG.parqueadero.quitarTipo`; con capacidad 0 → se desmarca; botón "Guardar cambios"; un `serverError` de `CAPACIDAD_MENOR_A_OCUPADAS` se muestra en el campo de capacidad del tipo correspondiente
- [ ] T041 [P] [US4] Pruebas `src/features/parqueadero/pages/EditarParqueaderoPage.test.tsx`: un éxito navega a `/admin` con `flash = MSG.parqueadero.actualizado` tras `recargar`; "Cancelar" navega sin llamar al servicio; un error de negocio se muestra y no navega

### Implementation for User Story 4

- [ ] T042 [US4] Completar `ParqueaderoForm.tsx` para `mode="editar"`: el campo "Estado del parqueadero" con `RadioCard` (textos de `contracts/ui.md`), la regla de desmarcar con `puedeQuitarTipo` (`plan.md` Design Notes 2), el botón "Guardar cambios" y el mapeo de `serverError` a campos (`TIPO_CON_CELDAS` → grupo de tipos; `CAPACIDAD_MENOR_A_OCUPADAS` → capacidad del tipo cuyo valor nuevo sea menor a sus ocupadas)
- [ ] T043 [US4] Crear `src/features/parqueadero/pages/EditarParqueaderoPage.tsx`: `defaultValues = toFormValues(parqueadero)`, `ofertasGuardadas = parqueadero.ofertas_vehiculo`; enviar → `actualizarParqueadero({ ...toParqueaderoInput(v), estado: v.estado })` → éxito: `await recargar()` y navegar con el flash; "Cancelar" → `/admin`

**Checkpoint**: la edición, el cambio de estado y las reglas de capacidad funcionan.

---

## Phase 7: User Story 5 - Configurar celdas (P3) · HU6

**Goal**: pantalla dedicada con +/−, total y validación frente a las ocupadas.

**Independent Test**: `quickstart.md` §US5.

### Tests for User Story 5

- [ ] T044 [P] [US5] Pruebas `src/features/parqueadero/pages/ConfigurarCeldasPage.test.tsx`: solo los tipos atendidos; el total se recalcula al cambiar los valores; un valor menor a las ocupadas muestra `MSG.celdas.reducir` **antes** de enviar (validación de cliente con `capacidadValida`) y no llama al servicio; el error del servidor `CAPACIDAD_MENOR_A_OCUPADAS` también se muestra; un éxito navega con `flash = MSG.celdas.actualizadas`; "Cancelar" navega sin guardar

### Implementation for User Story 5

- [ ] T045 [US5] Crear `src/features/parqueadero/pages/ConfigurarCeldasPage.tsx` según `contracts/ui.md` §ConfigurarCeldasPage (`ParqueaderoResumen`, `NumberStepper` por tipo con "Ocupadas actualmente: n", total, validación local con `capacidadValida`, `configurarCeldas([...])`, `recargar()` y navegación con el flash)

**Checkpoint**: las 5 stories funcionan de forma independiente.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T046 [P] Revisión responsive (360, 768 y 1280 px) del panel, el formulario (mapa y 2 columnas → 1), celdas y ocupación
- [ ] T047 [P] Revisión de accesibilidad: labels de los checkboxes y radios, `aria-describedby` en los errores, `aria-live` en los conteos, foco al primer campo con error tras enviar (`setFocus`), y el mapa con alternativa por teclado (los campos de latitud y longitud)
- [ ] T048 [P] Verificar que ningún componente envíe `parqueadero_id` a las RPC ni use `.insert/.update/.delete` sobre las tablas (`rg "from\('parqueaderos'\)\.(insert|update|delete)|from\('ofertas_vehiculo'\)" src` sin resultados)
- [ ] T049 Ejecutar `npm run lint`, `npm run typecheck`, `npm test` y `npm run db:test` en verde
- [ ] T050 Validación manual completa de `specs/002-gestion-parqueadero/quickstart.md`, con los resultados en `specs/002-gestion-parqueadero/checklists/validacion-manual.md`
- [ ] T051 Actualizar `CLAUDE.md` (bloque SPECKIT) y `README.md` si cambió algún comando

---

## Dependencies & Execution Order

- **Setup (1)** → **Foundational (2)** → stories.
- T003 → T004…T009 (en paralelo) → T010 (requiere el proyecto enlazado) → T014/T018 (usan `database.types.ts`).
- T002 (mocks) antes de las tareas de páginas (T032, T036, T039, T043, T045).
- **US1** y **US2** son independientes entre sí tras la Foundational (US1 navega a `/admin`; si US2 no está, se ve el placeholder del Provider). Se recomienda US1 → US2.
- **US3**, **US4** y **US5** necesitan un parqueadero existente para la prueba manual (US1), pero sus pruebas automatizadas son independientes (mocks).
- **US4** reutiliza `ParqueaderoForm` (US1): implementar US1 primero.

### Parallel Opportunities

- T004–T009 (pgTAP) en paralelo.
- T011–T017 en paralelo.
- T023 y T024 en paralelo con T018–T022.
- Dentro de cada story, las tareas de pruebas [P] van en paralelo.

## Parallel Example: Foundational

```bash
Task: "T015 domain.ts"     Task: "T016 domain.test.ts"
Task: "T017 rpcErrors.ts"  Task: "T012 format.ts"
Task: "T023 componentes UI" Task: "T024 MapBase + markerIcons"
```

## Implementation Strategy

1. Foundational completa (la base de datos primero, porque es la fuente de verdad de las reglas).
2. **MVP**: US1 + US2 (registrar y consultar) → validar → commit.
3. US3 (ocupación, el valor diario) → US4 (edición) → US5 (celdas).
4. Polish → merge a `main`.
5. Commits: `feat(002): T039 gestión de ocupación`.
