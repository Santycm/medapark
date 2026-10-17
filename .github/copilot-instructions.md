# Instrucciones para GitHub Copilot

Este repositorio se trabaja **solo con agentes de IA siguiendo Spec-Driven Development**. Antes de proponer o
escribir cualquier cambio, lee y cumple **`AGENTS.md`** (reglas obligatorias), la constitución
`.specify/memory/constitution.md` y la spec de la feature activa (`.specify/feature.json` → `specs/NNN-*`).

Resumen de reglas críticas (el detalle está en `AGENTS.md`):

- **Back (Supabase): todo cambio es 🔴 CRITICIDAD ALTA** y requiere un **check de autorización explícito** ("Autorizo CB-NNN" de una persona responsable) antes de ejecutarse. Proceso en `docs/cambios-back/README.md` y `AGENTS.md` §2.1. Las lecturas no requieren autorización.
- **Nunca** hacer push ni merge a `main` (Netlify publica automáticamente). Gitflow: `develop` + `feature/NNN-nombre`.
- Primero la spec y las tareas, después el código. Cada cambio se traza HU → FR → tarea.
- Respetar las capas y patrones de `AGENTS.md` §3 (servicios con `Result`, dominio puro, `MSG`, tokens Tailwind).
- No eliminar las pantallas existentes del repo original; actualizar `CHANGELOG.md` en cada PR.
