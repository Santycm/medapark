# Contrato: módulo de autenticación (`src/features/auth`)

API interna de TypeScript que consumen las páginas. Todas las funciones de `authService` **nunca lanzan
excepciones**: devuelven `Result<T>`, con el mensaje ya traducido para el usuario.

```ts
// src/features/auth/authService.ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: AuthErrorCode; message: string };

export type AuthErrorCode =
  | 'credenciales_invalidas'   // invalid_credentials | user_banned | email_not_confirmed
  | 'codigo_incorrecto'        // mfa_verification_failed
  | 'codigo_expirado'          // mfa_challenge_expired
  | 'factor_no_encontrado'     // mfa_factor_not_found
  | 'limite_frecuencia'        // over_request_rate_limit
  | 'sesion_invalida'          // session_expired | session_not_found | refresh_token_not_found | 401
  | 'red';                     // fetch failed / desconocido

/** HU1: primer factor. */
export function signInWithPassword(email: string, password: string): Promise<Result<{ userId: string }>>;

/** Lee el estado de la sesión: getUser() + getAuthenticatorAssuranceLevel() + listFactors(). */
export function getAuthSnapshot(): Promise<{
  hasSession: boolean;
  user: { id: string; email: string } | null;
  currentLevel: 'aal1' | 'aal2' | null;
  verifiedTotpFactorId: string | null;
}>;

/** HU2 (enrolamiento): elimina los factores TOTP unverified y crea uno nuevo. */
export function startTotpEnrollment(): Promise<Result<{
  factorId: string;
  qrCodeSvg: string;   // data URI para <img src>
  secret: string;      // para ingreso manual
}>>;

/** HU2: crea un challenge para el factor. */
export function createChallenge(factorId: string): Promise<Result<{ challengeId: string }>>;

/** HU2: verifica el código (lo usan tanto el enrolamiento como el login). */
export function verifyCode(factorId: string, challengeId: string, code: string): Promise<Result<void>>;

/** HU8 y cancelación: signOut({ scope: 'local' }). Nunca falla hacia la UI (si hay un error de red, limpia la sesión local igualmente). */
export function signOut(): Promise<void>;
```

```ts
// src/features/auth/authStage.ts
export function resolveAuthStage(input: {
  hasSession: boolean;
  currentLevel: 'aal1' | 'aal2' | null;
  verifiedTotpCount: number;
}): Exclude<AuthStage, 'cargando'>;
```

```ts
// src/features/auth/mfaAttempts.ts
export const MAX_MFA_ATTEMPTS = 5;
export function getFailures(userId: string): number;
export function registerFailure(userId: string): number; // devuelve el total tras incrementar
export function resetFailures(userId: string): void;
```

```ts
// src/lib/errors.ts
export function toAuthErrorCode(error: unknown): AuthErrorCode;
export function toUserMessage(code: AuthErrorCode): string;
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
    noEncontrada: 'Página no encontrada',
  },
} as const;
```

Las features 002 y 003 **extienden** `MSG` con sus propias secciones (`parqueadero`, `celdas`, `ocupacion`,
`publico`).

## Textos de UI (no son mensajes de error)

| Pantalla | Elemento | Texto |
|----------|----------|-------|
| Login | Título | Iniciar sesión |
| Login | Placeholders | `usuario@dominio` · `Ingresa tu contraseña` |
| Login | Botón | Ingresar |
| Enrolamiento | Título | Configurar verificación en dos pasos |
| Enrolamiento | Pasos | 1. Instala una app autenticadora (Google Authenticator, Microsoft Authenticator o similar). 2. Escanea el código QR. 3. Ingresa el código de 6 dígitos que muestra la app. |
| Enrolamiento | Clave manual | ¿No puedes escanear? Ingresa esta clave: `<secret>` (con botón "Copiar") |
| Verificación | Título | Verificación en dos pasos |
| Verificación | Subtítulo | Ingresa el código de 6 dígitos de tu app autenticadora. |
| Verificación y enrolamiento | Campo | Código de verificación * |
| Verificación y enrolamiento | Botones | Verificar código · Volver al inicio de sesión |
| Verificación y enrolamiento | Indicador de pasos | ✓ Credenciales verificadas → 2 Verificación MFA |
| Header admin | | Logo · `<correo>` · Cerrar sesión |
| Sidebar admin | | Mi parqueadero |
| Header público | | Logo · Acceso administradores |
