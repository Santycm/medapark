---
description: "Task list for 003-consulta-publica (back existente; cambios del back solo vía CB-NNN autorizado)"
---

# Tasks: Consulta Pública de Parqueaderos

**Input**: Design documents from `specs/003-consulta-publica/`

**Prerequisites**: features 001 y 002 implementadas; plan.md, spec.md, research.md, data-model.md, contracts/ (public-view, ui), quickstart.md

**Tests**: OBLIGATORIAS (Principio IV): Vitest con `supabase` simulado.

**⚠️ Reglas**: esta feature no cambia Supabase; cambios en el back solo vía CB-NNN autorizado (🔴 CRITICIDAD ALTA, `docs/cambios-back/`); no eliminar pantallas del repo; no hacer push a `main`.

**Organization**: US1 = HU9 Mapa (P1), US2 = HU10 Detalle (P1), US3 = HU11 Cómo llegar (P2).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Crear la rama `feature/003-consulta-publica` desde `develop` (con la 002 integrada) y fijar `.specify/feature.json` en `specs/003-consulta-publica`
- [X] T002 [P] **Mocks (Pencil MCP)** (hechos: `design/mocks/12` y `13`; archivo `docs/medapark-ux.pen`): en `design/medapark.pen`, *Mapa público, desktop* (base `docs/prototipos/HU09-mapa-parqueaderos.jpg`, **sin** menú lateral ni "Usuario/Cerrar sesión", con el encabezado logo + "Acceso administradores", la lista "Parqueaderos activos (N)", la leyenda verde/gris y un marcador gris "Sin celdas disponibles"), *Detalle, desktop* (base `HU10-detalle-parqueadero.jpg`, sin badge "Activo"), *Móvil 375 px* (mapa + lista y detalle a pantalla completa) y los estados *vacío* y *error*. Requisito previo de T010, T015 y T018

---

## Phase 2: Foundational

- [X] T003 [P] Extender `src/lib/messages.ts` con la sección `publico` de `contracts/ui.md`
- [X] T004 [P] Crear `src/domain/publicParking.ts` (`contracts/public-view.md` §3)
- [X] T005 [P] Pruebas `src/domain/publicParking.test.ts`: `toPublicParking` con ambos tipos, solo autos, solo motos, un tipo con capacidad 0 (se incluye) y una fila sin id o sin coordenadas (→ `null`); `googleMapsUrl(6.2518, -75.568)` → `https://www.google.com/maps/dir/?api=1&destination=6.2518,-75.568` y 7 decimales redondeados a 6; `hasValidCoordinates` (`NaN`, 91 → false); `isFull`; `availabilitySummary` con 1 y 2 tipos; `sortByName` con tildes
- [X] T006 Agregar `listPublicParkings()` en `src/services/parkings.ts` (usa la consulta existente; mapea con `toPublicParking`, filtra los `null`, ordena; error → `{ ok: false, code: 'RED', message: MSG.publico.errorCarga }`), **sin cambiar** `getPublicParkings` ni `getPublicParkingById`, y crear `src/services/parkings.test.ts`
- [X] T007 [P] Extender `src/components/map/markerIcons.ts` con `lleno` y `seleccionado`, y exportar `iconFor(state: 'disponible' | 'lleno' | 'seleccionado')`

---

## Phase 3: User Story 1 - Mapa de parqueaderos (P1) 🎯 MVP · HU9

**Independent Test**: `quickstart.md` §US1.

- [X] T008 [P] [US1] Pruebas `src/components/public/ParkingList.test.tsx`: título "Parqueaderos activos (2)"; orden; lleno → "Sin celdas disponibles"; vacía → "Aún no hay parqueaderos disponibles."; clic → `onSelect(id)`; el seleccionado tiene `aria-current="true"`
- [X] T009 [P] [US1] Pruebas `src/pages/public/Home.test.tsx` (mock de `listPublicParkings` y `ParkingMap`): cargando; listo con título, subtítulo y lista; error → mensaje + "Reintentar" vuelve a llamar; no hay `searchbox`
- [X] T010 [P] [US1] Crear `src/components/public/ParkingList.tsx` y `src/components/public/MapLegend.tsx` (`contracts/ui.md`)
- [X] T011 [US1] Rediseñar `src/components/map/ParkingMarker.tsx` (ícono según el estado, `title` con el nombre, `keyboard: true`, tooltip permanente si está seleccionado, **sin** `Popup`) y `src/components/map/ParkingMap.tsx` (`MapBase`, props `parkings`/`selectedId`/`onSelect`, `fitBounds` en la primera carga, `flyTo` al seleccionar, `MapLegend`, `aria-label`)
- [X] T012 [US1] Rediseñar `src/pages/public/Home.tsx` con `PublicLayout`, `listPublicParkings`, estados (cargando, error y vacío) y el layout de `research.md` §R6 con la lista en la columna derecha; conectar en `src/router/index.tsx` la ruta `/` dentro de `PublicLayout`

---

## Phase 4: User Story 2 - Detalle del parqueadero (P1) · HU10

**Independent Test**: `quickstart.md` §US2.

- [X] T013 [P] [US2] Pruebas `src/components/public/ParkingDetailPanel.test.tsx`: nombre, dirección, horario, teléfono (`tel:`), correo solo si existe, disponibilidad y tarifas solo de las `offers` presentes ("$ 5.000" + "por hora"), nota del último estado, la "X" → `onClose`, `role="dialog"` con título asociado
- [X] T014 [P] [US2] Ampliar `Home.test.tsx`: `?parqueadero=<id>` abre el detalle; clic en la lista agrega el parámetro; Esc lo quita; un id inexistente → `noDisponible` y limpia; `/parking/<id>` redirige a `/?parqueadero=<id>`
- [X] T015 [US2] Crear `src/components/public/ParkingDetailPanel.tsx` (`contracts/ui.md` §ParkingDetailPanel), migrando el contenido útil de `pages/public/ParkingDetail.tsx`; en esta story el botón "Cómo llegar" puede quedar sin enlace
- [X] T016 [US2] Integrar la selección en `Home.tsx` (`research.md` §R5; panel en la columna derecha en desktop y a pantalla completa en móvil; `invalidateSize`). En `src/router/index.tsx`, cambiar `/parking/:id` por la redirección y agregar al inicio de `pages/public/ParkingDetail.tsx` el comentario de que fue reemplazado por `ParkingDetailPanel` (**no** eliminar el archivo)

---

## Phase 5: User Story 3 - Cómo llegar (P2) · HU11

**Independent Test**: `quickstart.md` §US3.

- [X] T017 [P] [US3] Ampliar `ParkingDetailPanel.test.tsx`: "Cómo llegar" es un `link` con `href = googleMapsUrl(lat, lng)`, `target="_blank"` y `rel` con `noopener`; sin coordenadas válidas, el enlace no se renderiza
- [X] T018 [US3] Completar el enlace "Cómo llegar" en `ParkingDetailPanel.tsx` (estilo de botón outline, ícono `Navigation`, texto accesible "Cómo llegar a <nombre> (se abre en Google Maps)")

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T019 [P] Revisión responsive (360, 768, 1024 y 1440 px) y de accesibilidad (marcadores enfocables, lista con teclado, foco en el panel móvil y devolución al cerrar, contraste del gris)
- [X] T020 [P] Verificar que no quedan usos de la URL `maps/search` (`rg "maps/search" src` sin resultados en el código activo)
- [X] T021 `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde
- [ ] T022 Validación manual de `quickstart.md` y del flujo end-to-end 001 → 002 → 003; resultados en `specs/003-consulta-publica/checklists/validacion-manual.md`
- [ ] T023 PR `feature/003-consulta-publica` → `develop`. El paso `develop` → `main` (que publica en Netlify) lo decide y ejecuta el equipo

---

## Dependencies & Execution Order

- Setup → Foundational (T004 → T005/T006) → US1 → US2 → US3 → Polish.
- T002 (mocks) antes de T010, T015 y T018.
- Paralelo: T003, T004, T005 y T007; T008 ∥ T009 ∥ T010; T013 ∥ T014.

## Implementation Strategy

1. Foundational (mapeo de la vista con pruebas).
2. **MVP**: US1 (mapa + lista) → US2 (detalle) → US3 (Cómo llegar).
3. Polish → PR a `develop`.
