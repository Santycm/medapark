# Implementation Plan: Autenticación del Administrador de Parqueadero

**Branch**: `001-autenticacion-admin` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-autenticacion-admin/spec.md`

## Summary

Se entrega la base técnica del repositorio (Vite + React + TypeScript + Tailwind, cliente Supabase, tokens de
diseño, layouts y pruebas) y el flujo completo de autenticación del Administrador de Parqueadero:

- login con correo y contraseña (HU1) mediante Supabase Auth;
- segundo factor TOTP nativo de Supabase, con enrolamiento por QR la primera vez y verificación en cada
  ingreso (HU2);
- cierre de sesión con confirmación (HU8);
- protección de rutas basada en una máquina de estados (`anonimo`, `requiere_enrolamiento`,
  `requiere_verificacion`, `autenticado`);
- el helper SQL `public.es_sesion_aal2()`, que la feature 002 usará para exigir `aal2` en el RLS.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 22 LTS para tooling, SQL (PostgreSQL 15/17 de Supabase)

**Primary Dependencies**: React 18.3, Vite 6, react-router-dom 6, @supabase/supabase-js 2, react-hook-form 7, zod 3, @hookform/resolvers, Tailwind CSS 4 (`@tailwindcss/vite`), lucide-react

**Storage**: Supabase Auth (usuarios, factores MFA). En esta feature solo se crea una función SQL helper; no hay tablas propias

**Testing**: Vitest + jsdom + Testing Library (unitarias y de componentes) y pgTAP vía `npx supabase test db --linked`

**Target Platform**: navegadores modernos (Chrome, Edge, Firefox y Safari, últimas 2 versiones), desktop y móvil ≥ 360 px

**Project Type**: aplicación web SPA (frontend único) + BaaS (Supabase en la nube)

**Performance Goals**: transición entre pasos de autenticación < 2 s con red normal (SC-001: login completo < 60 s, dominado por el usuario)

**Constraints**: sin servidor propio ni Edge Functions; solo la *anon key* en el cliente; textos literales de las HU; plan free de Supabase

**Scale/Scope**: menos de 50 administradores; 3 pantallas de autenticación + layout administrativo + modal de cierre de sesión

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|-----------|----------------|--------|
| I. HU como fuente de verdad | Cada FR se traza a HU1, HU2 o HU8. Mensajes en `src/lib/messages.ts` copiados literalmente. Desviaciones de HU2 documentadas en la spec | ✅ |
| II. Seguridad en BD | `es_sesion_aal2()` con prueba pgTAP; registro público deshabilitado; solo `anon key` en `.env.local` (no versionado); `aal2` verificado en guards **y** disponible para RLS | ✅ |
| III. Simplicidad | Sin Edge Functions ni librerías de estado; contexto React + funciones puras; MFA nativo | ✅ |
| IV. Reglas verificables | Vitest para `resolveAuthStage`, `toUserMessage`, esquemas Zod, contador de intentos y guards; pgTAP para el helper | ✅ |
| V. UX en español y fiel | Tokens de R10, pantallas según HU01, HU02 y HU08; accesibilidad básica (labels, `aria-describedby`, foco en modal) | ✅ |

**Post-design re-check (tras la fase 1)**: ✅ Sin violaciones. No hay entradas en *Complexity Tracking*.

## Project Structure

### Documentation (this feature)

```text
specs/001-autenticacion-admin/
├── plan.md              # Este archivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   ├── routes.md        # Rutas, guards y matriz de acceso
│   ├── auth-service.md  # API TypeScript del módulo de autenticación
│   └── sql-helpers.md   # Contrato de public.es_sesion_aal2()
├── checklists/requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

Esta feature define la estructura de **todo** el repo. Las features 002 y 003 agregan carpetas en
`src/features/` y migraciones nuevas.

```text
.
├── index.html
├── package.json
├── vite.config.ts                 # React + Tailwind + config de Vitest (test.environment = 'jsdom')
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
├── .prettierrc
├── .env.example                   # VITE_SUPABASE_URL=, VITE_SUPABASE_ANON_KEY=
├── netlify.toml                   # SPA redirect (opcional, para despliegue)
├── public/
│   └── favicon.svg
├── design/                        # Mocks de Pencil (medapark.pen), se crean en otra sesión
├── src/
│   ├── main.tsx                   # monta <App/>, importa styles/index.css
│   ├── app/
│   │   ├── App.tsx                # <AuthProvider><RouterProvider/></AuthProvider>
│   │   ├── router.tsx             # createBrowserRouter: rutas públicas, auth y admin
│   │   └── guards/
│   │       ├── RequireAal2.tsx
│   │       ├── RequirePendingMfa.tsx
│   │       └── RedirectIfAuthenticated.tsx
│   ├── lib/
│   │   ├── env.ts                 # lectura y validación de import.meta.env
│   │   ├── supabase.ts            # createClient único (persistSession, autoRefreshToken)
│   │   ├── messages.ts            # catálogo MSG.* con los textos literales
│   │   └── errors.ts              # toUserMessage(error) y isSessionError(error)
│   ├── features/
│   │   └── auth/
│   │       ├── AuthProvider.tsx   # contexto: stage, user, refresh, signOut
│   │       ├── useAuth.ts
│   │       ├── authStage.ts       # resolveAuthStage() pura
│   │       ├── authService.ts     # wrapper de supabase.auth (ver contracts/auth-service.md)
│   │       ├── mfaAttempts.ts     # contador de fallos en sessionStorage
│   │       ├── schemas.ts         # loginSchema, otpSchema (zod)
│   │       ├── components/
│   │       │   ├── OtpInput.tsx   # 6 casillas, solo dígitos, admite pegar
│   │       │   └── LogoutDialog.tsx
│   │       └── pages/
│   │           ├── LoginPage.tsx
│   │           ├── MfaEnrollPage.tsx
│   │           └── MfaVerifyPage.tsx
│   ├── components/
│   │   ├── ui/                    # Button, TextField, PasswordField, Alert, Modal, Spinner, Card
│   │   └── layout/
│   │       ├── Logo.tsx           # SVG pin + carro, "Meda" navy + "Park" verde
│   │       ├── AuthLayout.tsx     # split: marca/ilustración a la izquierda, tarjeta a la derecha
│   │       ├── AdminLayout.tsx    # header + sidebar + <Outlet/>
│   │       ├── AdminHeader.tsx    # logo, correo del admin, "Cerrar sesión"
│   │       ├── AdminSidebar.tsx   # "Mi parqueadero" (002 agrega opciones)
│   │       └── PublicLayout.tsx   # header con "Acceso administradores" (003 lo completa)
│   ├── pages/
│   │   ├── NotFoundPage.tsx
│   │   ├── admin/PanelPage.tsx    # placeholder: la 002 lo reemplaza por HU4
│   │   └── public/HomePage.tsx    # placeholder: la 003 lo reemplaza por el mapa
│   ├── styles/index.css           # @import "tailwindcss"; @theme { tokens R10 }
│   └── test/setup.ts              # jest-dom, limpieza de sessionStorage
└── supabase/
    ├── config.toml                # npx supabase init
    ├── migrations/
    │   └── 20261017000100_auth_helpers.sql
    ├── seed.sql                   # vacío en 001
    └── tests/
        └── 001_auth_helpers.test.sql
```

**Structure Decision**: un único proyecto frontend en la raíz (`src/`) y backend declarativo en `supabase/`
(Principio III). Se organiza por *feature folders* (`src/features/<feature>`) con UI compartida en
`src/components`. Las pruebas unitarias van junto al archivo (`*.test.ts[x]`) y las de base de datos en
`supabase/tests/`.

## Design Notes

### Flujo de pantallas

```text
/admin/login ──(credenciales OK)──► resolveAuthStage
    ├─ requiere_enrolamiento ──► /admin/mfa/configurar ──(código OK)──► /admin
    └─ requiere_verificacion ──► /admin/mfa/verificar  ──(código OK)──► /admin
/admin/* (sin aal2) ──► guard ──► login o MFA según el estado
Header "Cerrar sesión" ──► LogoutDialog ──(confirmar)──► signOut(local) ──► /admin/login
```

### Puntos a cuidar

1. **StrictMode y enrolamiento**: en desarrollo React ejecuta los efectos dos veces. `MfaEnrollPage` debe
   proteger `enroll()` con un `useRef` (o una promesa memorizada) para no crear dos factores. La limpieza de
   factores `unverified` se hace antes de enrolar.
2. **Challenge**: en `MfaVerifyPage` se crea el challenge al montar y se renueva cuando llega
   `mfa_challenge_expired`. El código ingresado se envía con `verify` (no con `challengeAndVerify`) para
   distinguir el vencimiento.
3. **Después de `verify` exitoso** se llama a `refresh()` del `AuthProvider` (o se espera el evento
   `MFA_CHALLENGE_VERIFIED`) **antes** de navegar a `/admin`, para que el guard vea `autenticado`.
4. **Mensajes de navegación**: el aviso "Demasiados intentos fallidos…" se pasa a `/admin/login` por
   `navigate('/admin/login', { replace: true, state: { notice } })`.
5. **Accesibilidad**: `OtpInput` usa un único `<input inputMode="numeric" autoComplete="one-time-code"
   maxLength={6}>` visualmente dividido en 6 casillas (más simple y compatible con pegar y autocompletar
   que 6 inputs). El modal atrapa el foco, cierra con Esc y devuelve el foco al botón que lo abrió.
6. **El encabezado de las pantallas MFA** no muestra "Administrador ▾ / Cerrar sesión" (el prototipo HU02 lo
   muestra, pero la sesión no está completa). En su lugar, "Volver al inicio de sesión" cumple esa función.
7. **Validación del formulario de login**: `mode: 'onTouched'`. Al enviar con campos vacíos se muestra el
   resumen "Debe completar los campos requeridos" encima del botón, además del error por campo.

## Complexity Tracking

Sin violaciones de la constitución. No aplica.
