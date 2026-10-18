# Changelog

Todos los cambios relevantes de MedaPark se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[Versionado Semántico](https://semver.org/lang/es/). Reglas de uso en `AGENTS.md` §6: cada PR agrega sus
entradas en `[Unreleased]`, citando la feature y la tarea, por ejemplo `(001/T037)`.

## [Unreleased]

### Added

- Feature 002 (gestión del parqueadero, HU3–HU7), sobre el back existente:
  - dominio puro (`domain/parking`, esquemas Zod y mapeo del formulario) y `lib/format` (002/T003–T007, T016–T019);
  - servicio `adminParking` con validación previa y orden de escritura seguro, y `parkingErrors` (002/T007–T009);
  - `MyParkingProvider`, `useMyParking` y guards `RequireParking`/`RequireNoParking`; menú lateral condicionado (002/T010–T012);
  - componentes `Checkbox`, `RadioCard`, `NumberStepper`, `Badge`, `Breadcrumbs`, `MapBase`, `LocationPicker` y `ParkingForm` (002/T013, T014, T020, T021);
  - pantallas: panel "Mi parqueadero" (HU4), registrar (HU3), editar (HU5), configurar celdas (HU6) y gestionar ocupación (HU7) (002/T022–T033);
  - 161 pruebas nuevas (298 en total); cobertura global de 93 %.
  - ⚠️ Registrar, editar y configurar celdas necesitan la solicitud **CB-001** (permisos INSERT/UPDATE, 🔴 CRITICIDAD ALTA), **pendiente de autorización y no ejecutada**. Mientras tanto la app muestra "No tienes permisos para realizar esta acción…".
- CI en GitHub Actions (`.github/workflows/ci.yml`): lint, typecheck, pruebas con cobertura mínima de 70 % y build en cada PR a `develop` o `main`; script `npm run test:coverage` (001/T050).
- Mocks de Pencil (`design/mocks/`, 13 pantallas): 001 (login, MFA verificar y configurar, layout admin con modal de cierre de sesión, 404), 002 (panel, panel vacío, registrar, editar, configurar celdas, gestionar ocupación) y 003 (mapa con lista y detalle) (001/T014). El archivo `design/medapark.pen` debe guardarse desde Pencil.
- Feature 001 (autenticación del administrador):
  - migración de `src/` a TypeScript estricto, con Vitest, ESLint TS y Prettier (001/T002–T013);
  - tokens de diseño `@theme`, fuente Inter y kit de UI (`Button`, `TextField`, `PasswordField`, `Alert`,
    `Modal`, `Card`, `Logo`) y layouts `AuthLayout`, `AdminLayout` y `PublicLayout` (001/T015, T018, T019);
  - `lib/messages`, `lib/errors`, `lib/result`, `lib/env` y tipos de Supabase generados (001/T004, T005, T016, T017);
  - login HU1 con react-hook-form + Zod y mensajes literales (001/T027–T031);
  - MFA TOTP **obligatorio**: enrolamiento y verificación con límite de 5 intentos (001/T032–T038);
  - cierre de sesión con confirmación (HU8), `AuthProvider`, `useAuth` y guards por etapa de autenticación
    (001/T020–T026, T039–T042);
  - rutas `/admin/...`, redirecciones de `/login` y `/verify-mfa`, `Panel` provisional y `NotFound` (001/T025).

- 🔴 **Control de cambios del back con CRITICIDAD ALTA**: proceso obligatorio con check de autorización
  explícito (`docs/cambios-back/README.md`), plantilla de solicitud y **CB-001** (permisos INSERT/UPDATE del
  administrador, ⏳ pendiente de autorización, no ejecutado).

- AI readiness del repo:
  - `AGENTS.md`, con las reglas obligatorias para agentes y personas: SDD, arquitectura por capas,
    patrones, prohibiciones, Gitflow, Definition of Done y matriz anti-desalineación;
  - `CHANGELOG.md`;
  - `.github/copilot-instructions.md` y `.github/pull_request_template.md`;
  - `.claude/settings.json`, que bloquea el push a `main` y la escritura en Supabase;
  - `.editorconfig` y `.gitattributes` (finales de línea LF).
- Ciclo SDD con GitHub Spec Kit (integración Claude Code, scripts PowerShell):
  - constitución del proyecto (`.specify/memory/constitution.md`, v2.0.0);
  - análisis del MVP (`docs/analisis-mvp.md`): decisiones del wizard, inconsistencias de las HU resueltas,
    catálogo de mensajes, rutas e integración con el repo existente;
  - esquema real de Supabase leído en modo solo lectura (`docs/supabase-esquema-actual.md`), con una nota
    de permisos para el equipo del back;
  - feature `001-autenticacion-admin` (HU1, HU2, HU8): spec, clarify, plan, research, data model,
    contratos, quickstart y 49 tareas (incluye la migración a TypeScript);
  - feature `002-gestion-parqueadero` (HU3–HU7): spec, clarify, plan, research, data model, contratos
    sobre el back existente, quickstart y 39 tareas;
  - feature `003-consulta-publica` (HU9–HU11): spec, clarify, plan, research, data model, contratos sobre
    la vista `public_parking_lots`, quickstart y 23 tareas.
- Documentación fuente: historias de usuario (PDF y texto), prototipos por HU (`docs/prototipos/`) y logos
  (`docs/assets/logos/`).

### Changed

- Pantallas MFA sin barra superior (el logo ya está en el panel) y ajustadas al alto de la ventana con unidades vh/vw; el login también se ajusta al alto sin scroll (001/T030, T037, T038).
- UI de la 001 ajustada a los mocks de Pencil (`design/mocks/`): login con foto y tarjeta grande, `MfaLayout` con panel de marca y pasos, casillas separadas para el código, logos con fondo transparente y estilos del encabezado, menú y diálogo de cierre de sesión (001/T030, T037, T038, T041).
- El botón "Administración" del mapa pasa a "Acceso administradores" (`/admin/login`) (001/T025).
- `ProtectedRoute` queda `@deprecated` (se conserva) (001/T044).
- El login ya no muestra "¿Olvidaste tu contraseña?"; la ruta latente se conserva (001/T030).
- Constitución 3.0.0: el equipo administra el back; todo cambio en él es de CRITICIDAD ALTA con check de
  autorización (antes: back externo de solo lectura). `AGENTS.md` §2.1, plantilla de PR, instrucciones de
  Copilot y `.claude/settings.json` (ahora pide confirmación en los comandos de escritura de Supabase)
  alineados. Specs 001–003 actualizadas (la dependencia de la 002 pasa a ser CB-001).
- `README.md`: descripción del proyecto como solo front, Gitflow y guía de Spec Kit.
- `.gitignore`: combina las reglas del repo original con las de Spec Kit, Supabase CLI y Netlify.

## [0.1.0] - 2026-10-14

Versión inicial del repo, creada por Santiago Castaño Moreno (antes de adoptar SDD).

### Added

- Proyecto Vite + React 19 + Tailwind 4 con autenticación de Supabase: login, MFA TOTP opcional
  (configurar, verificar y desactivar), recuperación y cambio de contraseña, y perfil (2026-09-30).
- Mapa de parqueaderos con Leaflet y detalle de parqueadero (2026-09-30).
- `Loader` mejorado y marcador del mapa con popup (2026-09-30).
- Configuración de reescritura de URLs para SPA (2026-10-08).
- Servicio de datos públicos desde la vista `public_parking_lots` de Supabase, integrado en `Home` y
  `ParkingDetail` (PR #1, 2026-10-13).
- `public/_redirects` para Netlify (2026-10-14).

### Changed

- `AuthCard` con logo e ícono actualizados (2026-10-13).

### Removed

- Configuración de Vercel, reemplazada por Netlify (2026-10-14).

### Fixed

- Ruta de la imagen del logo en `AuthCard` (2026-10-13).

[Unreleased]: https://github.com/Santycm/medapark/compare/main...develop
[0.1.0]: https://github.com/Santycm/medapark/commits/main
