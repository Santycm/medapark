# Data Model: Autenticación del Administrador (001)

Esta feature **no crea tablas propias**. Usa las entidades que gestiona Supabase Auth (esquema `auth`) y
define estructuras de estado en el cliente.

## Entidades gestionadas por Supabase Auth (solo lectura para la app)

### `auth.users`: Cuenta de Administrador

| Campo | Tipo | Regla |
|-------|------|-------|
| `id` | uuid | PK. Es el `admin_id` que referenciará `public.parqueaderos` (feature 002) |
| `email` | text | Único. Se compara sin distinguir mayúsculas. Se muestra en el encabezado admin |
| `encrypted_password` | text | Lo gestiona Supabase |
| `email_confirmed_at` | timestamptz | Debe existir (se crea con "Auto Confirm User") |
| `banned_until` | timestamptz | Si está vigente, el login falla con el mensaje genérico de HU1 |

- **Creación**: manual por el equipo (dashboard). No hay registro público (`enable_signup = false`).
- **Regla**: todas las cuentas de `auth.users` son Administradores de Parqueadero (no hay otros roles con
  cuenta en el MVP).

### `auth.mfa_factors`: Factor TOTP

| Campo | Tipo | Regla |
|-------|------|-------|
| `id` | uuid | `factorId` usado en `challenge` y `verify` |
| `user_id` | uuid | FK a `auth.users` |
| `factor_type` | `'totp'` | Único tipo usado |
| `status` | `'unverified' \| 'verified'` | Solo `verified` cuenta para `requiere_verificacion` |
| `friendly_name` | text | `'MedaPark'` |

**Transiciones**:

```text
(ninguno) ──enroll()──► unverified ──verify(código OK)──► verified
unverified ──unenroll() (al iniciar un nuevo enrolamiento)──► (eliminado)
verified ──(eliminación manual por el equipo, ej. pérdida de teléfono)──► (eliminado)
```

Invariante de la app: **máximo 1 factor TOTP `verified`** por cuenta (FR-011).

### `auth.mfa_challenges`: Solicitud de verificación

| Campo | Regla |
|-------|-------|
| `id` | `challengeId` |
| `factor_id` | FK al factor |
| `created_at` | Vence según la configuración del servidor (`mfa_challenge_expired`) |

### Sesión (JWT)

| Claim | Valores | Uso |
|-------|---------|-----|
| `sub` | uuid | `auth.uid()` |
| `role` | `authenticated` | Rol de PostgreSQL |
| `aal` | `aal1` \| `aal2` | `aal2` = ambos factores superados → `public.es_sesion_aal2()` |
| `amr` | lista de métodos (`password`, `totp`) | Informativo |

## Estado en el cliente

### `AuthStage` (enum TypeScript)

```ts
type AuthStage =
  | 'cargando'                // resolviendo estado inicial
  | 'anonimo'                 // sin sesión
  | 'requiere_enrolamiento'   // aal1, sin factor TOTP verificado
  | 'requiere_verificacion'   // aal1, con factor TOTP verificado
  | 'autenticado';            // aal2
```

**Transiciones**:

```text
cargando ──► anonimo | requiere_enrolamiento | requiere_verificacion | autenticado
anonimo ──signIn OK──► requiere_enrolamiento | requiere_verificacion
requiere_enrolamiento ──enroll+verify OK──► autenticado
requiere_verificacion ──verify OK──► autenticado
requiere_* ──"Volver al inicio de sesión" | 5 fallos──► anonimo
autenticado ──"Cerrar sesión" | sesión expirada/invalidada──► anonimo
```

### `AuthContextValue`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `stage` | `AuthStage` | Estado actual |
| `user` | `{ id: string; email: string } \| null` | Usuario de la sesión (también en aal1) |
| `refresh` | `() => Promise<AuthStage>` | Recalcula el estado (tras signIn o verify) |
| `signOut` | `() => Promise<void>` | `signOut({ scope: 'local' })` y limpieza del contador MFA |

### Contador de intentos MFA (sessionStorage)

| Clave | Valor | Ciclo de vida |
|-------|-------|---------------|
| `medapark:mfa-fallos:<userId>` | entero 0–5 (string) | +1 con `mfa_verification_failed`; se elimina al verificar con éxito, cancelar, cerrar sesión o llegar a 5 |

## Validaciones (esquemas Zod)

### `loginSchema`

| Campo | Reglas | Mensaje |
|-------|--------|---------|
| `email` | `trim()`; obligatorio | "El correo electrónico es obligatorio." |
| | formato `^[^\s@]+@[^\s@]+\.[^\s@]+$` | "Verificar correo electrónico" |
| `password` | obligatorio (no se hace trim) | "La contraseña es obligatoria." |
| (formulario) | algún campo vacío al enviar | "Debe completar los campos requeridos" (resumen) |

### `otpSchema`

| Campo | Reglas | Mensaje |
|-------|--------|---------|
| `code` | exactamente 6 dígitos `^\d{6}$` | El botón "Verificar código" permanece deshabilitado hasta cumplirlo (sin mensaje) |
