# Implementation Plan: Gestión del Parqueadero por el Administrador

**Branch**: `002-gestion-parqueadero` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-gestion-parqueadero/spec.md`

## Summary

Sobre la base de la 001 (sesión aal2, `AdminLayout`, guards y helper `es_sesion_aal2`), esta feature agrega:

- **Backend**: las tablas `parqueaderos` y `ofertas_vehiculo` con `CHECK`, RLS de solo lectura para el dueño
  con aal2, y 5 RPC `security definer` que concentran todas las escrituras y reglas de negocio (registro,
  edición atómica, configuración de celdas, ingreso y salida atómicos).
- **Frontend**: `MiParqueaderoProvider`, el panel HU4, el formulario compartido de registro y edición con el
  mapa selector Leaflet, la pantalla "Configurar celdas" y la pantalla "Gestionar ocupación".

## Technical Context

**Language/Version**: TypeScript 5 (strict), SQL/PLpgSQL (PostgreSQL de Supabase)

**Primary Dependencies**: las de la 001 + `leaflet@1.9` y `react-leaflet@4.2` (React 18) + `@types/leaflet`; dev: `otpauth` (solo para la prueba de integración opcional)

**Storage**: Supabase PostgreSQL: `public.parqueaderos` y `public.ofertas_vehiculo` (ver `data-model.md`)

**Testing**: Vitest + Testing Library (dominio, esquema, mapeos, errores, componentes con lógica) y pgTAP (`supabase/tests/002_*.test.sql`, 6 archivos)

**Target Platform**: la de la 001 (navegadores modernos, ≥ 360 px)

**Project Type**: SPA + BaaS

**Performance Goals**: ingreso o salida reflejados en menos de 2 s (SC-002); panel con datos en menos de 2 s

**Constraints**: escrituras solo por RPC; sin `parqueadero_id` enviado por el cliente; sin datos de ejemplo; textos literales de HU3 a HU7

**Scale/Scope**: menos de 50 parqueaderos; 5 pantallas o estados (panel vacío, panel, formulario × 2 modos, celdas, ocupación)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|-----------|----------------|--------|
| I. HU como fuente de verdad | FR-001…FR-030 trazados a HU3–HU7; tabla *Desviaciones e interpretaciones* en la spec; mensajes en `MSG` | ✅ |
| II. Seguridad en BD | RLS en ambas tablas; `revoke` de las escrituras directas; RPC `security definer` con `es_sesion_aal2()`, propiedad por `auth.uid()` y `search_path = ''`; `CHECK` para las invariantes; pgTAP de aislamiento | ✅ |
| III. Simplicidad | 2 tablas, 5 RPC, Context en lugar de librerías de datos; formulario único para HU3 y HU5; sin seed | ✅ (ver la nota sobre `security definer` en *Complexity Tracking*) |
| IV. Reglas verificables | Funciones puras en `domain.ts`, `formMapping.ts` y `rpcErrors.ts` con Vitest; 6 suites pgTAP; prueba de concurrencia opcional | ✅ |
| V. UX en español y fiel | Pantallas según HU03 a HU07 (`contracts/ui.md`); `formatCOP` es-CO; `aria-live` en los conteos | ✅ |

**Post-design re-check**: ✅ Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/002-gestion-parqueadero/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── db-schema.md        # SQL normativo: tablas, RLS, RPC y pruebas pgTAP
│   ├── parqueadero-api.md  # API TS, dominio, mapeos y mensajes
│   └── ui.md               # rutas, guards, menú y pantallas
├── checklists/requirements.md
└── tasks.md
```

### Source Code (nuevos o modificados)

```text
src/
├── lib/
│   ├── result.ts                      # NUEVO: type Result<T, C extends string> (la 001 lo reutiliza; refactor menor)
│   ├── format.ts                      # NUEVO: formatCOP, formatCoord, normalizeDecimal
│   ├── database.types.ts              # NUEVO: generado con supabase gen types
│   └── messages.ts                    # MODIFICADO: secciones parqueadero, celdas, ocupacion
├── components/
│   ├── ui/
│   │   ├── Checkbox.tsx               # NUEVO
│   │   ├── RadioCard.tsx              # NUEVO (estado Activo/Inactivo, tipo de vehículo)
│   │   ├── NumberStepper.tsx          # NUEVO (− input +)
│   │   ├── Badge.tsx                  # NUEVO (estado)
│   │   └── Breadcrumbs.tsx            # NUEVO
│   ├── map/
│   │   ├── MapBase.tsx                # NUEVO (la 003 lo reutiliza)
│   │   ├── markerIcons.ts             # NUEVO (la 003 lo reutiliza)
│   │   └── LocationPicker.tsx         # NUEVO
│   └── layout/AdminSidebar.tsx        # MODIFICADO: ítems condicionados a useMiParqueadero
├── features/parqueadero/
│   ├── types.ts
│   ├── domain.ts (+ .test.ts)
│   ├── schemas.ts (+ .test.ts)        # parqueaderoFormSchema, celdasSchema
│   ├── formMapping.ts (+ .test.ts)
│   ├── rpcErrors.ts (+ .test.ts)
│   ├── parqueaderoService.ts (+ .test.ts)
│   ├── MiParqueaderoProvider.tsx
│   ├── guards/
│   │   ├── RequireParqueadero.tsx
│   │   └── RequireSinParqueadero.tsx  (+ guards.test.tsx)
│   ├── components/
│   │   ├── ParqueaderoForm.tsx (+ .test.tsx)
│   │   ├── ParqueaderoResumen.tsx
│   │   ├── DisponibilidadCards.tsx
│   │   └── AvisoPublicacion.tsx
│   └── pages/
│       ├── PanelPage.tsx (+ .test.tsx)
│       ├── RegistrarParqueaderoPage.tsx
│       ├── EditarParqueaderoPage.tsx
│       ├── ConfigurarCeldasPage.tsx (+ .test.tsx)
│       └── GestionarOcupacionPage.tsx (+ .test.tsx)
├── pages/admin/PanelPage.tsx          # ELIMINADO (placeholder de la 001; la ruta usa features/parqueadero/pages/PanelPage)
└── app/router.tsx                     # MODIFICADO: rutas nuevas, MiParqueaderoProvider en AdminLayout

supabase/
├── migrations/20261017000200_parqueaderos.sql
└── tests/002_schema|rls|rpc_registrar|rpc_actualizar|rpc_celdas|rpc_ocupacion.test.sql

tests/integration/ocupacion-concurrente.test.ts   # opcional (skipIf sin variables E2E_*)
```

**Structure Decision**: se mantiene la estructura de la 001. Toda la lógica nueva vive en
`src/features/parqueadero`; los componentes de mapa van a `src/components/map` porque la 003 los reutiliza.

## Design Notes

1. **Orden de implementación sugerido**: migración + pgTAP → `database.types.ts` → dominio, esquemas y
   mapeos → servicio → Provider y guards → panel → formulario → celdas → ocupación.
2. **Desmarcar un tipo en la edición** (FR-018): en `ParqueaderoForm`, el `onChange` del checkbox consulta
   `puedeQuitarTipo(ofertaGuardada)`. Si devuelve `false`, no cambia el valor y muestra la advertencia bajo el
   grupo. El servidor lo revalida (`TIPO_CON_CELDAS`).
3. **Ocultar los campos de un tipo desmarcado**: se desregistran (`shouldUnregister: true` en esos campos o
   `unregister`) para que `superRefine` no los valide.
4. **`LocationPicker` y campos de texto**: estado único en react-hook-form (`latitud` y `longitud` como
   string). El mapa lee los valores con `watch` y solo mueve el marcador si ambos son válidos. El clic o
   arrastre escribe con `setValue(..., { shouldValidate: true, shouldDirty: true })`.
5. **Leaflet en pruebas**: jsdom no soporta Leaflet bien; en las pruebas de `ParqueaderoForm`, mockear
   `src/components/map/LocationPicker` con un componente simple.
6. **Tras ingreso o salida** se usa la fila devuelta por la RPC (`actualizarOferta`) para actualizar la UI
   sin recargar todo. Tras registrar, editar o configurar celdas se hace `await recargar()` antes de navegar
   al panel.
7. **Tipos generados**: después de `db push`, ejecutar `npx supabase gen types typescript --linked >
   src/lib/database.types.ts` y versionarlo.
8. **`Result` genérico**: se mueve a `src/lib/result.ts` como `Result<T, C extends string = string>` y
   `authService` (001) pasa a importarlo. Es un cambio mecánico y no altera el comportamiento.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (No es violación; nota) Funciones `security definer` | Las reglas entre filas y la atomicidad (edición + capacidad, ingreso/salida) requieren un camino único de escritura | Escrituras directas con RLS + triggers dispersan las reglas y no garantizan la atomicidad de varias tablas desde el cliente |
