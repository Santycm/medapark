<!--
Sync Impact Report
- Version change: 2.1.0 → 3.0.0 (MAJOR: Principio II redefinido; el equipo administra el back y todo cambio en él
  es de CRITICIDAD ALTA con check de autorización obligatorio, ver docs/cambios-back/)
- Previous: 2.0.0 → 2.1.0 (MINOR: los cambios se hacen solo con IA; AGENTS.md es vinculante; CHANGELOG obligatorio)
- Previous: 1.0.1 → 2.0.0 (MAJOR: Principio II redefinido; integración con el repo Santycm/medapark)
  - Principio II (redefinido): el back (Supabase) es externo y lo administran otras personas. Este proyecto
    es solo front: no hay migraciones ni cambios de esquema. Los agentes de IA solo leen el Supabase remoto.
  - Principio III: la estructura sigue las convenciones del repo existente (pages/components/services).
  - Principio IV: se eliminan las pruebas pgTAP (no hay SQL propio); pruebas Vitest con el cliente
    Supabase simulado.
  - Restricciones técnicas: stack del repo migrado a TypeScript (React 19, react-router 8,
    react-leaflet 5, Vite 8, Tailwind 4).
  - Flujo de trabajo: Gitflow (main → Netlify; develop; feature/NNN-nombre).
- Previous: 1.0.0 → 1.0.1 (PATCH: sin datos de ejemplo); (template) → 1.0.0
- Principles defined:
  I. Las historias de usuario son la fuente de verdad
  II. Seguridad en la base de datos (RLS + MFA aal2)
  III. Simplicidad de MVP
  IV. Reglas de negocio verificables
  V. Experiencia en español fiel a los prototipos
- Added sections: Restricciones técnicas, Flujo de trabajo y calidad, Governance
- Removed sections: none
- Templates:
  ✅ .specify/templates/plan-template.md (the generic Constitution Check gate applies; no changes needed)
  ✅ .specify/templates/spec-template.md (no mandatory sections added)
  ✅ .specify/templates/tasks-template.md (updated: the "Tests" note now says tests are REQUIRED per Principle IV;
     tasks.md must include them; the template already supports test phases)
- Follow-up TODOs: none
-->

# MedaPark Constitution

## Core Principles

### I. Las historias de usuario son la fuente de verdad

- Todo requisito funcional (FR) MUST trazarse a una HU (`HU1`…`HU11`) del documento
  `docs/historias-usuario/RQ02v2-historias-usuario-medapark.pdf`, y toda tarea MUST trazarse a una user
  story de su spec.
- Cuando el texto de una HU y su prototipo se contradicen, prevalece el **texto**, salvo decisión explícita
  registrada en `docs/analisis-mvp.md`.
- Toda desviación respecto a una HU (por ejemplo, el MFA TOTP frente a "Reenviar código") MUST quedar
  documentada en la spec, en la sección *Assumptions* o *Desviaciones*, con su justificación.
- Los mensajes que las HU citan entre comillas MUST mostrarse **literalmente** (catálogo en
  `docs/analisis-mvp.md` §7).

**Rationale**: es un trabajo evaluado sobre un documento de HU firmado. La trazabilidad es el criterio de
calidad principal.

### II. Seguridad y control de cambios del back (NON-NEGOTIABLE)

- El back es el proyecto Supabase `Medapark` (`msmfidnqmqntxbcucnsf`), **administrado por el equipo**. Su
  estado real está documentado en `docs/supabase-esquema-actual.md`. Las features se diseñan primero para
  funcionar con el back tal como está.
- **Todo cambio en el back es de CRITICIDAD ALTA 🔴 y requiere un check de autorización explícito antes de
  ejecutarse** (esquema, RLS, permisos, funciones, vistas, triggers, configuración de Auth, datos fuera del
  uso normal de la app). El proceso en `docs/cambios-back/README.md` es obligatorio:
  1. solicitud `CB-NNN` con el SQL exacto, el impacto, los riesgos y la **reversión**;
  2. migración versionada en `supabase/migrations/`;
  3. **check de autorización**: el agente o la persona se detiene y obtiene un "Autorizo CB-NNN" explícito
     de una persona responsable del back. La autorización es por cambio y nunca se generaliza;
  4. ejecución y registro;
  5. sincronización de la documentación, los tipos, las specs y el `CHANGELOG` (`[CRITICIDAD ALTA]`).
- Las lecturas (`supabase gen types`, `db query` con `SELECT`, `db dump` de esquema) no requieren
  autorización.
- El control de acceso real lo hace el back (RLS por dueño + `aal2` y las RPC). El front MUST respetarlo y
  reflejarlo en la UX (guards, botones deshabilitados), pero nunca reemplazarlo: ocultar botones no cuenta
  como seguridad.
- Las reglas de negocio que el back no expresa MUST validarse en el front y quedar listadas en
  `docs/supabase-esquema-actual.md` §3.
- En el repositorio solo MUST existir la URL del proyecto y la *anon key* (vía `.env`, nunca versionado).
  La *service role key* MUST NOT usarse en el front ni versionarse.

**Rationale**: el back es compartido y alimenta producción; un cambio sin control puede exponer datos o
romper la app publicada. El check de autorización deja trazabilidad de cada decisión.

### III. Simplicidad de MVP

- Solo se construye lo que piden las HU y las decisiones de `docs/analisis-mvp.md`. Lo listado como
  *Fuera de alcance* MUST NOT implementarse.
- Se usan las capacidades que el back ya ofrece (Supabase Auth, tablas con RLS, vista pública, RPC de
  ocupación), sin agregar infraestructura (servidores, Edge Functions, colas, realtime).
- No se agregan librerías de estado global, ORMs, ni capas de abstracción (repositorios, DI) mientras un
  hook o un módulo `lib/` sea suficiente. Cualquier excepción MUST justificarse en *Complexity Tracking*
  del plan.
- Un único proyecto frontend (`src/`) y `supabase/migrations/` solo para cambios del back autorizados. La organización de `src/`
  sigue las convenciones del repo existente: `pages/`, `components/<área>/`, `services/`, `lib/` y
  `router/`, más `context/`, `hooks/` y `domain/` para el estado compartido y las reglas puras.
- El código existente se **reutiliza y migra**; no se reescribe desde cero lo que ya funciona (por ejemplo,
  los servicios de MFA). Las pantallas existentes fuera del alcance del MVP se conservan sin enlazarlas
  desde la UI (decisión del equipo, ver `docs/analisis-mvp.md` §11).

**Rationale**: equipo pequeño con rol de desarrollador rotativo y alcance cerrado. Menos piezas significa
menos inconsistencias entre módulos.

### IV. Reglas de negocio verificables

- Cada regla de negocio de las HU (validaciones de formularios, cálculo de disponibilidad, límites de
  capacidad y ocupación, visibilidad pública) MUST tener al menos una prueba automatizada:
  - **Vitest** para validadores (esquemas Zod) y funciones puras de dominio en `src/domain/` y `src/lib/`.
  - **Testing Library** solo para los componentes con lógica condicional relevante (botones
    deshabilitados, campos que dependen del tipo de vehículo).
- Las pruebas de una user story MUST escribirse antes o junto con su implementación y pasar antes de
  cerrar la story. No se exige TDD estricto ni cobertura mínima.
- Cada spec MUST tener un `quickstart.md` con la validación manual de extremo a extremo de cada story.

**Rationale**: las HU son ricas en reglas y mensajes exactos. Probarlas es más barato que revisarlas a
mano en cada entrega.

### V. Experiencia en español fiel a los prototipos

- La interfaz MUST estar en español (es-CO): pesos colombianos sin decimales (`$ 5.000`) y coordenadas
  con punto decimal.
- La UI MUST seguir la línea visual de `docs/prototipos/` y de los mocks de Pencil (`design/`): paleta,
  layout administrativo con encabezado y menú lateral, y tarjetas.
- La UI MUST ser responsive (≥ 360 px de ancho) y accesible en lo básico: labels asociados, foco visible,
  mensajes de error vinculados con `aria-describedby`, contraste AA y botones deshabilitados con su razón
  visible.
- Los errores de red o inesperados MUST mostrar un mensaje genérico en español sin filtrar detalles
  técnicos, y dejar la pantalla utilizable.

**Rationale**: los prototipos son parte del entregable académico y los usuarios finales son de Medellín.

## Restricciones técnicas

- **Frontend** (versiones del repo existente, migrado a TypeScript): Vite 8 + React 19 + TypeScript
  (`strict`) + Tailwind CSS 4 (`@tailwindcss/vite`) + `react-router` 8 + React Hook Form + Zod. Mapas con
  Leaflet 1.9 + `react-leaflet` 5 (OpenStreetMap/CARTO, sin API key). Cliente `@supabase/supabase-js` v2.
  Íconos con `lucide-react`.
- **Back (administrado por el equipo, cambios con control de CRITICIDAD ALTA)**: Supabase en la nube,
  proyecto `Medapark` (`msmfidnqmqntxbcucnsf`, PostgreSQL 17): Auth (email/contraseña + MFA TOTP), tablas
  `parking_lots` y `parking_vehicle_configs`, la vista `public_parking_lots` y las RPC
  `register_vehicle_entry`/`register_vehicle_exit`. Los cambios autorizados se versionan en
  `supabase/migrations/` (solicitudes en `docs/cambios-back/`). Los tipos se generan (solo lectura) con
  `npx supabase gen types typescript --project-id msmfidnqmqntxbcucnsf > src/lib/database.types.ts`.
- **Sin servidores propios** ni Edge Functions. El SQL solo existe como migraciones autorizadas (CB-NNN).
- **Rutas externas**: Google Maps solo mediante URL (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`).
- **Despliegue**: Netlify publica automáticamente la rama `main` (SPA con `public/_redirects`).
- **Navegadores**: las dos últimas versiones de Chrome, Edge, Firefox y Safari (desktop y móvil).

## Flujo de trabajo y calidad

- **Los cambios al repo se hacen mediante agentes de IA** que siguen `AGENTS.md` (vinculante para agentes y
  personas: arquitectura por capas, patrones, prohibiciones, Definition of Done y matriz anti-desalineación).
  Las personas dirigen, revisan y aprueban. Ningún cambio de comportamiento entra sin estar en spec y tareas.
- Ciclo SDD con Spec Kit: `constitution → specify → clarify → plan → tasks → (analyze) → implement`.
- **Gitflow**: `main` = producción (Netlify publica cada push; nadie hace push directo, solo merges
  revisados desde `develop`); `develop` = integración; ramas `feature/NNN-nombre` (por ejemplo,
  `feature/001-autenticacion-admin`) creadas desde `develop` y fusionadas a `develop` por PR. En cada rama
  de feature, `.specify/feature.json` MUST apuntar a `specs/NNN-nombre` para que los scripts de Spec Kit
  resuelvan la feature.
- Commits en español con prefijo convencional (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), pequeños y
  asociados a IDs de tarea (`T012`).
- Antes de marcar una tarea como completa: `npm run lint`, `npm run typecheck` y `npm test` en verde; si
  aplica, la validación manual del `quickstart.md`.
- Los mocks de Pencil (`design/medapark.pen`) MUST existir para las pantallas de una feature antes de
  implementar su UI.
- Ninguna credencial, token o `.env` se versiona.
- Cada PR MUST actualizar `CHANGELOG.md` (Keep a Changelog, sección `[Unreleased]`).

## Governance

- Esta constitución prevalece sobre cualquier otra guía del repo. Los planes (`plan.md`) MUST pasar el
  *Constitution Check* antes de la investigación (fase 0) y de nuevo tras el diseño (fase 1).
- Las enmiendas se hacen con `/speckit-constitution`, con versionado semántico: MAJOR si se elimina o
  redefine un principio, MINOR si se agrega un principio o sección, PATCH para aclaraciones. Toda enmienda
  MUST actualizar el *Sync Impact Report* y revisar las plantillas de `.specify/templates/`.
- Las desviaciones de las HU se registran en `docs/analisis-mvp.md` y en la spec afectada. Si cambian el
  alcance, MUST comunicarse al equipo como solicitud de cambio.
- La guía de ejecución para agentes está en `AGENTS.md` (importado por `CLAUDE.md` y referido por
  `.github/copilot-instructions.md`) y en el `plan.md` de la feature activa. Cualquier cambio a la forma de
  trabajo MUST reflejarse a la vez en esta constitución y en `AGENTS.md`.

**Version**: 3.0.0 | **Ratified**: 2026-10-17 | **Last Amended**: 2026-10-17
