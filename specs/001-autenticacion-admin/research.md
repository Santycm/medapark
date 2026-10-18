# Research: Autenticación del Administrador (001)

**Feature**: `001-autenticacion-admin` · **Fecha**: 2026-10-17 (rev. integración con el repo `Santycm/medapark`)

Formato *Decision / Rationale / Alternatives considered*. No quedan `NEEDS CLARIFICATION`.

---

## R1. Proveedor de autenticación y primer factor

- **Decision**: Supabase Auth con correo y contraseña, usando la función existente `login(email, password)`
  de `src/services/auth` (`signInWithPassword`). Las cuentas las crean los administradores del back. El
  registro público debe estar deshabilitado en el proyecto, cosa que verifica el equipo (no los agentes).
- **Rationale**: lo exige la HU1, ya está implementado en el repo y no requiere cambios en el back.
- **Alternatives considered**: magic link u OAuth (no cumplen la HU1).

## R2. Segundo factor: TOTP de Supabase, reutilizando el código del repo

- **Decision**: reutilizar las funciones existentes de `src/services/auth` (migradas a TS):
  - `enrollMfa()` → `mfa.enroll({ factorType: 'totp', friendlyName: 'MedaPark' })` devuelve `id`,
    `totp.qr_code` (SVG en *data URI*) y `totp.secret`;
  - `createMfaChallenge(factorId)` → `{ id }`;
  - `verifyMfa(factorId, challengeId, code)`;
  - `getVerifiedTotpFactor()` → factor `verified` o `null`;
  - `getMfaFactors()` / `unenrollMfa(factorId)` para limpiar los factores `unverified` antes de un nuevo
    enrolamiento;
  - `getAuthenticatorAssuranceLevel()` → `{ currentLevel, nextLevel }`.

  Cambio de comportamiento: el MFA pasa de **opcional** (hoy `ProtectedRoute` deja pasar las sesiones `aal1`
  sin factor) a **obligatorio**, mediante `resolveAuthStage` (R6) y los guards (R7).
- **Rationale**: lo pidió el equipo ("usar el MFA que ya está implementado"). Es el mismo mecanismo TOTP
  decidido en el wizard.
- **Alternatives considered**: OTP por correo (requería un back propio) y SMS (de pago).

## R3. Códigos de error de Supabase Auth → mensajes de la spec

| Código (`error.code`) | Dónde ocurre | Mensaje mostrado |
|-----------------------|--------------|------------------|
| `invalid_credentials` | `login` | El correo electrónico o la contraseña son incorrectos |
| `user_banned`, `email_not_confirmed` | `login` | El correo electrónico o la contraseña son incorrectos (no se revela el motivo) |
| `mfa_verification_failed` | `verifyMfa` | El código de verificación es incorrecto (cuenta como fallo) |
| `mfa_challenge_expired` | `verifyMfa` | El código de verificación ha expirado. Solicita uno nuevo. (**no** cuenta como fallo; se crea otro challenge) |
| `mfa_factor_not_found` | `createMfaChallenge`/`verifyMfa` | Se cancela la sesión pendiente y se vuelve a login con el mensaje genérico de red |
| `over_request_rate_limit` | cualquiera | Demasiados intentos. Espera unos minutos e intenta nuevamente. |
| `session_expired`, `session_not_found`, `refresh_token_not_found`, HTTP 401 | cualquiera | Cierre de la sesión local y redirección a login (sin mensaje) |
| `42501` (PostgREST, permiso denegado) | datos (002/003) | No tienes permisos para realizar esta acción. Contacta al administrador del sistema. |
| Error de red o desconocido | cualquiera | No fue posible conectar con el servidor. Intenta nuevamente. |

- **Decision**: centralizar en `src/lib/errors.ts` (`toAuthErrorCode`, `toUserMessage`) con los textos en
  `src/lib/messages.ts`. Las páginas latentes siguen mostrando `error.message` como hoy (sin cambios).

## R4. Límite de 5 intentos fallidos (FR-016)

- **Decision**: contador en `sessionStorage` con la clave `medapark:mfa-fallos:<userId>`
  (`src/domain/mfaAttempts.ts`). Suma 1 con `mfa_verification_failed` y se reinicia al tener éxito, al
  cancelar o al cerrar sesión. Al llegar a 5: `signOut()`, limpieza del contador y navegación a
  `/admin/login` con `state.notice`.
- **Rationale**: sobrevive a la recarga y no requiere back. El límite real ante ataques lo pone Supabase
  (límite de tasa por IP).

## R5. Exigir `aal2` en el servidor (FR-018)

- **Decision**: **no se requiere ningún cambio**. Las políticas RLS existentes de `parking_lots` y
  `parking_vehicle_configs` y las RPC de ocupación ya exigen `auth.jwt()->>'aal' = 'aal2'` y dueño
  (`docs/supabase-esquema-actual.md`). El front lo complementa con guards (UX).
- **Rationale**: Principio II (el back es externo y ya cumple).

## R6. Máquina de estados de la sesión

| Entrada | `AuthStage` |
|---------|-------------|
| sin sesión | `anonimo` |
| sesión, `currentLevel = 'aal2'` | `autenticado` |
| sesión, `aal1`, sin factor TOTP verificado | `requiere_enrolamiento` |
| sesión, `aal1`, con factor TOTP verificado | `requiere_verificacion` |

- **Decision**: función pura `resolveAuthStage` en `src/domain/authStage.ts`. `AuthProvider`
  (`src/context/`) calcula el estado al arrancar (validando con `getCurrentUser()`, que consulta al servidor)
  y en cada `onAuthStateChange` (`SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `MFA_CHALLENGE_VERIFIED`,
  `USER_UPDATED`), difiriendo el trabajo asíncrono con `setTimeout(…, 0)`. Expone
  `{ stage, user, refresh(), signOut() }`.

## R7. Guards de ruta

- **Decision**: `RequireAal2`, `RequirePendingMfa` (prop `expected`) y `RedirectIfAuthenticated` en
  `src/router/guards/`, como rutas de layout con `<Outlet/>` y `<Navigate replace/>`. La API declarativa de
  `react-router` que ya usa el repo (`<Routes>`, `<Route>`) se mantiene.
- **Rationale**: cubre la matriz de `contracts/routes.md` y reemplaza a `ProtectedRoute`.

## R8. Cierre de sesión y multipestaña

- **Decision**: la función `logout()` existente hace `signOut()`, que por defecto es de alcance `global`.
  Se agrega `signOutLocal()` → `signOut({ scope: 'local' })` para el MVP (solo esta sesión, como pide la
  HU8). `AuthProvider` reacciona a `SIGNED_OUT` (supabase-js sincroniza entre pestañas). Ante un error 401 o
  de JWT en una llamada de datos, `handleSessionError` cierra la sesión local.
- **Alternatives considered**: `global` (cerraría los otros dispositivos del admin, más de lo pedido).

## R9. Stack (el del repo, migrado a TS)

- **Decision**: se mantienen las versiones del repo (React 19, `react-router` 8, Vite 8, Tailwind 4,
  `react-leaflet` 5, supabase-js 2, lucide-react) y se agregan TypeScript (strict), `typescript-eslint`,
  React Hook Form + Zod + `@hookform/resolvers`, Vitest + jsdom + Testing Library (≥16 para React 19) y
  Prettier.
  - `tsconfig.app.json`: `"strict": true`, `"jsx": "react-jsx"`, `"moduleResolution": "bundler"`,
    `"types": ["vite/client", "vitest/globals"]`.
  - Antes de instalar, verificar en `package.json` las versiones exactas y escoger versiones compatibles de
    las dependencias nuevas (por ejemplo, `zod` estable vigente y `@hookform/resolvers` compatible).
- **Rationale**: decisión del equipo (stack del repo migrado a TS). No se bajan versiones.

## R10. Tokens de diseño (prototipos y logos)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-brand-600` | `#0E7C47` | Primario (verde "Park" del logo): "Ingresar", "Guardar", "Verificar código", menú activo |
| `--color-brand-700` | `#0B6239` | Hover del primario |
| `--color-brand-50` | `#E7F5EE` | Fondos suaves verdes |
| `--color-navy-900` | `#0B2559` | Títulos ("Meda" del logo) |
| `--color-navy-800` | `#14284B` | Fondo del menú lateral |
| `--color-accent-600` | `#1D5FD1` | Enlaces, "ocupadas", "Gestionar ocupación" |
| `--color-accent-50` | `#EAF2FE` | Fondos suaves azules, avisos informativos |
| `--color-danger-600` | `#E5343D` | Errores, "Registrar salida", confirmar "Cerrar sesión" |
| `--color-danger-50` | `#FDECEC` | Fondos de peligro |
| `--color-ink-500` | `#5B6B82` | Texto secundario |
| `--color-line` | `#D6DEE8` | Bordes |
| `--color-canvas` | `#F4F7FB` | Fondo de página |
| `--font-sans` | `"Inter", system-ui, sans-serif` | Toda la UI (reemplaza Nunito/Poppins; si el equipo prefiere Nunito, se cambia solo este token) |

Logos: `public/img/logo.svg` (horizontal) y `public/img/icon.svg` (ícono). Las referencias raster están en
`docs/assets/logos/`.

## R11. Pruebas

- **Decision**: solo Vitest (unitarias y de componentes) con `vi.mock('../lib/supabase')` o
  `vi.mock('../services/auth')`. **No** hay pruebas contra el Supabase remoto (Principio II) ni pgTAP (no hay
  SQL propio). La integración real se valida a mano con `quickstart.md` y las cuentas de prueba del equipo.

## R12. Verificaciones del back que hace el equipo (no los agentes)

1. *Authentication → Sign In / Providers → Allow new users to sign up*: **OFF**.
2. *Authentication → Multi-Factor*: TOTP **habilitado**.
3. *Authentication → URL Configuration*: Site URL y Redirect URLs incluyen `http://localhost:5173` y la URL
   de Netlify (las usa la pantalla latente de recuperación de contraseña).
4. Cuentas de administrador de prueba creadas (con "Auto Confirm User").
