# AGENTS.md: reglas de trabajo de MedaPark

> **Este archivo es obligatorio para cualquier agente de IA (Claude Code, Copilot, Cursor, Codex, Gemini…) y
> para cualquier persona que trabaje en el repo.** Define cómo se trabaja, qué patrones se usan y qué está
> prohibido, para que el proyecto **no se desalinee** de sus especificaciones. Si una instrucción de una
> sesión contradice este archivo o la constitución, gana este archivo, y el agente debe advertirlo antes de
> actuar.

---

## 0. Regla cero: todo cambio se hace con IA y siguiendo SDD

1. **Los cambios en este repo se hacen mediante un agente de IA**, usando el ciclo de Spec Kit. Las personas
   dirigen, revisan y aprueban; no editan código a mano. Si una persona necesita un cambio, se lo pide a un
   agente que siga este archivo.
2. **Primero la especificación, después el código.** Ningún cambio de comportamiento entra sin estar
   respaldado por una spec y una tarea:
   - Feature o cambio de comportamiento nuevo → `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` →
     `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
   - Ajuste a una feature existente → actualizar **primero** su `spec.md`, `plan.md`, `contracts/` y
     `tasks.md` (con una tarea nueva `TNNN`), y luego implementar.
   - Corrección de un bug que no cambia la spec → agregar una tarea en el `tasks.md` de la feature
     ("Bugfix: …") e implementarla.
3. **Toda tarea marcada `[x]` debe tener su código, sus pruebas y su entrada en el CHANGELOG.**
4. Si algo no está claro, el agente **pregunta** antes de inventar. Las decisiones se registran (ver §7).

## 1. Fuentes de verdad (orden de precedencia)

| # | Documento | Qué define |
|---|-----------|-----------|
| 1 | `.specify/memory/constitution.md` | Principios no negociables |
| 2 | `AGENTS.md` (este archivo) | Forma de trabajo, patrones y prohibiciones |
| 3 | `docs/historias-usuario/` + `docs/analisis-mvp.md` | Requisitos (HU), decisiones, mensajes exactos, rutas e integración con el repo |
| 4 | `docs/supabase-esquema-actual.md` | El back real (solo lectura) |
| 5 | `specs/NNN-*/` (`spec` → `plan` → `contracts` → `tasks`) | Qué construir y cómo, por feature |
| 6 | Código en `src/` | Implementación. **Nunca** es la fuente de verdad: si difiere de la spec, se corrige el código o, con aprobación, la spec |

Antes de trabajar, el agente **debe leer** como mínimo: la constitución, este archivo, `docs/analisis-mvp.md`
y el `plan.md` + `tasks.md` de la feature activa (`.specify/feature.json`).

## 2. Prohibiciones (hard rules)

| ❌ Prohibido | Por qué / alternativa |
|-------------|-----------------------|
| Modificar Supabase: migraciones, SQL, políticas, permisos, funciones, configuración, `supabase db push`, `db reset --linked`, `migration repair`, `test db --linked` | El back lo administran otras personas. Solo lectura (`supabase gen types`, `db query` con `SELECT`). Las necesidades del back se documentan en `docs/supabase-esquema-actual.md` §4 |
| Crear carpetas `supabase/migrations` o archivos `.sql` en el repo | Ídem |
| `git push` a `main`, `git push --force` a ramas compartidas o hacer merge directo a `main` | Netlify publica `main`. Solo PR revisado `develop` → `main`, decidido por el equipo |
| Eliminar pantallas o archivos existentes del repo original (recuperar contraseña, perfil, SetupMfa, ParkingDetail, ProtectedRoute) | Decisión del equipo: se conservan (sin enlaces o marcados `@deprecated`) |
| Versionar secretos (`.env`, tokens, *service role key*) | Solo `.env.example` |
| Agregar dependencias que no estén en el `plan.md` de la feature | Justificar en el plan (*Complexity Tracking*) antes |
| Desactivar reglas de lint o de TypeScript (`any`, `@ts-ignore`, `eslint-disable`) o saltar o borrar pruebas para que pase el CI | Corregir la causa. Una excepción documentada requiere un comentario con la razón y la tarea |
| Editar a mano `src/lib/database.types.ts` | Se regenera con `npm run gen:types` |
| Escribir textos de UI o mensajes "en línea" | Todo texto de error o confirmación sale de `src/lib/messages.ts` (`MSG`) |
| Colores, tamaños o fuentes *hardcodeados* (`#0E7C47`, `text-[13px]`…) | Usar los tokens de `@theme` (`brand-600`, `navy-900`…) |
| Implementar algo listado como *Fuera de alcance* (`docs/analisis-mvp.md` §9) | Requiere una solicitud de cambio y la actualización de la spec |
| Cambiar una regla de negocio solo en el código | Primero la spec (§0) |

## 3. Arquitectura y patrones de diseño

### 3.1 Capas y dependencias permitidas

```text
pages/ ──► components/ ──► hooks/ ──► context/ ──► services/ ──► lib/supabase.ts
   │            │             │            │            │
   └────────────┴─────────────┴────────────┴────────────┴──► domain/ (puro)  ·  lib/ (messages, errors, format, result)
router/ (rutas + guards) ──► context/, hooks/, pages/
```

| Capa | Responsabilidad | Puede importar | **No** puede |
|------|-----------------|----------------|--------------|
| `src/domain/` | Reglas de negocio **puras** (sin React, sin Supabase, sin I/O) y esquemas Zod | `lib/` (excepto `supabase.ts`), `lib/database.types` (solo tipos) | React, servicios, `supabase` |
| `src/lib/` | Utilidades transversales: `supabase.ts` (cliente único), `env`, `messages` (`MSG`), `errors`, `result`, `format`, `database.types` | otras de `lib/` | React, `domain/` con estado |
| `src/services/` | **Único** punto de acceso al back (`supabase.from/rpc/auth`) | `lib/`, `domain/` | React, componentes |
| `src/context/` + `src/hooks/` | Estado compartido (`AuthProvider`, `MyParkingProvider`) y su acceso (`useAuth`, `useMyParking`) | `services/`, `domain/`, `lib/` | Llamar a `supabase` directo |
| `src/components/<área>/` | UI reutilizable (`common/` = kit, `layout/`, `auth/`, `parking/`, `public/`, `map/`) | `hooks/`, `domain/`, `lib/` (excepto `supabase.ts`) | Llamar a servicios o `supabase` (salvo `map/`, que no lo necesita) |
| `src/pages/<área>/` | Pantallas: componen componentes y orquestan servicios y hooks | todo lo anterior | Acceder a `supabase` directo |
| `src/router/` | Rutas, redirecciones y guards (`RequireAal2`, `RequirePendingMfa`, `RedirectIfAuthenticated`, `RequireParking`, `RequireNoParking`) | `context/`, `hooks/`, `pages/` | Lógica de negocio |

### 3.2 Patrones obligatorios

| Patrón | Regla |
|--------|-------|
| **Result en servicios** | Las funciones nuevas de `services/` **no lanzan**: devuelven `Result<T, Code>` (`src/lib/result.ts`) con el `message` ya traducido. Las funciones *legacy* del repo original conservan su firma (lanzan) porque las usan las pantallas latentes |
| **Mapeo central de errores** | Los códigos del back se traducen solo en `lib/errors.ts` (auth) y `services/parkingErrors.ts` (datos), según los contratos de la spec |
| **Dominio puro y probado** | Toda regla de negocio (validaciones, disponibilidad, publicabilidad, plan de escritura) es una función pura en `domain/` con pruebas Vitest |
| **Máquina de estados de auth** | El acceso se decide con `resolveAuthStage` + guards. Ningún componente decide el acceso por su cuenta |
| **Estado compartido con Context** | Sin Redux, Zustand ni react-query. Un Provider por agregado (`Auth`, `MyParking`) |
| **Formularios** | react-hook-form + Zod (`domain/schemas/`). Los valores numéricos se manejan como string en el formulario y se convierten en `domain/*Form.ts` |
| **Mensajes** | `MSG` en `lib/messages.ts`; los citados por las HU van **literales** |
| **Escrituras al back** | Siempre con `.select('id')` para detectar operaciones que la RLS filtró; nunca enviar ids de otros usuarios; respetar `contracts/back-usage.md` |
| **Mensajes tras navegar** | `navigate(ruta, { state: { flash } })`; sin librerías de toasts |
| **Mapas** | `components/map/MapBase` + `markerIcons` (`divIcon` SVG); en pruebas se mockean |
| **Accesibilidad** | Labels asociados, `aria-describedby` en errores, foco visible, modales con trampa de foco y Esc, `aria-live` en los conteos |

### 3.3 Convenciones de código

- TypeScript `strict`. Prohibido `any` (usar `unknown` + *narrowing*).
- **Código en inglés** (archivos, componentes, funciones, tipos) y **textos de UI en español (es-CO)**.
- Componentes y páginas: `PascalCase.tsx` con `export default` (estilo del repo). Servicios, dominio y lib:
  `camelCase.ts` con *named exports*.
- Pruebas junto al archivo: `X.test.ts(x)`. Cliente Supabase **siempre simulado** (`vi.mock`).
- Estilos solo con utilidades Tailwind y tokens de `src/index.css` (`@theme`).
- Íconos de `lucide-react`. Moneda con `formatCOP`; coordenadas con `formatCoord`.
- Rutas en español bajo `/admin/...` según `docs/analisis-mvp.md` §8; las rutas antiguas redirigen.

## 4. Flujo de trabajo (Gitflow + Spec Kit)

1. Partir de `develop` actualizado: `git checkout develop && git pull`.
2. Crear la rama: `feature/NNN-nombre` (feature de Spec Kit), `fix/descripcion` o `docs/descripcion`.
3. Fijar `.specify/feature.json` → `{"feature_directory": "specs/NNN-nombre"}`.
4. Ejecutar el ciclo SDD (§0). Implementar **en el orden de `tasks.md`**, marcando `[x]` cada tarea terminada.
5. Commits pequeños, en español, con formato convencional y el ID de la tarea:
   `feat(002): T027 gestión de ocupación` · `fix(001): T050 ...` · `docs(sdd): ...` · `test(003): ...` · `chore: ...`
   y el trailer de coautoría del agente, si aplica.
6. Actualizar `CHANGELOG.md` (§6) en el mismo PR.
7. PR hacia `develop` con la plantilla (`.github/pull_request_template.md`). **Nunca** hacia `main`.
8. `develop` → `main` (publicación en Netlify) solo lo decide y ejecuta el equipo.

Orden de implementación de las features: **001 → 002 → 003** (cada una depende de la anterior).

## 5. Definition of Done (por tarea y por PR)

- [ ] La tarea existe en `tasks.md` y se trazan HU → FR → tarea.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde.
- [ ] Pruebas nuevas para cada regla de negocio tocada (Principio IV).
- [ ] UI fiel al prototipo o mock, en español, responsive (≥ 360 px) y accesible.
- [ ] Sin cambios en Supabase, sin secretos y sin push a `main`.
- [ ] Docs sincronizadas (§7) y `CHANGELOG.md` actualizado.
- [ ] Para cerrar una feature: la validación manual del `quickstart.md` registrada en `checklists/validacion-manual.md`.

## 6. CHANGELOG

- Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).
- Cada PR agrega sus líneas en `## [Unreleased]`, bajo `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` o
  `Security`, citando la feature y la tarea (`(001/T037)`).
- Al publicar (`develop` → `main`), el equipo mueve `Unreleased` a una versión con fecha.

## 7. Matriz anti-desalineación: "si cambias X, actualiza Y"

| Si cambias… | Actualiza también… |
|-------------|--------------------|
| Un requisito o comportamiento | `spec.md` (FR y escenarios) → `plan.md`/`contracts/` → `tasks.md` → código → `CHANGELOG.md` |
| Un texto de error o confirmación | `lib/messages.ts` + `docs/analisis-mvp.md` §7 (si es de una HU) + el contrato de la feature |
| Una ruta | `router/index.tsx` + `contracts/routes.md`/`ui.md` + `docs/analisis-mvp.md` §8 |
| Una decisión de producto, alcance o desviación de una HU | `docs/analisis-mvp.md` (§4–§6, §9) + *Clarifications* de la spec |
| Un principio, el stack o la forma de trabajo | Constitución (`/speckit-constitution`, versionado SemVer) + este archivo |
| Lo que se observa del back (porque otro equipo lo cambió) | Reintrospección de **solo lectura** → `docs/supabase-esquema-actual.md` → `npm run gen:types` → specs afectadas |
| Tokens de diseño | `src/index.css` (`@theme`) + `research.md` §R10 de la 001 + mocks en `design/` |
| Dependencias | `package.json` + `plan.md` (Technical Context) |

## 8. AI readiness: cómo arranca un agente

1. Leer: constitución → `AGENTS.md` → `docs/analisis-mvp.md` → `docs/supabase-esquema-actual.md` →
   `specs/NNN/plan.md` + `tasks.md`.
2. Comprobar la rama (`feature/NNN-*`, nunca `main`) y `.specify/feature.json`.
3. Usar las skills de Spec Kit en `.claude/skills/` (`/speckit-*`). Otros agentes usan los mismos archivos de
   `specs/`.
4. La configuración del repo para agentes:
   - `CLAUDE.md` (importa este archivo);
   - `.github/copilot-instructions.md`;
   - `.claude/settings.json`, con permisos que **bloquean** los comandos prohibidos (push a `main`, escritura
     en Supabase).
5. Mocks de UI: Pencil MCP (`design/medapark.pen`), con base en `docs/prototipos/`.
6. Si el agente detecta una contradicción entre los documentos, **se detiene y pregunta**; no elige por su
   cuenta.
