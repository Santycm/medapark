<!--
Sync Impact Report
- Version change: (template) → 1.0.0
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

### II. Seguridad en la base de datos (NON-NEGOTIABLE)

- Toda tabla en el esquema `public` MUST tener **Row Level Security habilitado** y políticas explícitas.
  Sin política no hay acceso.
- Toda escritura administrativa MUST exigir en el servidor (RLS o RPC) que el usuario sea el **dueño**
  del registro (`admin_id = auth.uid()`) **y** que la sesión tenga nivel `aal2`
  (`auth.jwt()->>'aal' = 'aal2'`). Ocultar botones en el frontend no cuenta como control de acceso.
- El acceso anónimo MUST limitarse a datos públicos de parqueaderos **activos y publicables**, mediante una
  función o vista de solo lectura que no exponga identificadores de administradores.
- Las invariantes de negocio (por ejemplo, `0 ≤ ocupadas ≤ capacidad`) MUST garantizarse con
  `CHECK`/constraints o RPC atómicas en PostgreSQL, no solo con validaciones del cliente.
- En el repositorio solo MUST existir la URL del proyecto y la *anon key* (vía `.env`, nunca versionado).
  La *service role key* MUST NOT usarse en el frontend ni versionarse.

**Rationale**: el frontend es público y manipulable. El aislamiento entre administradores y el MFA solo
son reales si los hace cumplir la base de datos.

### III. Simplicidad de MVP

- Solo se construye lo que piden las HU y las decisiones de `docs/analisis-mvp.md`. Lo listado como
  *Fuera de alcance* MUST NOT implementarse.
- Se prefieren las capacidades nativas de la plataforma (Supabase Auth, constraints SQL, RPC) antes que
  infraestructura propia (servidores, Edge Functions, colas, realtime).
- No se agregan librerías de estado global, ORMs, ni capas de abstracción (repositorios, DI) mientras un
  hook o un módulo `lib/` sea suficiente. Cualquier excepción MUST justificarse en *Complexity Tracking*
  del plan.
- Un único proyecto frontend (`src/`) y una carpeta `supabase/` para el backend.

**Rationale**: equipo pequeño con rol de desarrollador rotativo y alcance cerrado. Menos piezas significa
menos inconsistencias entre módulos.

### IV. Reglas de negocio verificables

- Cada regla de negocio de las HU (validaciones de formularios, cálculo de disponibilidad, límites de
  capacidad y ocupación, visibilidad pública) MUST tener al menos una prueba automatizada:
  - **Vitest** para validadores (esquemas Zod) y funciones puras de dominio en `src/lib/`.
  - **pgTAP** (`supabase/tests/`) para RLS, constraints y RPC (aislamiento entre admins, acceso anónimo,
    exigencia de `aal2`, invariantes de ocupación).
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

- **Frontend**: Vite + React 18 + TypeScript (`strict`) + Tailwind CSS + React Router + React Hook Form + Zod.
  Mapas con Leaflet/OpenStreetMap (`react-leaflet`). Cliente `@supabase/supabase-js` v2.
- **Backend**: Supabase en la nube (plan free): Auth (email/contraseña + MFA TOTP), PostgreSQL, RLS y RPC.
  Esquema versionado en `supabase/migrations/` y datos de ejemplo en `supabase/seed.sql`.
- **Sin servidores propios** ni Edge Functions, salvo que una spec lo justifique.
- **Rutas externas**: Google Maps solo mediante URL (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`).
- **Despliegue**: Netlify (opcional), como SPA con redirección `/* /index.html 200`.
- **Navegadores**: las dos últimas versiones de Chrome, Edge, Firefox y Safari (desktop y móvil).

## Flujo de trabajo y calidad

- Ciclo SDD con Spec Kit: `constitution → specify → clarify → plan → tasks → (analyze) → implement`.
  Una rama por feature (`NNN-nombre`) y merge a `main` al cerrar la feature.
- Commits en español con prefijo convencional (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), pequeños y
  asociados a IDs de tarea (`T012`).
- Antes de marcar una tarea como completa: `npm run lint`, `npm run typecheck` y `npm test` en verde; si
  hubo cambios SQL, `supabase test db` en verde.
- Los mocks de Pencil (`design/medapark.pen`) MUST existir para las pantallas de una feature antes de
  implementar su UI.
- Ninguna credencial, token o `.env` se versiona.

## Governance

- Esta constitución prevalece sobre cualquier otra guía del repo. Los planes (`plan.md`) MUST pasar el
  *Constitution Check* antes de la investigación (fase 0) y de nuevo tras el diseño (fase 1).
- Las enmiendas se hacen con `/speckit-constitution`, con versionado semántico: MAJOR si se elimina o
  redefine un principio, MINOR si se agrega un principio o sección, PATCH para aclaraciones. Toda enmienda
  MUST actualizar el *Sync Impact Report* y revisar las plantillas de `.specify/templates/`.
- Las desviaciones de las HU se registran en `docs/analisis-mvp.md` y en la spec afectada. Si cambian el
  alcance, MUST comunicarse al equipo como solicitud de cambio.
- La guía de ejecución para agentes está en `CLAUDE.md` y en el `plan.md` de la feature activa.

**Version**: 1.0.0 | **Ratified**: 2026-10-17 | **Last Amended**: 2026-10-17
