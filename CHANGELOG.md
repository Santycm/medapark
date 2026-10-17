# Changelog

Todos los cambios relevantes de MedaPark se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[Versionado Semántico](https://semver.org/lang/es/). Reglas de uso en `AGENTS.md` §6: cada PR agrega sus
entradas en `[Unreleased]`, citando la feature y la tarea, por ejemplo `(001/T037)`.

## [Unreleased]

### Added

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
