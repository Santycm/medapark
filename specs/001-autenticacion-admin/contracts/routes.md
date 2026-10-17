# Contrato: rutas y guards (001)

Rutas que define esta feature. Las features 002 y 003 agregan rutas **dentro** de los mismos layouts y
guards, sin modificar la matriz de acceso.

## Tabla de rutas

| Ruta | Componente | Layout | Guard |
|------|------------|--------|-------|
| `/` | `HomePage` (placeholder; la 003 lo reemplaza) | `PublicLayout` | ninguno |
| `/admin/login` | `LoginPage` | `AuthLayout` | `RedirectIfAuthenticated` |
| `/admin/mfa/configurar` | `MfaEnrollPage` | `AuthLayout` | `RequirePendingMfa` (stage = `requiere_enrolamiento`) |
| `/admin/mfa/verificar` | `MfaVerifyPage` | `AuthLayout` | `RequirePendingMfa` (stage = `requiere_verificacion`) |
| `/admin` | `PanelPage` (placeholder; la 002 lo reemplaza por HU4) | `AdminLayout` | `RequireAal2` |
| `/admin/*` (no definida) | `NotFoundPage` | `AdminLayout` | `RequireAal2` |
| `*` | `NotFoundPage` | `PublicLayout` | ninguno |

## Matriz de acceso (resultado de navegar a la ruta según `AuthStage`)

| Ruta \ Stage | `anonimo` | `requiere_enrolamiento` | `requiere_verificacion` | `autenticado` |
|--------------|-----------|-------------------------|-------------------------|---------------|
| `/` | renderiza | renderiza | renderiza | renderiza |
| `/admin/login` | renderiza | → `/admin/mfa/configurar` | → `/admin/mfa/verificar` | → `/admin` |
| `/admin/mfa/configurar` | → `/admin/login` | renderiza | → `/admin/mfa/verificar` | → `/admin` |
| `/admin/mfa/verificar` | → `/admin/login` | → `/admin/mfa/configurar` | renderiza | → `/admin` |
| `/admin` y `/admin/**` | → `/admin/login` | → `/admin/mfa/configurar` | → `/admin/mfa/verificar` | renderiza |

- Con `stage = 'cargando'`, todos los guards muestran `<Spinner fullScreen/>` y no redirigen.
- Todas las redirecciones usan `<Navigate replace/>`.
- Esta matriz se prueba con Vitest (renderizando el router en memoria con un `AuthContext` simulado), con
  un caso por celda.

## Navegación tras las acciones

| Acción | Resultado |
|--------|-----------|
| Login OK | `refresh()`, luego navegar según el stage (`requiere_enrolamiento` o `requiere_verificacion`) |
| Verificación o enrolamiento OK | `refresh()`, luego `/admin` |
| "Volver al inicio de sesión" | `signOut()`, luego `/admin/login` |
| 5.º fallo MFA | `signOut()`, luego `/admin/login` con `state.notice = MSG.mfa.demasiadosIntentos` |
| "Cerrar sesión" confirmado | `signOut()`, luego `/admin/login` |
| Evento `SIGNED_OUT` (otra pestaña o expiración) | El guard redirige a `/admin/login` |
| Enlace "Acceso administradores" (`PublicLayout`) | `/admin/login` |
