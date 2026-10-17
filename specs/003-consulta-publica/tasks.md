---
description: "Task list for 003-consulta-publica"
---

# Tasks: Consulta Pública de Parqueaderos

**Input**: Design documents from `specs/003-consulta-publica/`

**Prerequisites**: features 001 y 002 implementadas; plan.md, spec.md, research.md, data-model.md, contracts/ (public-rpc, ui), quickstart.md

**Tests**: OBLIGATORIAS (constitución, Principio IV): pgTAP para la publicabilidad y el acceso anónimo; Vitest para el dominio, el servicio y los componentes.

**Organization**: US1 = HU9 Mapa (P1), US2 = HU10 Detalle (P1), US3 = HU11 Cómo llegar (P2).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] **Mocks (Pencil MCP, en otra sesión)**: agregar en `design/medapark.pen` las pantallas *Mapa público, desktop* (base `docs/prototipos/HU09-mapa-parqueaderos.jpg`, **sin** menú lateral ni "Usuario/Cerrar sesión", con el encabezado logo + "Acceso administradores", la lista "Parqueaderos activos (N)", la leyenda verde/gris y el marcador gris "Sin celdas disponibles"), *Detalle, desktop* (base `HU10-detalle-parqueadero.jpg`, sin badge "Activo"), *Mapa y detalle en móvil (375 px)* y los *estados vacío y de error*. Requisito previo de T012, T016 y T019

---

## Phase 2: Foundational

- [ ] T002 Crear `supabase/migrations/20261017000300_consulta_publica.sql` con el SQL **exacto** de `contracts/public-rpc.md` (función, comentario, `revoke` y `grant`)
- [ ] T003 [P] Crear `supabase/tests/003_publico.test.sql` con los 7 casos de `contracts/public-rpc.md` §Pruebas pgTAP (reutilizar el patrón de fixture de `specs/002-gestion-parqueadero/contracts/db-schema.md` §4: 4 usuarios en `auth.users`, parqueaderos y ofertas insertados como `postgres`, y luego `set local role anon`)
- [ ] T004 Aplicar y probar: `npx supabase db push`, `npx supabase test db --linked` en verde y regenerar `src/lib/database.types.ts` (`npx supabase gen types typescript --linked`)
- [ ] T005 [P] Crear `src/features/publico/types.ts` según `contracts/public-rpc.md` §Tipos TypeScript
- [ ] T006 [P] Extender `src/lib/messages.ts` con la sección `publico` de `contracts/ui.md`
- [ ] T007 [P] Crear `src/features/publico/domain.ts` (`googleMapsUrl`, `coordenadasValidas`, `estaLleno`, `resumenDisponibilidad`, `ordenarPorNombre`) y `domain.test.ts`: `googleMapsUrl(6.2518, -75.568)` → `https://www.google.com/maps/dir/?api=1&destination=6.2518,-75.568`; 7 decimales se redondean a 6; `coordenadasValidas(NaN, 1)` → `false` y `(91, 0)` → `false`; `estaLleno` con todas las disponibles en 0 → `true` y con una > 0 → `false`; `resumenDisponibilidad` con 1 y 2 tipos; el orden es alfabético con tildes (`'Álamo'` antes de `'Bello'`)
- [ ] T008 [P] Crear `src/features/publico/publicoService.ts` (`supabase.rpc('listar_parqueaderos_publicos')`, que convierte `latitud` y `longitud` con `Number()` y devuelve `Result` con el código `RED` ante cualquier error) y `publicoService.test.ts` (mapeo, lista vacía, error → `{ ok: false, code: 'RED', message: MSG.publico.errorCarga }`)
- [ ] T009 [P] Extender `src/components/map/markerIcons.ts` con las variantes `lleno` (pin gris `#8A94A6`) y `seleccionado` (pin `accent-600`, 1.25× de tamaño), y exportar `iconoPara(estado: 'disponible' | 'lleno' | 'seleccionado')`

**Checkpoint**: la función responde como `anon` y el dominio y el servicio están probados.

---

## Phase 3: User Story 1 - Visualizar el mapa de parqueaderos (P1) 🎯 MVP · HU9

**Goal**: mapa y lista con los parqueaderos publicables, con los estados vacío y de error.

**Independent Test**: `quickstart.md` §US1.

### Tests for User Story 1

- [ ] T010 [P] [US1] Pruebas `src/features/publico/components/ParqueaderosList.test.tsx`: título "Parqueaderos activos (2)"; ítems en orden; un lleno muestra "Sin celdas disponibles"; la lista vacía muestra "Aún no hay parqueaderos disponibles."; clic en un ítem → `onSelect(id)`; el seleccionado tiene `aria-current="true"`
- [ ] T011 [P] [US1] Pruebas `src/features/publico/pages/MapaParqueaderosPage.test.tsx` (mock de `publicoService` y de `ParqueaderosMap`): estado cargando; listo, con título, subtítulo y lista; un error muestra `MSG.publico.errorCarga` y "Reintentar" vuelve a llamar al servicio; no hay campo de búsqueda (`queryByRole('searchbox')` es null)

### Implementation for User Story 1

- [ ] T012 [P] [US1] Crear `src/features/publico/components/ParqueaderosList.tsx` según `contracts/ui.md` §ParqueaderosList
- [ ] T013 [P] [US1] Crear `src/features/publico/components/MapLegend.tsx` (pin verde y pin gris con sus textos; posición absoluta abajo a la izquierda sobre el mapa; fondo blanco con sombra)
- [ ] T014 [US1] Crear `src/features/publico/components/ParqueaderosMap.tsx` según `contracts/ui.md` §ParqueaderosMap y `research.md` §R3 (`MapBase`, marcadores con `iconoPara`, `fitBounds` solo en la primera carga con datos, `flyTo` al seleccionar, tooltip del seleccionado, `MapLegend` y `aria-label`)
- [ ] T015 [US1] Crear `src/features/publico/pages/MapaParqueaderosPage.tsx` (carga, estados, layout de `research.md` §R6 con la lista en la columna derecha) y registrarla en `src/app/router.tsx` como índice de `/` dentro de `PublicLayout`; eliminar `src/pages/public/HomePage.tsx`

**Checkpoint**: el mapa y la lista muestran solo los publicables; los inactivos y los que no tienen celdas no aparecen.

---

## Phase 4: User Story 2 - Consultar el detalle de un parqueadero (P1) · HU10

**Goal**: panel de detalle desde un marcador o la lista, con selección en la URL.

**Independent Test**: `quickstart.md` §US2.

### Tests for User Story 2

- [ ] T016 [P] [US2] Pruebas `src/features/publico/components/ParqueaderoDetalle.test.tsx`: muestra el nombre, la dirección, el horario, el teléfono (enlace `tel:`), el correo solo si no es `null`, la disponibilidad y las tarifas ("$ 5.000" y "por hora") solo de los tipos presentes en `ofertas`, y la nota `MSG.publico.notaUltimoEstado`; la "X" llama a `onClose`; tiene `role="dialog"` y el título asociado
- [ ] T017 [P] [US2] Ampliar `MapaParqueaderosPage.test.tsx`: con `?parqueadero=<id existente>` se renderiza el detalle; clic en un ítem de la lista agrega el parámetro; Esc cierra (quita el parámetro); un id inexistente muestra `MSG.publico.noDisponible` y limpia el parámetro

### Implementation for User Story 2

- [ ] T018 [US2] Crear `src/features/publico/components/ParqueaderoDetalle.tsx` según `contracts/ui.md` §ParqueaderoDetalle (secciones 1 a 6; en esta story el botón "Cómo llegar" puede quedar sin enlace y se completa en US3)
- [ ] T019 [US2] Integrar la selección en `MapaParqueaderosPage.tsx` según `research.md` §R5 (`useSearchParams`; `onSelect` desde el mapa y la lista; Esc; id inexistente → `Alert`; en desktop el detalle reemplaza la lista en la columna derecha; en móvil, panel fijo a pantalla completa) y llamar a `map.invalidateSize()` si cambia el layout

**Checkpoint**: el detalle coincide con los datos del administrador y la URL es compartible.

---

## Phase 5: User Story 3 - Generar ruta con Google Maps (P2) · HU11

**Goal**: botón "Cómo llegar" que abre Google Maps con el destino.

**Independent Test**: `quickstart.md` §US3.

### Tests for User Story 3

- [ ] T020 [P] [US3] Ampliar `ParqueaderoDetalle.test.tsx`: "Cómo llegar" es un `link` con `href = googleMapsUrl(lat, lng)`, `target="_blank"` y `rel` que incluye `noopener`; con coordenadas inválidas (`NaN`) el enlace no se renderiza

### Implementation for User Story 3

- [ ] T021 [US3] Completar en `ParqueaderoDetalle.tsx` el enlace "Cómo llegar" (`<a>` con el estilo de botón outline, ícono `Navigation`, `href={googleMapsUrl(...)}`, `target="_blank"`, `rel="noopener noreferrer"`, renderizado solo si `coordenadasValidas`) y el texto accesible "Cómo llegar a <nombre> (se abre en Google Maps)"

**Checkpoint**: las tres stories funcionan; el MVP completo de MedaPark está integrado.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T022 [P] Revisión responsive (360, 768, 1024 y 1440 px): alto del mapa, scroll de la lista, panel móvil y tooltips que no se cortan
- [ ] T023 [P] Revisión de accesibilidad: marcadores enfocables (`keyboard: true`) con `title`; la lista navegable con teclado; foco en "Cerrar detalle" al abrir en móvil y devuelto al ítem al cerrar; contraste del gris de "lleno"
- [ ] T024 [P] Verificar con la consola de desarrollo (sin sesión) que `window.__supabase.from('parqueaderos').select()` falla por permisos y que `rpc('listar_parqueaderos_publicos')` no incluye `admin_id`
- [ ] T025 Ejecutar `npm run lint`, `npm run typecheck`, `npm test` y `npm run db:test` en verde
- [ ] T026 Validación manual completa de `specs/003-consulta-publica/quickstart.md` y del flujo end-to-end de las tres features; registrar los resultados en `specs/003-consulta-publica/checklists/validacion-manual.md`
- [ ] T027 (Opcional) Despliegue en Netlify: conectar el repo, definir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en las variables del sitio, y agregar la URL de Netlify en *Supabase → Authentication → URL Configuration*. Documentarlo en `README.md`

---

## Dependencies & Execution Order

- Setup (T001, mocks) en paralelo con la Foundational; debe estar listo antes de T012, T018 y T021.
- Foundational: T002 → T003 → T004; T005–T009 en paralelo (T007 y T008 dependen de T005 y T006).
- US1 → US2 (el detalle se monta sobre la página de US1) → US3 (completa el detalle).
- Polish al final. T027 es opcional y requiere la aprobación del equipo, porque publica la app.

### Parallel Opportunities

- T005, T006, T007, T008 y T009.
- T010 ∥ T011; T012 ∥ T013; T016 ∥ T017.

## Implementation Strategy

1. Foundational (función SQL + pgTAP primero).
2. **MVP**: US1 (mapa + lista) → validar.
3. US2 (detalle + URL) → US3 (Cómo llegar).
4. Polish → merge a `main` → validación end-to-end de las features 001, 002 y 003.
5. Commits: `feat(003): T014 mapa de parqueaderos`.
