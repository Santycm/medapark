# Research: Autenticación del Administrador (001)

**Feature**: `001-autenticacion-admin` · **Fecha**: 2026-10-17

Cada decisión sigue el formato *Decision / Rationale / Alternatives considered*. No quedan
`NEEDS CLARIFICATION` abiertos.

---

## R1. Proveedor de autenticación y primer factor

- **Decision**: Supabase Auth con correo y contraseña (`supabase.auth.signInWithPassword`). Cuentas creadas
  manualmente en *Dashboard → Authentication → Users → Add user* con "Auto Confirm User" activado.
  **Registro público deshabilitado** (*Authentication → Sign In / Providers → Allow new users to sign up = OFF*).
- **Rationale**: la HU1 exige Supabase Auth. Deshabilitar el registro impide que alguien cree cuentas
  llamando a la API directamente, aunque la UI no ofrezca registro.
- **Alternatives considered**: magic link (no cumple HU1) y un proveedor OAuth (fuera de alcance).

## R2. Segundo factor: TOTP nativo de Supabase

- **Decision**: MFA TOTP de Supabase (`supabase.auth.mfa.*`), habilitado en *Authentication → Multi-Factor →
  TOTP*, que viene habilitado por defecto.
  - Enrolamiento: `mfa.enroll({ factorType: 'totp', friendlyName: 'MedaPark', issuer: 'MedaPark' })` devuelve
    `id`, `totp.qr_code` (SVG en *data URI*, se usa directo en `<img src>`), `totp.secret` y `totp.uri`.
  - Verificación: `mfa.challenge({ factorId })` devuelve `challengeId`, y luego
    `mfa.verify({ factorId, challengeId, code })`. Al verificar con éxito, la sesión sube a `aal2` y emite
    `MFA_CHALLENGE_VERIFIED`.
  - Estado: `mfa.getAuthenticatorAssuranceLevel()` devuelve `{ currentLevel, nextLevel }` y `mfa.listFactors()`
    devuelve `{ all, totp }`. Se filtran los factores con `factor_type === 'totp' && status === 'verified'`
    sobre `all` para no depender de la semántica de `totp`.
  - Limpieza: antes de un enrolamiento nuevo, se eliminan con `mfa.unenroll({ factorId })` los factores TOTP
    con `status === 'unverified'` (cumple FR-011 y evita el conflicto de `friendlyName`).
- **Rationale**: decisión del equipo (ver `docs/analisis-mvp.md` §5). Gratis, sin proveedor de correo, y el
  nivel `aal2` queda en el JWT, de modo que se puede exigir en el RLS (Principio II).
- **Alternatives considered**: OTP por correo propio con Edge Function y Resend (fiel al prototipo, pero con
  más piezas y otro proveedor) y SMS (de pago).

## R3. Códigos de error de Supabase Auth → mensajes de la spec

| Código (`error.code`) | Dónde ocurre | Mensaje mostrado |
|-----------------------|--------------|------------------|
| `invalid_credentials` | `signInWithPassword` | El correo electrónico o la contraseña son incorrectos |
| `user_banned` | `signInWithPassword` | El correo electrónico o la contraseña son incorrectos (no se revela el motivo) |
| `email_not_confirmed` | `signInWithPassword` | El correo electrónico o la contraseña son incorrectos |
| `mfa_verification_failed` | `mfa.verify` | El código de verificación es incorrecto (cuenta como fallo) |
| `mfa_challenge_expired` | `mfa.verify` | El código de verificación ha expirado. Solicita uno nuevo. (**no** cuenta como fallo; se crea un challenge nuevo) |
| `mfa_factor_not_found` | `mfa.challenge`/`verify` | Se cancela la sesión pendiente y se vuelve a login con el mensaje genérico |
| `over_request_rate_limit` | cualquiera | Demasiados intentos. Espera unos minutos e intenta nuevamente. |
| `session_expired`, `session_not_found`, `refresh_token_not_found` | cualquiera | Se cierra la sesión local y se redirige a login (sin mensaje de error) |
| Error de red o desconocido | cualquiera | No fue posible conectar con el servidor. Intenta nuevamente. |

- **Decision**: centralizar el mapeo en `src/lib/errors.ts` (`toUserMessage(error)`) y los textos en
  `src/lib/messages.ts`.
- **Rationale**: Principio I (textos literales en un solo lugar) y Principio IV (el mapeo es una función pura
  que se puede probar).

## R4. Límite de 5 intentos fallidos (FR-016)

- **Decision**: contador en `sessionStorage` con la clave `medapark:mfa-fallos:<userId>`. Se incrementa con
  `mfa_verification_failed`, se reinicia al verificar con éxito, al cancelar o al cerrar sesión. Al llegar a 5,
  se ejecuta `signOut({ scope: 'local' })`, se limpia el contador y se navega a `/admin/login` con el aviso
  "Demasiados intentos fallidos. Inicia sesión nuevamente." (pasado por `location.state`).
- **Rationale**: sobrevive a la recarga (la sesión pendiente también sobrevive) y no requiere tablas. El
  límite de frecuencia del servidor (*Rate limit for token verifications*, por IP) es la defensa real ante
  ataques automatizados.
- **Alternatives considered**: guardar los intentos en la base de datos con bloqueo temporal (descartado en
  clarify por complejidad).

## R5. Exigir `aal2` en el servidor (FR-018)

- **Decision**: crear una función SQL `public.es_sesion_aal2()` (`stable`, `security invoker`) que
  devuelve `coalesce((select auth.jwt()->>'aal') = 'aal2', false)`. Las tablas administrativas de la feature
  002 la usan en **políticas RESTRICTIVE** `to authenticated`, siguiendo el patrón oficial de Supabase:
  ```sql
  create policy "solo sesiones aal2" on <tabla> as restrictive to authenticated
    using ((select public.es_sesion_aal2()));
  ```
  Las RPC `security definer` de la 002 deben invocar `public.es_sesion_aal2()` explícitamente.
- **Rationale**: Principio II. La 001 entrega el helper con su prueba pgTAP para que la 002 solo lo consuma.
- **Alternatives considered**: comprobar `aal2` solo en el frontend (viola el Principio II).

## R6. Máquina de estados de la sesión en el frontend

- **Decision**: función pura `resolveAuthStage({ hasSession, currentLevel, verifiedTotpCount })` que devuelve:

  | Entrada | `AuthStage` |
  |---------|-------------|
  | sin sesión | `anonimo` |
  | sesión, `currentLevel = 'aal2'` | `autenticado` |
  | sesión, `aal1`, `verifiedTotpCount = 0` | `requiere_enrolamiento` |
  | sesión, `aal1`, `verifiedTotpCount ≥ 1` | `requiere_verificacion` |

  Un `AuthProvider` (React Context) calcula el estado al arrancar (validando con `auth.getUser()`, que
  consulta al servidor) y en cada `onAuthStateChange` (`SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`,
  `MFA_CHALLENGE_VERIFIED`, `USER_UPDATED`). Expone `{ stage, user, refresh(), signOut() }`. Mientras se
  resuelve, el estado es `cargando` y se muestra un spinner de pantalla completa.
- **Rationale**: un único punto de verdad para los guards de ruta (FR-022, FR-025). La función pura cubre con
  pruebas toda la matriz de acceso.
- **Alternatives considered**: loaders de React Router con `redirect` (válido, pero acopla los guards al
  router de datos; se prefiere un componente guard por simplicidad).

## R7. Guards de ruta

- **Decision**: tres componentes de layout de React Router (`<Outlet/>`):
  - `RequireAal2`: `autenticado` renderiza; `requiere_*` va a la pantalla MFA correspondiente; `anonimo`
    va a `/admin/login`.
  - `RequirePendingMfa`: permite `/admin/mfa/configurar` solo en `requiere_enrolamiento` y
    `/admin/mfa/verificar` solo en `requiere_verificacion`; `autenticado` va a `/admin`; `anonimo` va a
    `/admin/login`.
  - `RedirectIfAuthenticated` (para `/admin/login`): `autenticado` va a `/admin`; `requiere_*` va a MFA;
    `anonimo` renderiza el login.

  Todas las redirecciones usan `replace` para que "Atrás" no regrese a pantallas protegidas.
- **Rationale**: cubre los escenarios US2-11, US2-12, US3-5 y US3-8.

## R8. Cierre de sesión y multipestaña

- **Decision**: `supabase.auth.signOut({ scope: 'local' })`, que revoca en el servidor la sesión actual y
  limpia el almacenamiento. supabase-js sincroniza el estado entre pestañas del mismo origen, y el
  `AuthProvider` reacciona a `SIGNED_OUT` redirigiendo a `/admin/login`. Si una llamada a datos devuelve
  `401` o un error de JWT (`PGRST301`), se ejecuta `signOut({ scope: 'local' })` y se redirige.
- **Rationale**: FR-021, FR-023 y US3-9. `scope: 'local'` no cierra las sesiones de otros dispositivos del
  mismo administrador, que no es lo que pide la HU8.
- **Alternatives considered**: `scope: 'global'` (cerraría todos los dispositivos, más de lo pedido).

## R9. Stack del frontend (aplica a todo el repo; esta feature lo instala)

- **Decision**:
  - Vite 6 + React 18.3 + TypeScript 5 (`strict: true`).
  - Tailwind CSS v4 con `@tailwindcss/vite`. Tokens de diseño en `@theme` dentro de `src/styles/index.css`.
  - `react-router-dom` 6.x, en modo declarativo con `createBrowserRouter` y layouts con `<Outlet/>`.
  - `react-hook-form` + `zod` + `@hookform/resolvers`.
  - `@supabase/supabase-js` 2.x.
  - `lucide-react` para los íconos (equivalentes a los de los prototipos: Mail, Lock, Eye, LogOut, Car,
    Bike, MapPin, etc.).
  - Pruebas: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event` y
    `@testing-library/jest-dom`.
  - Calidad: ESLint (flat config con `typescript-eslint`, `eslint-plugin-react-hooks` y
    `eslint-plugin-jsx-a11y`) y Prettier.
- **Rationale**: Principio III (pocas dependencias, todas estándar) y decisiones del wizard.
- **Alternatives considered**: librerías de componentes (MUI, shadcn); se descartan para mantener el
  control visual fiel a los prototipos con Tailwind.

## R10. Tokens de diseño (extraídos de los prototipos)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-brand-600` | `#0E7C47` | Botones primarios ("Ingresar", "Guardar", "Verificar código"), ítem activo del menú |
| `--color-brand-700` | `#0B6239` | Hover del primario |
| `--color-brand-50` | `#E7F5EE` | Fondos suaves verdes (badge "Activo", tarjeta Motocicletas) |
| `--color-navy-900` | `#0B2559` | Títulos y texto fuerte, parte "Meda" del logo |
| `--color-navy-800` | `#14284B` | Fondo del menú lateral |
| `--color-accent-600` | `#1D5FD1` | Enlaces, cifras de "ocupadas", botón "Gestionar ocupación" |
| `--color-accent-50` | `#EAF2FE` | Fondos suaves azules (tarjeta Automóviles, avisos informativos) |
| `--color-danger-600` | `#E5343D` | Errores, bordes de campos inválidos, "Registrar salida", "Cerrar sesión" del modal |
| `--color-danger-50` | `#FDECEC` | Fondo de íconos de peligro |
| `--color-ink-500` | `#5B6B82` | Texto secundario y ayudas |
| `--color-line` | `#D6DEE8` | Bordes de inputs y tarjetas |
| `--color-canvas` | `#F4F7FB` | Fondo de página |
| Tipografía | Inter (Google Fonts) 400/500/600/700 | Toda la UI |
| Radios | `rounded-lg` en inputs y botones, `rounded-2xl` en tarjetas | |

- **Rationale**: Principio V. Los valores definitivos pueden ajustarse cuando existan los mocks de Pencil
  (`design/medapark.pen`). Si cambian, se actualiza solo `@theme`.

## R11. Pruebas de la base de datos contra Supabase en la nube

- **Decision**: pgTAP en `supabase/tests/*.test.sql`, ejecutado con `npx supabase test db --linked`. Requiere
  `create extension if not exists pgtap with schema extensions;` (incluido en la primera migración). Cada
  archivo corre en una transacción con `rollback`, así que no deja datos. Para simular sesiones se usa
  `set local role authenticated;` y
  `select set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated","aal":"aal2"}', true);`.
- **Rationale**: Principio IV. Supabase está en la nube (decisión del wizard), y `--linked` evita depender de
  Docker.
- **Alternatives considered**: Supabase local con Docker (descartado en el wizard; puede usarse de forma
  opcional con `--local`).

## R12. Configuración del proyecto Supabase (manual, una vez)

Pasos que el equipo realiza en el dashboard o la CLI (se documentan en `quickstart.md`):

1. Crear el proyecto (región `us-east-1` o la más cercana disponible).
2. *Authentication → Sign In / Providers → Email*: habilitado. *Allow new users to sign up*: **OFF**.
3. *Authentication → Multi-Factor*: TOTP **habilitado** (verificación y enrolamiento).
4. *Authentication → URL Configuration → Site URL*: `http://localhost:5173` (y la URL de Netlify si se despliega).
5. Crear los usuarios administradores (*Add user → Create new user*, con "Auto Confirm User").
6. `npx supabase login`, `npx supabase link --project-ref <ref>` y `npx supabase db push` para aplicar las
   migraciones.
7. Copiar `Project URL` y la `anon`/`publishable key` a `.env.local` (`VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`).
