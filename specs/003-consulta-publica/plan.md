# Implementation Plan: Consulta Pública de Parqueaderos

**Branch**: `feature/003-consulta-publica` | **Date**: 2026-10-17 (rev. back existente, solo front) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-consulta-publica/spec.md`

## Summary

Rediseño de la página pública existente (`pages/public/Home`) según HU9–HU11 y los prototipos:

- mapa con marcadores verde, gris o azul, más leyenda;
- lista lateral "Parqueaderos activos (N)";
- panel de detalle con la selección en la URL (`?parqueadero=`);
- enlace "Cómo llegar" con Maps URLs.

Los datos salen de la vista existente `public_parking_lots` (back sin cambios), mapeados a un dominio
`PublicParking`. Se reutilizan `services/parkings`, `ParkingMap`, `ParkingMarker` y el contenido de
`ParkingDetail` del repo. `/parking/:id` pasa a ser una redirección.

## Technical Context

**Language/Version**: TypeScript 5 (strict)

**Primary Dependencies**: las existentes (React 19, `react-router` 8, supabase-js, leaflet + `react-leaflet` 5, lucide-react). Ninguna nueva

**Storage**: vista `public.public_parking_lots` del back (solo lectura, sin cambios)

**Testing**: Vitest + Testing Library (supabase simulado); validación manual con `quickstart.md`

**Target Platform**: navegadores modernos, desktop y móvil (≥ 360 px)

**Project Type**: SPA (solo front) sobre un back externo

**Performance Goals**: mapa con datos en menos de 3 s en 4G (SC-002); una sola petición

**Constraints**: back sin cambios; sin tiempo real, búsqueda, filtros ni clustering; Google Maps solo por URL; no romper `/parking/:id`

**Scale/Scope**: ≤ 50 parqueaderos; 1 página y 4 componentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|-----------|----------------|--------|
| I. HU como fuente de verdad | FR-001…FR-018 trazados a HU9–HU11; desviaciones de los prototipos documentadas | ✅ |
| II. Back externo, solo front | Solo lectura de la vista existente, que ya aplica la publicabilidad y oculta `admin_id`; ningún SQL | ✅ |
| III. Simplicidad y reutilización | Se reutilizan el servicio y los componentes de mapa del repo; estado local + query string | ✅ |
| IV. Reglas verificables | Vitest para el mapeo de la vista, la URL de Maps, lleno, resumen y los componentes | ✅ |
| V. UX en español y fiel | Layout HU09/HU10/HU11; `formatCOP`; dialog accesible en móvil | ✅ |

**Post-design re-check**: ✅ Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/003-consulta-publica/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/
│   ├── public-view.md   # consulta de la vista existente, mapeo al dominio y URL de Maps
│   └── ui.md            # rutas, componentes, textos y comportamiento
├── checklists/requirements.md
└── tasks.md
```

### Source Code (nuevos o modificados)

```text
src/
├── lib/messages.ts                          MOD: sección publico
├── domain/publicParking.ts (+ .test.ts)     NUEVO
├── services/parkings.ts (+ .test.ts)        MOD: + listPublicParkings (conserva getPublicParkings y getPublicParkingById)
├── components/
│   ├── map/
│   │   ├── markerIcons.ts                   MOD: variantes 'lleno' y 'seleccionado'
│   │   ├── ParkingMap.tsx                   MOD+R: MapBase, selección, fitBounds/flyTo, leyenda
│   │   └── ParkingMarker.tsx                MOD+R: ícono por estado, tooltip y sin popup
│   └── public/
│       ├── ParkingList.tsx (+ .test.tsx)          NUEVO
│       ├── ParkingDetailPanel.tsx (+ .test.tsx)   NUEVO (contenido migrado de ParkingDetail)
│       └── MapLegend.tsx                          NUEVO
├── pages/public/
│   ├── Home.tsx (+ .test.tsx)               MOD+R: página del mapa con PublicLayout
│   └── ParkingDetail.tsx                    SE CONSERVA sin ruta (su URL redirige al panel)
└── router/index.tsx                         MOD: '/' con PublicLayout; '/parking/:id' → redirección
```

**Structure Decision**: se mantiene la estructura del repo. Los componentes públicos nuevos van en
`components/public/`.

## Design Notes

1. **Leaflet en pruebas**: mockear `ParkingMap` en `Home.test.tsx`; probar `ParkingList` y
   `ParkingDetailPanel` sin mapa.
2. **`fitBounds` una sola vez** en la primera carga con datos; `flyTo` al seleccionar.
3. **Alto del mapa explícito** e `invalidateSize()` al cambiar el layout.
4. **"Cómo llegar"**: `<a>` real, nunca `window.open`.
5. **Admin autenticado**: ve lo mismo que un visitante anónimo (la vista funciona con ambos roles).
6. **`ParkingDetail.tsx`** se conserva (decisión del equipo: no eliminar pantallas del repo), pero queda sin
   ruta: su función (HU10) la asume el panel y `/parking/:id` redirige a `/?parqueadero=:id`. Se agrega un
   comentario al inicio del archivo indicando que fue reemplazado por `ParkingDetailPanel`.

## Complexity Tracking

Sin violaciones. No aplica.
