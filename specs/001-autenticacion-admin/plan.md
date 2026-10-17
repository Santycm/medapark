# Implementation Plan: Autenticación del Administrador de Parqueadero

**Branch**: `feature/001-autenticacion-admin` | **Date**: 2026-10-17 (rev. integración con el repo) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-autenticacion-admin/spec.md`

## Summary

Esta feature parte del **código existente** del repo `Santycm/medapark` (JS, React 19, Supabase con MFA TOTP
opcional) y entrega:

1. **Migración a TypeScript** de todo `src/` sin cambiar comportamiento (base para las features 002 y 003),
   más tooling de pruebas (Vitest) y calidad (ESLint TS, `typecheck`).
2. **Autenticación según las HU**, reutilizando `src/services/auth` (ya migrado):
   - login HU1 rediseñado;
   - **MFA TOTP obligatorio** (HU2), con enrolamiento la primera vez, verificación, límite de 5 intentos y
     mensajes literales;
   - cierre de sesión con confirmación (HU8);
   - guards basados en una máquina de estados.
3. **Layouts** (auth, admin y público), tokens de diseño y kit de UI base.
4. **Compatibilidad**: redirecciones de las rutas antiguas y conservación de las pantallas latentes
   (recuperar contraseña, perfil, SetupMfa).

**Sin cambios en el back** (Supabase lo administran otras personas): la BD ya exige `aal2` en sus políticas.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) sobre el código existente; Node.js 22 LTS para el tooling

**Primary Dependencies (ya en el repo)**: React 19, react-dom 19, `react-router` 8, Vite 8, `@vitejs/plugin-react` 6, Tailwind CSS 4 + `@tailwindcss/vite`, `@supabase/supabase-js` 2, `lucide-react`, leaflet 1.9 + `react-leaflet` 5

**Primary Dependencies (nuevas)**: `typescript`, `typescript-eslint`, `react-hook-form` 7, `zod` (v3 o v4, la estable vigente), `@hookform/resolvers`, `eslint-plugin-jsx-a11y`; dev: `vitest`, `jsdom`, `@testing-library/react` (≥16, compatible con React 19), `@testing-library/user-event`, `@testing-library/jest-dom`, `@types/leaflet`, `prettier`, `supabase` (CLI, solo para `gen types`)

**Storage**: Supabase Auth (usuarios y factores MFA) del proyecto `Medapark`, **sin cambios**

**Testing**: Vitest + jsdom + Testing Library, con el cliente Supabase **simulado**; validación manual con `quickstart.md`

**Target Platform**: navegadores modernos (últimas 2 versiones de Chrome, Edge, Firefox y Safari), desktop y móvil ≥ 360 px; despliegue Netlify (rama `main`)

**Project Type**: SPA (front únicamente) sobre un back externo (Supabase)

**Performance Goals**: transición entre pasos de autenticación < 2 s (SC-001: login completo < 60 s, dominado por el usuario)

**Constraints**: no modificar Supabase (ni migraciones ni configuración); conservar las pantallas latentes; no romper las URLs publicadas (`/login`, `/verify-mfa`); textos literales de las HU

**Scale/Scope**: ~20 archivos existentes a migrar; 3 pantallas de autenticación rediseñadas, el layout admin y el modal de cierre de sesión

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|-----------|----------------|--------|
| I. HU como fuente de verdad | FR-001…FR-032 trazados a HU1, HU2 y HU8; desviaciones (TOTP y pantallas latentes) documentadas en la spec; mensajes en `src/lib/messages.ts` | ✅ |
| II. Back externo, solo front | Ningún SQL ni migración; la BD ya exige `aal2`; el front lo refleja con guards; solo `anon key` en `.env` | ✅ |
| III. Simplicidad y reutilización | Se migran y reutilizan `services/auth`, componentes y estructura del repo; Context + funciones puras; sin librerías de estado | ✅ |
| IV. Reglas verificables | Vitest: `resolveAuthStage`, `toAuthErrorCode`, esquemas Zod, contador de intentos, guards (matriz completa) y páginas | ✅ |
| V. UX en español y fiel | Tokens de `research.md` §R10, pantallas según HU01/HU02/HU08 y mocks; accesibilidad básica | ✅ |

**Post-design re-check**: ✅ Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/001-autenticacion-admin/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/
│   ├── routes.md          # rutas, redirecciones, rutas latentes y matriz de acceso
│   └── auth-service.md    # API de src/services/auth.ts (existente + nuevo), mensajes y textos de UI
├── checklists/requirements.md
└── tasks.md
```

### Source Code (estado objetivo tras la 001)

Se respeta la organización del repo (`pages/`, `components/<área>/`, `services/`, `lib/`, `router/`) y se
agregan `context/`, `hooks/`, `domain/` y `test/`. **(M)** = migrado desde `.jsx/.js`; **(M+R)** = migrado y
rediseñado; **(N)** = nuevo.

```text
.
├── index.html                       (M: lang="es", fuente Inter)
├── package.json                     (M: scripts typecheck/test/format/gen:types; deps nuevas)
├── tsconfig.json · tsconfig.app.json · tsconfig.node.json   (N)
├── vite.config.ts                   (M: + config de Vitest)
├── eslint.config.js                 (M: typescript-eslint + jsx-a11y)
├── .env.example                     (N)
├── public/ (_redirects, img/logo.svg, img/icon.svg)   (sin cambios)
└── src/
    ├── main.tsx · App.tsx           (M; App envuelve con AuthProvider)
    ├── index.css                    (M+R: tokens @theme, Inter; conserva leaflet.css)
    ├── vite-env.d.ts                (N)
    ├── router/
    │   ├── index.tsx                (M+R: rutas nuevas, redirecciones y latentes)
    │   └── guards/
    │       ├── RequireAal2.tsx               (N)
    │       ├── RequirePendingMfa.tsx         (N)
    │       └── RedirectIfAuthenticated.tsx   (N)
    ├── lib/
    │   ├── supabase.ts              (M: tipado con Database, valida env)
    │   ├── env.ts · messages.ts · errors.ts · result.ts   (N)
    │   └── database.types.ts        (N: generado con `supabase gen types`, solo lectura)
    ├── services/
    │   ├── auth.ts                  (M: conserva TODAS las funciones existentes + nuevas de contracts/auth-service.md)
    │   └── parkings.ts              (M: sin cambios funcionales; la 003 lo rediseña)
    ├── context/AuthProvider.tsx     (N)
    ├── hooks/useAuth.ts             (N)
    ├── domain/
    │   ├── authStage.ts · mfaAttempts.ts   (N)
    │   └── schemas/auth.ts          (N: loginSchema, otpSchema)
    ├── components/
    │   ├── auth/
    │   │   ├── AuthAlert.tsx · AuthButton.tsx · AuthCard.tsx · AuthInput.tsx · AuthMessage.tsx   (M: los usan las páginas latentes)
    │   │   ├── ProtectedRoute.tsx   (M: queda sin uso tras T024; se conserva marcado @deprecated)
    │   │   ├── OtpInput.tsx · AuthSteps.tsx · LogoutDialog.tsx   (N)
    │   ├── common/
    │   │   ├── Loader.tsx           (M)
    │   │   └── Button.tsx · TextField.tsx · PasswordField.tsx · Alert.tsx · Modal.tsx · Card.tsx · Logo.tsx   (N: kit de UI del MVP)
    │   ├── layout/
    │   │   └── AuthLayout.tsx · AdminLayout.tsx · AdminHeader.tsx · AdminSidebar.tsx · PublicLayout.tsx   (N)
    │   └── map/ParkingMap.tsx · ParkingMarker.tsx   (M: sin cambios funcionales; la 003 los rediseña)
    ├── pages/
    │   ├── auth/
    │   │   ├── Login.tsx · VerifyMfa.tsx   (M+R: rediseño HU1/HU2)
    │   │   ├── MfaEnroll.tsx        (N: enrolamiento obligatorio; reutiliza la lógica de SetupMfa)
    │   │   └── SetupMfa.tsx · ForgotPassword.tsx · UpdatePassword.tsx   (M: latentes, sin cambios funcionales)
    │   ├── app/
    │   │   ├── Profile.tsx          (M: latente; su "Cerrar sesión" usa signOut de useAuth)
    │   │   └── Panel.tsx            (N: placeholder; la 002 lo reemplaza)
    │   ├── public/Home.tsx · ParkingDetail.tsx   (M: sin cambios funcionales; la 003 los rediseña)
    │   └── NotFound.tsx             (N)
    └── test/setup.ts                (N)
```

**Structure Decision**: se conserva la estructura del repo para no desorientar al equipo (rol de
desarrollador rotativo). Las piezas nuevas siguen el mismo estilo (componentes con nombre en inglés y textos de
UI en español). Las pruebas van junto al archivo (`*.test.ts[x]`).

## Design Notes

1. **Migración a TS sin cambios de comportamiento (Fase 1)**: renombrar, tipar props y respuestas de
   Supabase (`Database` generado) y corregir los errores de `tsc`. No se rediseña nada en esta fase. Al
   terminar, `npm run build` debe funcionar y la app debe comportarse igual que antes. Commit propio.
2. **Reutilizar `services/auth.ts`**: las funciones existentes (`login`, `logout`, `getSession`,
   `getCurrentUser`, `getAuthenticatorAssuranceLevel`, `getMfaFactors`, `getVerifiedTotpFactor`,
   `createMfaChallenge`, `verifyMfa`, `enrollMfa`, `unenrollMfa`, `resetPassword` y `updatePassword`) **se
   conservan con su firma** (lanzan excepciones), porque las páginas latentes las usan. Las páginas del MVP
   usan funciones nuevas en el mismo módulo que **envuelven** las existentes y devuelven `Result` con mensajes
   ya traducidos (`contracts/auth-service.md`).
3. **MFA obligatorio**: hoy `login()` devuelve `requiresMfa` solo si el usuario ya tiene un factor, y
   `ProtectedRoute` deja pasar las sesiones `aal1` sin factor. Se reemplaza por `resolveAuthStage` (sin factor
   → `requiere_enrolamiento`), y los guards nuevos sustituyen a `ProtectedRoute` en todas las rutas.
4. **StrictMode y enrolamiento**: `MfaEnroll` protege `enroll` con `useRef` para no crear dos factores en
   desarrollo, y elimina los factores TOTP `unverified` antes de enrolar.
5. **Verificación**: el challenge se crea al montar y se renueva con `mfa_challenge_expired`. Se usa
   `verifyMfa(factorId, challengeId, code)` (no `challengeAndVerify`) para poder distinguir el vencimiento.
   Tras el éxito, `await refresh()` y luego navegar.
6. **Rutas latentes**: `/forgot-password` y `/update-password` siguen públicas (las usa el correo de
   recuperación de Supabase); `/profile` y `/setup-mfa` pasan a `RequireAal2`. Ninguna pantalla del MVP las
   enlaza. El login **ya no** muestra "¿Olvidaste tu contraseña?".
7. **Redirecciones**: `/login` → `/admin/login` y `/verify-mfa` → `/admin/mfa/verificar` con
   `<Navigate replace/>`. `/parking/:id` se mantiene con su página actual hasta la 003.
8. **Accesibilidad**: `OtpInput` usa un solo `<input inputMode="numeric" autoComplete="one-time-code"
   maxLength={6}>` con apariencia de 6 casillas. El modal atrapa el foco, cierra con Esc y devuelve el foco
   al disparador.
9. **Encabezado de las pantallas MFA**: sin "Administrador ▾ / Cerrar sesión" (la sesión no está completa);
   "Volver al inicio de sesión" cumple esa función.
10. **Supabase**: los agentes solo ejecutan `npx supabase gen types typescript --project-id
    msmfidnqmqntxbcucnsf > src/lib/database.types.ts` (solo lectura). La configuración de Auth la verifica el
    equipo (`quickstart.md` §0).

## Complexity Tracking

Sin violaciones de la constitución. No aplica.
