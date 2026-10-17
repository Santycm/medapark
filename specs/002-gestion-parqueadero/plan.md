# Implementation Plan: Gestión del Parqueadero por el Administrador

**Branch**: `feature/002-gestion-parqueadero` | **Date**: 2026-10-17 (rev. back existente; cambios del back vía CB-NNN, CRITICIDAD ALTA) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-gestion-parqueadero/spec.md`

## Summary

Front de la gestión del parqueadero (HU3–HU7) sobre el **back existente sin cambios**:

- lectura del parqueadero propio con sus configuraciones por tipo (RLS del back: dueño + aal2);
- registro y edición con escrituras directas a `parking_lots` y `parking_vehicle_configs`, con validación
  previa completa y orden de guardado seguro (`contracts/back-usage.md`);
- configuración de celdas (`update` de `total_spaces`);
- ingresos y salidas con las RPC existentes `register_vehicle_entry` y `register_vehicle_exit`;
- UI: panel HU4, formulario compartido con el mapa selector, pantallas de celdas y de ocupación.

## Technical Context

**Language/Version**: TypeScript 5 (strict), sobre la base migrada en la 001

**Primary Dependencies**: las del repo + las agregadas en la 001 (react-hook-form, zod, vitest). Mapas con `leaflet` 1.9 + `react-leaflet` 5 (ya instalados). Ninguna dependencia nueva

**Storage**: Supabase (`parking_lots`, `parking_vehicle_configs` y RPC de ocupación) tal como está, más CB-001 (permisos, 🔴 ALTA, pendiente de autorización)

**Testing**: Vitest + Testing Library con `supabase` simulado; validación manual con `quickstart.md`

**Target Platform**: navegadores modernos, ≥ 360 px

**Project Type**: SPA sobre el back Supabase administrado por el equipo (cambios del back vía CB-NNN, CRITICIDAD ALTA)

**Performance Goals**: ingreso o salida reflejados en menos de 2 s (SC-002); panel en menos de 2 s

**Constraints**: cambios en el back solo vía CB-NNN autorizado (🔴 CRITICIDAD ALTA, `docs/cambios-back/`); respetar las políticas existentes (capacidad ≥ 1 al crear un tipo, borrar solo en 0); las escrituras de HU3/HU5/HU6 dependen de **CB-001** (pendiente de autorización)

**Scale/Scope**: menos de 50 parqueaderos; 5 pantallas o estados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|-----------|----------------|--------|
| I. HU como fuente de verdad | FR trazados a HU3–HU7; *Desviaciones* (capacidad mínima 1 al crear, edición no atómica) documentadas | ✅ |
| II. Seguridad y control de cambios del back | Se usan las tablas, la RLS y las RPC existentes; las reglas no expresadas en el back se validan en el front (`docs/supabase-esquema-actual.md` §3); el único cambio del back necesario está en la solicitud CB-001 (🔴 ALTA, con check de autorización) | ✅ |
| III. Simplicidad y reutilización | Context + funciones puras; reutiliza `react-leaflet` y `ParkingMap` del repo; sin librerías de datos | ✅ |
| IV. Reglas verificables | Vitest para `validateEdit`, `diffConfigs`, publicabilidad, esquemas, mapeos, errores, el orden de escritura del servicio y las páginas | ✅ |
| V. UX en español y fiel | Pantallas según HU03–HU07 (`contracts/ui.md`); `formatCOP`; `aria-live` en los conteos | ✅ |

**Post-design re-check**: ✅ Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/002-gestion-parqueadero/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/
│   ├── back-usage.md     # consultas, orden de escritura, RPC y mapeo de errores (back sin cambios)
│   ├── frontend-api.md   # dominio, formulario, provider, formatos y mensajes
│   └── ui.md             # rutas, guards, menú y pantallas
├── checklists/requirements.md
└── tasks.md
```

### Source Code (nuevos o modificados sobre la 001)

```text
src/
├── lib/
│   ├── format.ts (+ .test.ts)                 NUEVO
│   └── messages.ts                            MOD: parqueadero, celdas, ocupacion
├── domain/
│   ├── parking.ts (+ .test.ts)                NUEVO: tipos y reglas puras
│   ├── parkingForm.ts (+ .test.ts)            NUEVO: mapeo del formulario
│   └── schemas/parking.ts (+ .test.ts)        NUEVO: makeParkingFormSchema, spacesSchema
├── services/
│   ├── adminParking.ts (+ .test.ts)           NUEVO: back-usage.md §2–§6
│   └── parkingErrors.ts (+ .test.ts)          NUEVO: back-usage.md §7
├── context/MyParkingProvider.tsx              NUEVO
├── hooks/useMyParking.ts                      NUEVO
├── router/
│   ├── index.tsx                              MOD: rutas de la 002
│   └── guards/RequireParking.tsx · RequireNoParking.tsx (+ guards.test.tsx)   NUEVOS
├── components/
│   ├── common/Checkbox.tsx · RadioCard.tsx · NumberStepper.tsx · Badge.tsx · Breadcrumbs.tsx   NUEVOS
│   ├── layout/AdminLayout.tsx · AdminSidebar.tsx   MOD: MyParkingProvider e ítems condicionales
│   ├── map/MapBase.tsx · markerIcons.ts · LocationPicker.tsx   NUEVOS (ParkingMap/ParkingMarker no cambian aquí)
│   └── parking/ParkingForm.tsx (+ .test.tsx) · ParkingSummary.tsx · AvailabilityCards.tsx · PublishNotice.tsx   NUEVOS
└── pages/app/
    ├── Panel.tsx (+ .test.tsx)                MOD: reemplaza el placeholder (HU4)
    ├── RegisterParking.tsx · EditParking.tsx (+ .test.tsx)   NUEVOS
    ├── ConfigureSpaces.tsx (+ .test.tsx)      NUEVO
    └── ManageOccupancy.tsx (+ .test.tsx)      NUEVO
```

**Structure Decision**: se sigue la organización del repo (pages/app, components/<área>, services) con
las carpetas `domain/` y `context/` introducidas en la 001.

## Design Notes

1. **Orden sugerido**: tipos generados (ya existen de la 001) → dominio, esquemas y mapeos → `parkingErrors`
   → `adminParking` → Provider y guards → panel → formulario + registro → ocupación → edición → celdas.
2. **Validación previa de la edición**: `updateParkingLot` vuelve a llamar `getMyParkingLot()` antes de
   escribir y ejecuta `validateEdit(current.configs, desired)`. Si hay error, no escribe nada.
3. **Escrituras con `.select('id')`**: necesarias para detectar los `update`/`delete` que la RLS deja en 0
   filas sin error.
4. **`LocationPicker` y campos**: un único estado en react-hook-form (`latitude`/`longitude` como
   string). El mapa observa con `watch` y escribe con
   `setValue(..., { shouldValidate: true, shouldDirty: true })`.
5. **Leaflet en pruebas**: mockear `components/map/LocationPicker` en las pruebas del formulario.
6. **Tras ingreso o salida**: `applyOccupancy(configId, occupied)` con el valor devuelto por la RPC; tras
   registrar, editar o configurar: `await reload()` y navegar con `flash`.
7. **Panel con parqueadero sin tipos** (registro incompleto): muestra `avisoSinTipos`, deshabilita
   "Gestionar ocupación" y "Configurar celdas" y deja "Editar información".
8. **Permisos del back**: si la operación devuelve `42501`, se muestra `MSG.general.permisoDenegado` y no se
   navega. Esto es esperado mientras el equipo del back no conceda `INSERT`/`UPDATE`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (Nota, no violación) Edición no atómica, con validación previa y guardado secuencial | El back no ofrece una operación atómica y se minimizan los cambios de criticidad ALTA | Las RPC transaccionales requerirían un cambio en el back (CB-NNN con autorización); queda como mejora futura opcional |
