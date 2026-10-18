# Contrato: rutas y guards (001)

Definidas en `src/router/index.tsx` con la API declarativa de `react-router` que ya usa el repo
(`<Routes>`/`<Route>`, layouts con `<Outlet/>`, `<Navigate replace/>`). Las páginas se cargan con `lazy()`
como hoy, y el `Suspense` usa `Loader`. Las features 002 y 003 agregan rutas **dentro** de los mismos
layouts y guards, sin cambiar la matriz de acceso.

## Rutas del MVP

| Ruta | Página | Layout | Guard |
|------|--------|--------|-------|
| `/` | `pages/public/Home` (existente; la 003 lo rediseña) | sin layout (como hoy); la 003 lo pasa a `PublicLayout` | ninguno |
| `/admin/login` | `pages/auth/Login` (rediseñado) | `AuthLayout` | `RedirectIfAuthenticated` |
| `/admin/mfa/configurar` | `pages/auth/MfaEnroll` (nuevo) | `MfaLayout` | `RequirePendingMfa expected="requiere_enrolamiento"` |
| `/admin/mfa/verificar` | `pages/auth/VerifyMfa` (rediseñado) | `MfaLayout` | `RequirePendingMfa expected="requiere_verificacion"` |
| `/admin` | `pages/app/Panel` (placeholder; la 002 lo reemplaza por HU4) | `AdminLayout` | `RequireAal2` |
| `/admin/*` (no definida) | `pages/NotFound` | `AdminLayout` | `RequireAal2` |
| `*` | `pages/NotFound` | — | ninguno |

## Redirecciones (compatibilidad con URLs ya publicadas)

| Ruta antigua | Destino |
|--------------|---------|
| `/login` | `<Navigate to="/admin/login" replace/>` |
| `/verify-mfa` | `<Navigate to="/admin/mfa/verificar" replace/>` (luego aplica el guard) |

`/parking/:id` se conserva con su página actual hasta la 003, que la convierte en una redirección.

## Rutas latentes (existentes, fuera del MVP, sin enlaces desde la UI)

| Ruta | Página (migrada sin cambios funcionales) | Guard |
|------|------------------------------------------|-------|
| `/forgot-password` | `pages/auth/ForgotPassword` | ninguno |
| `/update-password` | `pages/auth/UpdatePassword` | ninguno (llega desde el correo de Supabase) |
| `/profile` | `pages/app/Profile` | `RequireAal2` |
| `/setup-mfa` | `pages/auth/SetupMfa` | `RequireAal2` |

Las pruebas verifican que ninguna pantalla del MVP contenga enlaces a estas rutas.

## Matriz de acceso (`AuthStage` → resultado)

| Ruta \ Stage | `anonimo` | `requiere_enrolamiento` | `requiere_verificacion` | `autenticado` |
|--------------|-----------|-------------------------|-------------------------|---------------|
| `/` | renderiza | renderiza | renderiza | renderiza |
| `/admin/login` | renderiza | → `/admin/mfa/configurar` | → `/admin/mfa/verificar` | → `/admin` |
| `/admin/mfa/configurar` | → `/admin/login` | renderiza | → `/admin/mfa/verificar` | → `/admin` |
| `/admin/mfa/verificar` | → `/admin/login` | → `/admin/mfa/configurar` | renderiza | → `/admin` |
| `/admin` y `/admin/**`, `/profile`, `/setup-mfa` | → `/admin/login` | → `/admin/mfa/configurar` | → `/admin/mfa/verificar` | renderiza |

- Con `stage = 'cargando'`, los guards muestran `<Loader/>` y no redirigen.
- Se prueba con Vitest (`MemoryRouter` + `AuthContext` simulado), con un caso por celda más las
  redirecciones antiguas.

## Navegación tras las acciones

| Acción | Resultado |
|--------|-----------|
| Login OK | `refresh()` y navegación según el stage |
| Enrolamiento o verificación OK | `refresh()` y `/admin` |
| "Volver al inicio de sesión" | `signOut()` y `/admin/login` |
| 5.º fallo MFA | `signOut()` y `/admin/login` con `state.notice = MSG.mfa.demasiadosIntentos` |
| "Cerrar sesión" confirmado | `signOut()` y `/admin/login` |
| Evento `SIGNED_OUT` (otra pestaña o expiración) | el guard redirige a `/admin/login` |
| "Acceso administradores" (encabezado público) | `/admin/login` |
