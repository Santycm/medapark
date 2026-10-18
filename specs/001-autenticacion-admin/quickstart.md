# Quickstart: Autenticación del Administrador (001)

Guía para levantar el proyecto y validar cada user story. Las pruebas automatizadas se ejecutan con
`npm test` (Vitest, con Supabase simulado). **No** se ejecuta nada contra el Supabase remoto salvo el uso
normal de la app y `gen types` (solo lectura).

## 0. Prerrequisitos

1. Node.js 22 LTS y npm.
2. Archivo `.env` (no versionado) con los mismos valores que usa Netlify:
   `VITE_SUPABASE_URL=https://msmfidnqmqntxbcucnsf.supabase.co` y `VITE_SUPABASE_ANON_KEY=<anon key>`.
3. **Checklist del back (la verifica el equipo que administra Supabase; los agentes no la modifican)**:
   - [ ] Registro público deshabilitado (*Allow new users to sign up = OFF*).
   - [ ] MFA TOTP habilitado.
   - [ ] Site URL y Redirect URLs con `http://localhost:5173` y la URL de Netlify.
   - [ ] Dos cuentas de prueba: `admin1` **sin** factor MFA (para probar el enrolamiento) y `admin2`. Las
         contraseñas no se versionan.
4. Una app autenticadora en el teléfono (Google Authenticator, Microsoft Authenticator o similar).

## 1. Configuración local

```bash
npm install
npm run dev                     # http://localhost:5173
```

Opcional, para regenerar los tipos (solo lectura; requiere `npx supabase login`):

```bash
npx supabase gen types typescript --project-id msmfidnqmqntxbcucnsf > src/lib/database.types.ts
```

## 2. Verificación automatizada

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Esperado: todo en verde.

## 3. Validación de la migración a TypeScript (Fase 1, antes de rediseñar)

| # | Paso | Esperado |
|---|------|----------|
| 1 | `npm run build` | Sin errores de TypeScript |
| 2 | Abrir `/` | El mapa del repo funciona igual que antes (marcadores y popup) |
| 3 | Abrir `/parking/<id>` desde un popup | Se ve el detalle como antes |
| 4 | Abrir `/login` e iniciar sesión con una cuenta con MFA | El flujo anterior sigue funcionando (aún sin rediseño) |

## 4. Validación manual por user story

### US1: Iniciar sesión (HU1)

| # | Paso | Esperado |
|---|------|----------|
| 1 | En `/`, pulsar "Acceso administradores" | Va a `/admin/login`: "Iniciar sesión", sin "Registrarse" ni "¿Olvidaste tu contraseña?" |
| 2 | Abrir `/login` | Redirige a `/admin/login` |
| 3 | "Ingresar" con los campos vacíos | "El correo electrónico es obligatorio.", "La contraseña es obligatoria." y "Debe completar los campos requeridos" |
| 4 | Correo `admin1@medapark` → salir del campo | "Verificar correo electrónico" |
| 5 | Correo válido con una contraseña errada | "El correo electrónico o la contraseña son incorrectos"; la contraseña se limpia |
| 6 | Ícono de ojo | Muestra u oculta la contraseña |
| 7 | `admin1` con la contraseña correcta | Va a `/admin/mfa/configurar` |

### US2-A: Enrolamiento obligatorio (HU2, primera vez)

| # | Paso | Esperado |
|---|------|----------|
| 1 | En `/admin/mfa/configurar` | QR, clave manual, campo de 6 dígitos y "Verificar código" deshabilitado |
| 2 | Código `123456` | "El código de verificación es incorrecto" |
| 3 | Escanear e ingresar el código vigente | Llega a `/admin` con el correo en el encabezado |

### US2-B: Verificación (HU2)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Cerrar sesión y entrar con `admin1` | Va a `/admin/mfa/verificar` |
| 2 | En otra pestaña abrir `/admin` | Redirige a `/admin/mfa/verificar` |
| 3 | Abrir `/verify-mfa` | Redirige a `/admin/mfa/verificar` |
| 4 | F5 | Permanece en la verificación |
| 5 | 4 códigos incorrectos | Cada uno: "El código de verificación es incorrecto" |
| 6 | 5.º incorrecto | Vuelve a login con "Demasiados intentos fallidos. Inicia sesión nuevamente." |
| 7 | Entrar, esperar más de 5 minutos e ingresar el código actual | "El código de verificación ha expirado. Solicita uno nuevo."; con el código vigente siguiente, entra |
| 8 | "Volver al inicio de sesión" | Vuelve a login; `/admin` redirige a login |

### US3: Cerrar sesión y protección (HU8)

| # | Paso | Esperado |
|---|------|----------|
| 1 | En `/admin` → "Cerrar sesión" | Modal "¿Estás seguro de que deseas cerrar tu sesión?" |
| 2 | "Cancelar" y Esc | Cierra el modal; la sesión sigue |
| 3 | Dos pestañas: cerrar sesión en una | La otra, al navegar, termina en login |
| 4 | "Atrás" tras cerrar sesión | No muestra el panel |
| 5 | Con sesión completa, abrir `/admin/login` | Redirige a `/admin` |
| 6 | `/admin/no-existe` | "Página no encontrada" con enlace al panel |

### Rutas latentes (FR-032)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Revisar Login, MFA, panel y encabezados | Ningún enlace a `/forgot-password`, `/update-password`, `/profile` o `/setup-mfa` |
| 2 | Sin sesión, abrir `/profile` | Redirige a `/admin/login` |
| 3 | Con sesión completa, abrir `/profile` | Se ve la página existente (sin rediseño) |
| 4 | Abrir `/forgot-password` | Se ve la página existente |
