# Implementation Plan: Consulta Pública de Parqueaderos

**Branch**: `003-consulta-publica` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-consulta-publica/spec.md`

## Summary

Página pública `/` con el mapa Leaflet de los parqueaderos publicables, la lista lateral, el panel de detalle
y el enlace "Cómo llegar" a Google Maps. Los datos llegan de una única función SQL `security definer`
(`listar_parqueaderos_publicos`), ejecutable por `anon`, que aplica la regla de publicabilidad y expone solo
las columnas públicas. Reutiliza `MapBase` y `markerIcons` de la 002 y `PublicLayout` de la 001.

## Technical Context

**Language/Version**: TypeScript 5 (strict), SQL

**Primary Dependencies**: las existentes (React, react-router-dom, supabase-js, leaflet, react-leaflet, lucide-react). Ninguna nueva

**Storage**: lectura de `public.parqueaderos` y `public.ofertas_vehiculo` (002) vía RPC

**Testing**: Vitest + Testing Library; pgTAP `supabase/tests/003_publico.test.sql`

**Target Platform**: navegadores modernos, desktop y móvil (≥ 360 px)

**Project Type**: SPA + BaaS

**Performance Goals**: mapa con datos en menos de 3 s en 4G (SC-002); una sola petición de datos

**Constraints**: acceso anónimo sin exponer `admin_id`; sin tiempo real, búsqueda, filtros ni clustering; Google Maps solo por URL

**Scale/Scope**: ≤ 50 parqueaderos; 1 página con 4 componentes principales

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|-----------|----------------|--------|
| I. HU como fuente de verdad | FR-001…FR-017 trazados a HU9–HU11; desviaciones de los prototipos documentadas | ✅ |
| II. Seguridad en BD | `anon` sin `SELECT` en las tablas; función de solo lectura que filtra por publicabilidad y omite `admin_id`; pgTAP lo verifica | ✅ |
| III. Simplicidad | 1 función SQL, 1 petición, estado local + query string; sin dependencias nuevas | ✅ |
| IV. Reglas verificables | pgTAP de publicabilidad; Vitest para el dominio (URL de Maps, lleno, resumen) y los componentes | ✅ |
| V. UX en español y fiel | Layout según HU09/HU10/HU11; `formatCOP`; detalle accesible (dialog en móvil, Esc) | ✅ |

**Post-design re-check**: ✅ Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/003-consulta-publica/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── public-rpc.md   # SQL de la función, respuesta, tipos TS y pgTAP
│   └── ui.md           # ruta, componentes, textos y comportamiento
├── checklists/requirements.md
└── tasks.md
```

### Source Code (nuevos o modificados)

```text
src/
├── lib/messages.ts                         # MODIFICADO: sección publico
├── components/map/markerIcons.ts           # MODIFICADO: variantes 'lleno' (gris) y 'seleccionado'
├── features/publico/
│   ├── types.ts
│   ├── domain.ts (+ .test.ts)
│   ├── publicoService.ts (+ .test.ts)
│   ├── components/
│   │   ├── ParqueaderosMap.tsx
│   │   ├── MapLegend.tsx
│   │   ├── ParqueaderosList.tsx (+ .test.tsx)
│   │   └── ParqueaderoDetalle.tsx (+ .test.tsx)
│   └── pages/
│       └── MapaParqueaderosPage.tsx (+ .test.tsx)
├── pages/public/HomePage.tsx               # ELIMINADO (placeholder de la 001)
└── app/router.tsx                          # MODIFICADO: '/' → MapaParqueaderosPage

supabase/
├── migrations/20261017000300_consulta_publica.sql
└── tests/003_publico.test.sql
```

**Structure Decision**: un nuevo feature folder `src/features/publico`, que reutiliza `src/components/map` y
`src/features/parqueadero/types.ts` (tipo `TipoVehiculo` y `ETIQUETA_TIPO`).

## Design Notes

1. **Leaflet en pruebas**: mockear `ParqueaderosMap` en las pruebas de la página; probar `ParqueaderosList`
   y `ParqueaderoDetalle` sin mapa.
2. **`fitBounds` solo una vez** (en la primera carga con datos), para no "saltar" cuando el Usuario ya
   movió el mapa. Al seleccionar se usa `flyTo`.
3. **Altura del mapa**: Leaflet necesita un alto explícito en el contenedor. Si el contenedor cambia de
   tamaño (por ejemplo, cuando se abre el detalle en desktop), llamar a `map.invalidateSize()`.
4. **Enlace "Cómo llegar"**: `<a>` real con `target="_blank"` y `rel="noopener noreferrer"`; no
   `window.open`.
5. **Sesión del admin**: la página no depende de `useAuth`; un admin autenticado ve lo mismo que un anónimo.
   El cliente Supabase envía su JWT si existe, y la función funciona con ambos roles.

## Complexity Tracking

Sin violaciones. No aplica.
