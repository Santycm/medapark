---
description: "Task list for 002-gestion-parqueadero (back existente; cambios del back solo vía CB-NNN autorizado)"
---

# Tasks: Gestión del Parqueadero por el Administrador

**Input**: Design documents from `specs/002-gestion-parqueadero/`

**Prerequisites**: feature 001 implementada; plan.md, spec.md, research.md, data-model.md, contracts/ (back-usage, frontend-api, ui), quickstart.md; `docs/supabase-esquema-actual.md`

**Tests**: OBLIGATORIAS (Principio IV): Vitest con `supabase` simulado. Nada contra el Supabase remoto.

**⚠️ Reglas**: cambios en el back solo vía CB-NNN autorizado (🔴 CRITICIDAD ALTA, `docs/cambios-back/`) (esta feature solo depende de **CB-001**, que no se ejecuta sin autorización); respetar las políticas del back (capacidad ≥ 1 al crear un tipo; borrar un tipo solo con capacidad y ocupadas en 0); no hacer push a `main`.

**Organization**: US1 = HU3 Registrar (P1), US2 = HU4 Panel (P1), US3 = HU7 Ocupación (P2), US4 = HU5 Editar (P2), US5 = HU6 Celdas (P3).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Crear la rama `feature/002-gestion-parqueadero` desde `develop` (con la 001 ya integrada) y fijar `.specify/feature.json` en `specs/002-gestion-parqueadero`
- [X] T002 [P] **Mocks (Pencil MCP)** (hechos en la 001: `design/mocks/06…11`): en `design/medapark.pen`, *Panel sin parqueadero*, *Panel con parqueadero* (base `docs/prototipos/HU04-consultar-mi-parqueadero.jpg`, con los avisos de publicabilidad/sin tipos y el menú "Mi parqueadero / Gestionar ocupación / Configurar celdas"), *Registrar parqueadero* (base `HU03-*.jpg`, **sin** buscador sobre el mapa, con tarifa y capacidad **por tipo**), *Editar* (base `HU05-*.jpg`, con el correo opcional), *Configurar celdas* (base `HU06-*.jpg`, con "Ocupadas actualmente") y *Gestionar ocupación* (base `HU07-*.jpg`, con los botones deshabilitados y sus mensajes). Requisito previo de T024, T028, T031, T036 y T039

---

## Phase 2: Foundational (bloquea las stories)

- [X] T003 [P] Crear `src/lib/format.ts` + `format.test.ts` (`formatCOP(5000)` → `"$ 5.000"`, `1500000` → `"$ 1.500.000"`, `normalizeDecimal("6,2442")` → `"6.2442"`, `formatCoord(6.2442)` → `"6.2442"`)
- [X] T004 [P] Extender `src/lib/messages.ts` con `parqueadero`, `celdas` y `ocupacion` **exactamente** como en `contracts/frontend-api.md` §5
- [X] T005 [P] Crear `src/domain/parking.ts` (tipos de `contracts/back-usage.md` §1 y funciones de `contracts/frontend-api.md` §1, incluidos `validateEdit` y `diffConfigs`)
- [X] T006 [P] Pruebas `src/domain/parking.test.ts`: `availableSpaces`; `isPublishable`/`unpublishedReason` (todas las filas de la tabla de publicabilidad de `data-model.md`, con la prioridad inactivo > sin_tipos > sin_celdas); `isOutsideMedellin` (Parque Berrío → false, Bogotá → true, bordes → false); `canRemoveType`; `validateEdit` (sin tipos, quitar con capacidad > 0, capacidad < ocupadas, tipo nuevo con 0, caso válido); `diffConfigs` (actualizar, borrar, insertar y combinaciones); `sortConfigs`
- [X] T007 [P] Crear `src/services/parkingErrors.ts` + `parkingErrors.test.ts` (una fila por caso de `contracts/back-usage.md` §7, incluidos `23514` con y sin `parking_vehicle_configs_check` y los textos de las RPC)
- [X] T008 Crear `src/services/adminParking.ts` según `contracts/back-usage.md` §2–§6 y §8 (escrituras con `.select('id')`; validación previa y orden de escritura en `updateParkingLot`; registro en 2 pasos con `registroIncompleto`; ante `SESION` llama a `handleSessionError` de la 001)
- [X] T009 [P] Pruebas `src/services/adminParking.test.ts` (mock de `supabase`): `registerParkingLot` envía `admin_id` y `contact_email: null` si está vacío; si el paso 2 falla → `registroIncompleto`; `23505` → `yaExiste`; `updateParkingLot` relee, valida y **no escribe** si `validateEdit` falla; respeta el orden update → delete → insert → update del parqueadero; `delete` con `[]` → `quitarTipo`; un fallo posterior al primer paso → `guardadoParcial`; `42501` → `permisoDenegado`; `registerEntry` devuelve el número de ocupadas y mapea `sin capacidad disponible`
- [X] T010 Crear `src/context/MyParkingProvider.tsx` + `src/hooks/useMyParking.ts` (`contracts/frontend-api.md` §3) y montarlo en `src/components/layout/AdminLayout.tsx` envolviendo el `<Outlet/>`
- [X] T011 Crear `src/router/guards/RequireParking.tsx` y `RequireNoParking.tsx` + `guards.test.tsx` (cargando, error con "Reintentar", sin y con parqueadero)
- [X] T012 Actualizar `src/components/layout/AdminSidebar.tsx` con los ítems de `contracts/ui.md` §Menú lateral (condicionados por `useMyParking`)
- [X] T013 [P] Crear `src/components/common/Checkbox.tsx`, `RadioCard.tsx`, `NumberStepper.tsx` (+ `NumberStepper.test.tsx`: mínimo, máximo, solo dígitos y botones deshabilitados en los límites), `Badge.tsx` y `Breadcrumbs.tsx`
- [X] T014 [P] Crear `src/components/map/markerIcons.ts` y `src/components/map/MapBase.tsx` (`research.md` §R8). No modificar `ParkingMap.tsx` ni `ParkingMarker.tsx` (los rediseña la 003)
- [X] T015 Registrar en `src/router/index.tsx` las rutas de `contracts/ui.md` con sus guards, usando componentes temporales para las páginas que aún no existen

**Checkpoint**: `npm test` en verde; el menú y los guards responden al estado del parqueadero.

---

## Phase 3: User Story 1 - Registrar mi parqueadero (P1) 🎯 MVP · HU3

**Independent Test**: `quickstart.md` §US1.

- [X] T016 [P] [US1] Pruebas `src/domain/schemas/parking.test.ts` (`makeParkingFormSchema` en modo `registrar`): vacío → errores en los requeridos; ningún tipo → error de grupo; tipo marcado sin tarifa ni capacidad → errores; tipo desmarcado con campos vacíos → válido; teléfono `300-123` y `123456` → mensajes; correo vacío válido; `contacto@dominio` inválido; `"6,2442"` válido; `95`/`-181` → rango; tarifa `0`/`1000000` → `tarifaRango`; capacidad `0` → `capacidadNueva`; `2.5` → error; nombre de solo espacios = vacío
- [X] T017 [P] [US1] Pruebas `src/domain/parkingForm.test.ts` (`toParkingInput` arma 1 o 2 configs, convierte a número, recorta y devuelve `null` si el correo está vacío; `toFormValues` es inversa; `status` boolean ↔ `'activo' | 'inactivo'`)
- [X] T018 [P] [US1] Pruebas `src/components/parking/ParkingForm.test.tsx` (mock de `LocationPicker`): mostrar y ocultar los campos por tipo; enviar vacío → resumen sin `onSubmit`; aviso fuera de Medellín que no bloquea; en modo `registrar` no hay Estado y el botón dice "Guardar"
- [X] T019 [P] [US1] Crear `src/domain/schemas/parking.ts` y `src/domain/parkingForm.ts` (`contracts/frontend-api.md` §2; reglas de `data-model.md` §Esquema)
- [X] T020 [US1] Crear `src/components/map/LocationPicker.tsx` (`research.md` §R8; `aria-label="Mapa para seleccionar la ubicación del parqueadero"`)
- [X] T021 [US1] Crear `src/components/parking/ParkingForm.tsx` (props `mode`, `defaultValues`, `savedConfigs?`, `onSubmit`, `onCancel`, `submitting`, `serverError?`) con el layout y los textos de `contracts/ui.md` (sin Estado ni la regla de desmarcar en esta story)
- [X] T022 [US1] Crear `src/pages/app/RegisterParking.tsx`: `registerParkingLot(user.id, toParkingInput(v))`; éxito → `await reload()` y `/admin` con `flash = registrado`; `registroIncompleto`/`yaExiste` → `reload()` y `/admin` con ese mensaje; otros errores → `serverError`; "Cancelar" → `/admin`

---

## Phase 4: User Story 2 - Panel de mi parqueadero (P1) · HU4

**Independent Test**: `quickstart.md` §US2.

- [X] T023 [P] [US2] Pruebas `src/pages/app/Panel.test.tsx` (provider simulado): sin parqueadero → solo "Registrar parqueadero"; con parqueadero → datos, "No registrado" si no hay correo, "$ 5.000" y "Automóviles: 15 disponibles / 20"; solo motos → sin "Automóviles"; inactivo → `avisoInactivo`; capacidad 0 → `avisoSinCeldas` y "Gestionar ocupación" deshabilitado; sin tipos → `avisoSinTipos`; `flash` visible
- [X] T024 [P] [US2] Crear `src/components/parking/AvailabilityCards.tsx` (prop `showOccupied`; texto `sr-only` "Automóviles: 15 disponibles / 20"), `PublishNotice.tsx` y `ParkingSummary.tsx`
- [X] T025 [US2] Reemplazar `src/pages/app/Panel.tsx` según `contracts/ui.md` §Panel (estado vacío, encabezado con badge, flash con autocierre a los 5 s y limpieza del state, aviso, tarjeta de información, disponibilidad y accesos)

**Checkpoint**: US1 + US2 = MVP de la feature.

---

## Phase 5: User Story 3 - Gestionar ocupación (P2) · HU7

**Independent Test**: `quickstart.md` §US3.

- [X] T026 [P] [US3] Pruebas `src/pages/app/ManageOccupancy.test.tsx`: conteos por tipo; botones deshabilitados con sus mensajes; un solo tipo → no se muestra el otro; éxito → `applyOccupancy` y "Ingreso registrado"; `SIN_DISPONIBLES` → mensaje + `reload`; botón deshabilitado durante la petición; capacidad total 0 → `sinCapacidad` + enlace a celdas
- [X] T027 [US3] Crear `src/pages/app/ManageOccupancy.tsx` según `contracts/ui.md` §ManageOccupancy, usando `registerEntry`/`registerExit` con el `id` de la configuración del tipo seleccionado

---

## Phase 6: User Story 4 - Editar mi parqueadero (P2) · HU5

**Independent Test**: `quickstart.md` §US4.

- [X] T028 [P] [US4] Ampliar `ParkingForm.test.tsx` (modo `editar`): precarga; Estado con 2 opciones y descripciones; desmarcar un tipo con capacidad guardada > 0 → sigue marcado + `quitarTipo`; con 0 → se desmarca; capacidad 0 permitida en un tipo guardado, pero no en uno nuevo; "Guardar cambios"; `serverError` de capacidad se ubica en el campo del tipo
- [X] T029 [P] [US4] Pruebas `src/pages/app/EditParking.test.tsx` (éxito → `reload` + flash `actualizado`; "Cancelar" no llama al servicio; error de validación previa → mensaje sin navegar; `guardadoParcial` → mensaje y `reset` con los datos recargados)
- [X] T030 [US4] Completar `ParkingForm.tsx` para `mode="editar"` (Estado con `RadioCard`, `canRemoveType` en el checkbox, `savedTypes` para el esquema y mapeo de `serverError` a campos)
- [X] T031 [US4] Crear `src/pages/app/EditParking.tsx` (`defaultValues = toFormValues(parking)`, `updateParkingLot({ ...toParkingInput(v), status: v.status === 'activo' })`)

---

## Phase 7: User Story 5 - Configurar celdas (P3) · HU6

**Independent Test**: `quickstart.md` §US5.

- [X] T032 [P] [US5] Pruebas `src/pages/app/ConfigureSpaces.test.tsx`: solo los tipos atendidos; total recalculado; un valor menor a las ocupadas → `reducir` antes de enviar, sin llamar al servicio; `CAPACIDAD_MENOR_A_OCUPADAS` del servidor → mensaje + `reload`; éxito → flash `actualizadas`; "Cancelar" sin guardar
- [X] T033 [US5] Crear `src/pages/app/ConfigureSpaces.tsx` según `contracts/ui.md` §ConfigureSpaces (`NumberStepper` 0–9999, "Ocupadas actualmente", total; `configureSpaces` solo con los tipos cuyo valor cambió)

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T034 [P] Revisión responsive (360, 768 y 1280 px) y de accesibilidad (labels, `aria-describedby`, `aria-live`, foco al primer error, latitud y longitud como alternativa al mapa)
- [X] T035 [P] Verificar que todo `.sql` del repo esté en `supabase/migrations/` y corresponda a una solicitud `CB-NNN` **autorizada** (`git ls-files "*.sql"`), y que ninguna escritura omita `.select('id')`
- [X] T036 `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde
- [ ] T037 Validación manual de `quickstart.md` (incluido el caso de permisos del back) con los resultados en `specs/002-gestion-parqueadero/checklists/validacion-manual.md`
- [X] T038 Actualizar `CLAUDE.md` y `README.md` si cambió algún comando
- [ ] T039 PR `feature/002-gestion-parqueadero` → `develop`

---

## Dependencies & Execution Order

- Setup → Foundational → stories. T002 (mocks) antes de las páginas.
- T005 → T006/T008; T007 → T008 → T009; T010 → T011/T012.
- US1 → US2 (recomendado); US3, US4 y US5 necesitan un parqueadero para la prueba manual. US4 reutiliza `ParkingForm` (US1).
- Paralelo: T003–T007, T013 y T014; las pruebas [P] de cada story.

## Implementation Strategy

1. Foundational (dominio + servicio, con pruebas exhaustivas del orden de escritura).
2. **MVP**: US1 + US2 → validar (incluido el caso de permisos del back).
3. US3 → US4 → US5 → Polish → PR a `develop`.
