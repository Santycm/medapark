# Contrato: módulo de autenticación

## `src/services/auth.ts` (migrado desde `auth.js`)

### Funciones existentes: se conservan con la misma firma (lanzan excepciones)

Las usan las páginas latentes (`Profile`, `SetupMfa`, `ForgotPassword`, `UpdatePassword`). Solo se agregan
tipos.

```ts
export function login(email: string, password: string):
  Promise<{ user: User; session: Session; requiresMfa: boolean }>;
export function logout(): Promise<void>;                       // signOut() (scope global, comportamiento actual)
export function getCurrentUser(): Promise<User | null>;
export function getSession(): Promise<Session | null>;
export function getAuthenticatorAssuranceLevel(): Promise<{ currentLevel: 'aal1' | 'aal2' | null; nextLevel: 'aal1' | 'aal2' | null }>;
export function getMfaFactors(): Promise<{ all: Factor[]; totp: Factor[] }>;
export function getVerifiedTotpFactor(): Promise<Factor | null>;
export function createMfaChallenge(factorId: string): Promise<{ id: string }>;
export function verifyMfa(factorId: string, challengeId: string, code: string): Promise<void>;
export function enrollMfa(): Promise<{ id: string; totp: { qr_code: string; secret: string; uri: string } }>;
export function unenrollMfa(factorId: string): Promise<void>;
export function resetPassword(email: string): Promise<void>;
export function updatePassword(password: string): Promise<void>;
```

### Funciones nuevas para el MVP: no lanzan, devuelven `Result` con el mensaje ya traducido

Se implementan **reutilizando** las existentes (envolviéndolas en try/catch con `toAuthErrorCode`).

```ts
import type { Result } from '../lib/result';
import type { AuthErrorCode } from '../lib/errors';

/** HU1: trim + toLowerCase del correo y luego login(). */
export function signInAdmin(email: string, password: string): Promise<Result<{ userId: string }, AuthErrorCode>>;

/** Estado actual: getCurrentUser + getAuthenticatorAssuranceLevel + getVerifiedTotpFactor. Nunca lanza (sin sesión → hasSession false). */
export function getAuthSnapshot(): Promise<{
  hasSession: boolean;
  user: { id: string; email: string } | null;
  currentLevel: 'aal1' | 'aal2' | null;
  verifiedTotpFactorId: string | null;
}>;

/** HU2 (enrolamiento): unenroll de los factores TOTP 'unverified' (getMfaFactors().all) y luego enrollMfa(). */
export function startTotpEnrollment(): Promise<Result<{ factorId: string; qrCodeSvg: string; secret: string }, AuthErrorCode>>;

/** HU2: createMfaChallenge envuelto. */
export function createChallenge(factorId: string): Promise<Result<{ challengeId: string }, AuthErrorCode>>;

/** HU2: verifyMfa envuelto (distingue codigo_incorrecto y codigo_expirado). */
export function verifyCode(factorId: string, challengeId: string, code: string): Promise<Result<void, AuthErrorCode>>;

/** HU8 y cancelación: signOut({ scope: 'local' }). Nunca falla hacia la UI. */
export function signOutLocal(): Promise<void>;
```

## Tipos y utilidades

```ts
// src/lib/result.ts
export type Result<T, C extends string = string> =
  | { ok: true; data: T }
  | { ok: false; code: C; message: string };

// src/lib/errors.ts
export type AuthErrorCode =
  | 'credenciales_invalidas' | 'codigo_incorrecto' | 'codigo_expirado' | 'factor_no_encontrado'
  | 'limite_frecuencia' | 'sesion_invalida' | 'permiso_denegado' | 'red';
export function toAuthErrorCode(error: unknown): AuthErrorCode;   // tabla de research.md §R3
export function toUserMessage(code: AuthErrorCode): string;
export function isSessionError(error: unknown): boolean;

// src/domain/authStage.ts
export type AuthStage = 'cargando' | 'anonimo' | 'requiere_enrolamiento' | 'requiere_verificacion' | 'autenticado';
export function resolveAuthStage(i: { hasSession: boolean; currentLevel: 'aal1' | 'aal2' | null; verifiedTotpCount: number }):
  Exclude<AuthStage, 'cargando'>;

// src/domain/mfaAttempts.ts
export const MAX_MFA_ATTEMPTS = 5;
export function getFailures(userId: string): number;
export function registerFailure(userId: string): number;
export function resetFailures(userId: string): void;

// src/context/AuthProvider.tsx + src/hooks/useAuth.ts
export type AuthContextValue = {
  stage: AuthStage;
  user: { id: string; email: string } | null;
  refresh: () => Promise<AuthStage>;
  signOut: () => Promise<void>;   // signOutLocal + resetFailures
};
export const AuthContext: React.Context<AuthContextValue | null>;
export function handleSessionError(error: unknown): Promise<boolean>; // true si era de sesión y se cerró
```

## Catálogo de mensajes (`src/lib/messages.ts`)

```ts
export const MSG = {
  login: {
    correoObligatorio: 'El correo electrónico es obligatorio.',
    contrasenaObligatoria: 'La contraseña es obligatoria.',
    correoFormato: 'Verificar correo electrónico',
    requeridos: 'Debe completar los campos requeridos',
    credenciales: 'El correo electrónico o la contraseña son incorrectos',
  },
  mfa: {
    incorrecto: 'El código de verificación es incorrecto',
    expirado: 'El código de verificación ha expirado. Solicita uno nuevo.',
    demasiadosIntentos: 'Demasiados intentos fallidos. Inicia sesión nuevamente.',
    ayudaCodigoNuevo: 'Abre tu app autenticadora para ver un código nuevo',
  },
  logout: {
    titulo: 'Cerrar sesión',
    pregunta: '¿Estás seguro de que deseas cerrar tu sesión?',
    detalle: 'Se finalizará tu sesión activa y serás redirigido a la pantalla de inicio de sesión.',
  },
  general: {
    red: 'No fue posible conectar con el servidor. Intenta nuevamente.',
    limiteFrecuencia: 'Demasiados intentos. Espera unos minutos e intenta nuevamente.',
    permisoDenegado: 'No tienes permisos para realizar esta acción. Contacta al administrador del sistema.',
    noEncontrada: 'Página no encontrada',
  },
} as const;
```

Las features 002 y 003 extienden `MSG`.

## Textos de UI

| Pantalla | Elemento | Texto |
|----------|----------|-------|
| Login | Título | Iniciar sesión |
| Login | Placeholders | `usuario@dominio` · `Ingresa tu contraseña` |
| Login | Botón | Ingresar (sin "¿Olvidaste tu contraseña?") |
| Enrolamiento | Título | Configurar verificación en dos pasos |
| Enrolamiento | Pasos | 1. Instala una app autenticadora (Google Authenticator, Microsoft Authenticator o similar). 2. Escanea el código QR. 3. Ingresa el código de 6 dígitos que muestra la app. |
| Enrolamiento | Clave manual | ¿No puedes escanear? Ingresa esta clave: `<secret>` (botón "Copiar") |
| Verificación | Título / subtítulo | Verificación en dos pasos / Ingresa el código de 6 dígitos de tu app autenticadora. |
| Ambas MFA | Campo y botones | Código de verificación * · Verificar código · Volver al inicio de sesión |
| Ambas MFA | Indicador de pasos | ✓ Credenciales verificadas → 2 Verificación MFA |
| Header admin | | Logo · `<correo>` · Cerrar sesión |
| Sidebar admin | | Mi parqueadero |
| Header público | | Logo · Acceso administradores |
