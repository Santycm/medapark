# Quickstart: Autenticación del Administrador (001)

Guía para levantar el proyecto y validar de forma manual cada user story. Las pruebas automatizadas se
ejecutan con `npm test` y `npx supabase test db --linked`.

## 0. Prerrequisitos (una vez)

1. Node.js 22 LTS y npm.
2. Proyecto en Supabase Cloud configurado según `research.md` §R12:
   - Registro público **deshabilitado**.
   - MFA TOTP **habilitado**.
   - Dos usuarios de prueba creados con "Auto Confirm User":
     - `admin1@medapark.test` (sin factor MFA, para probar el enrolamiento)
     - `admin2@medapark.test` (se enrola en el paso US2-A y se reutiliza)
     - Las contraseñas las define el equipo y **no** se versionan.
3. Una app autenticadora en el teléfono (Google Authenticator, Microsoft Authenticator o similar).

## 1. Configuración local

```bash
npm install
cp .env.example .env.local      # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push            # aplica supabase/migrations
npm run dev                     # http://localhost:5173
```

## 2. Verificación automatizada

```bash
npm run lint
npm run typecheck
npm test                        # Vitest
npx supabase test db --linked   # pgTAP (001_auth_helpers.test.sql)
```

Esperado: todo en verde.

## 3. Validación manual por user story

### US1: Iniciar sesión (HU1)

| # | Paso | Resultado esperado |
|---|------|--------------------|
| 1 | Abrir `http://localhost:5173/` y pulsar "Acceso administradores" | Pantalla "Iniciar sesión" (sin "Registrarse" ni "¿Olvidaste…?") |
| 2 | Pulsar "Ingresar" con los campos vacíos | Ambos campos en rojo, "El correo electrónico es obligatorio.", "La contraseña es obligatoria." y "Debe completar los campos requeridos" |
| 3 | Correo `admin1@medapark` → salir del campo | "Verificar correo electrónico" |
| 4 | Correo válido y contraseña errada → "Ingresar" | "El correo electrónico o la contraseña son incorrectos"; la contraseña se limpia |
| 5 | Pulsar el ícono de ojo | La contraseña se muestra y se oculta |
| 6 | `admin1` con la contraseña correcta | Va a `/admin/mfa/configurar` |

### US2-A: Enrolamiento (HU2, primera vez)

| # | Paso | Resultado esperado |
|---|------|--------------------|
| 1 | En `/admin/mfa/configurar` | Se ven el QR, la clave manual, el campo de 6 dígitos y "Verificar código" deshabilitado |
| 2 | Escribir `123456` (incorrecto) → "Verificar código" | "El código de verificación es incorrecto" |
| 3 | Escanear el QR con la app e ingresar el código vigente | Llega a `/admin` (panel placeholder) con el correo en el encabezado |

### US2-B: Verificación (HU2, ingresos siguientes)

| # | Paso | Resultado esperado |
|---|------|--------------------|
| 1 | Cerrar sesión y entrar de nuevo con `admin1` | Va a `/admin/mfa/verificar` (no al QR) |
| 2 | En otra pestaña abrir `http://localhost:5173/admin` | Redirige a `/admin/mfa/verificar` |
| 3 | Recargar la página (F5) | Permanece en `/admin/mfa/verificar` |
| 4 | Ingresar un código incorrecto 4 veces | Cada vez: "El código de verificación es incorrecto" |
| 5 | 5.º código incorrecto | Vuelve a "Iniciar sesión" con "Demasiados intentos fallidos. Inicia sesión nuevamente." |
| 6 | Entrar de nuevo, dejar la pantalla abierta más de 5 minutos e ingresar el código actual | "El código de verificación ha expirado. Solicita uno nuevo." Al ingresar el código vigente de nuevo, entra |
| 7 | "Volver al inicio de sesión" | Vuelve a login; abrir `/admin` redirige a login |
| 8 | Ingresar el código vigente | Llega a `/admin` |

### US3: Cerrar sesión y protección (HU8)

| # | Paso | Resultado esperado |
|---|------|--------------------|
| 1 | En `/admin`, pulsar "Cerrar sesión" en el encabezado | Modal "¿Estás seguro de que deseas cerrar tu sesión?" |
| 2 | "Cancelar" (y también probar Esc) | El modal se cierra y la sesión sigue |
| 3 | Abrir `/admin` en una segunda pestaña. En la primera, "Cerrar sesión" → confirmar | La primera va a login; la segunda, al navegar o recargar, también |
| 4 | Pulsar "Atrás" en el navegador | No se muestra el panel; redirige a login |
| 5 | Con sesión completa, abrir `/admin/login` | Redirige a `/admin` |
| 6 | Abrir `/admin/no-existe` con sesión completa | "Página no encontrada" con enlace al panel |

### Seguridad en el servidor (FR-018)

Con `admin1` en estado `aal1` (después del login, antes del código), ejecutar en la consola del navegador:

```js
const { data } = await window.__supabase.auth.getSession();
JSON.parse(atob(data.session.access_token.split('.')[1])).aal   // → "aal1"
```

(`window.__supabase` solo se expone cuando `import.meta.env.DEV` es true.) La prueba de que las tablas
rechazan `aal1` se hace en la feature 002.
