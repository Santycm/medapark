---
description: "Task list for 001-autenticacion-admin"
---

# Tasks: Autenticación del Administrador de Parqueadero

**Input**: Design documents from `specs/001-autenticacion-admin/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (routes, auth-service, sql-helpers), quickstart.md

**Tests**: OBLIGATORIAS según la constitución (Principio IV): Vitest para validadores, funciones puras y componentes con lógica condicional, y pgTAP para SQL. Dentro de cada story, escribir las pruebas antes o junto con la implementación; deben pasar antes de cerrar la story.

**Organization**: tareas agrupadas por user story (US1 = HU1, US2 = HU2, US3 = HU8).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1, US2, US3
- Rutas relativas a la raíz del repo (`MedaPark/`)

---

## Phase 1: Setup (infraestructura compartida)

**Purpose**: crear el proyecto frontend, las herramientas y el enlace con Supabase. Esta feature establece la base de todo el repo.

- [ ] T001 Crear el proyecto Vite + React + TypeScript **en la raíz del repo** (que no está vacía: generar con `npm create vite@latest medapark-tmp -- --template react-ts` en una carpeta temporal y mover `index.html`, `package.json`, `vite.config.ts`, `tsconfig*.json`, `src/main.tsx` y `public/` a la raíz; borrar el demo, `App.css` y los assets de ejemplo). En `package.json`, `"name": "medapark"`, `"type": "module"` y los scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint` (`eslint .`), `typecheck` (`tsc -b --noEmit`), `test` (`vitest run`), `test:watch` (`vitest`), `format` (`prettier --write .`), `db:test` (`supabase test db --linked`), `db:push` (`supabase db push`)
- [ ] T002 Instalar dependencias: `react@18 react-dom@18 react-router-dom@6 @supabase/supabase-js@2 react-hook-form@7 zod@3 @hookform/resolvers lucide-react` y, como dev, `tailwindcss@4 @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom eslint typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-jsx-a11y prettier supabase` en `package.json`
- [ ] T003 [P] Configurar Tailwind v4: plugin `@tailwindcss/vite` en `vite.config.ts`; crear `src/styles/index.css` con `@import "tailwindcss";` y un bloque `@theme` con los tokens de `research.md` §R10 (`--color-brand-600`, `--color-brand-700`, `--color-brand-50`, `--color-navy-900`, `--color-navy-800`, `--color-accent-600`, `--color-accent-50`, `--color-danger-600`, `--color-danger-50`, `--color-ink-500`, `--color-line`, `--color-canvas`, `--font-sans: "Inter", system-ui, sans-serif`); cargar Inter 400/500/600/700 desde Google Fonts en `index.html`; `<html lang="es">` y `<title>MedaPark</title>`
- [ ] T004 [P] Configurar ESLint flat config en `eslint.config.js` (typescript-eslint recomendado, react-hooks, react-refresh, jsx-a11y recomendado) y Prettier en `.prettierrc` (`singleQuote: true`, `semi: true`, `printWidth: 100`) más `.prettierignore` (`dist`, `coverage`, `supabase/.temp`)
- [ ] T005 [P] Configurar Vitest en `vite.config.ts` (`test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'], css: false }`) y crear `src/test/setup.ts` (importa `@testing-library/jest-dom/vitest`; `afterEach` limpia `sessionStorage` y llama a `cleanup()`). Agregar `"types": ["vitest/globals"]` en `tsconfig.app.json`
- [ ] T006 [P] Crear `.env.example` con `VITE_SUPABASE_URL=` y `VITE_SUPABASE_ANON_KEY=`, y `src/lib/env.ts`, que lee `import.meta.env`, valida con zod que ambas variables existan (URL válida) y lanza un error claro en español si faltan
- [ ] T007 [P] Crear `netlify.toml` con `[build] command = "npm run build"`, `publish = "dist"` y la redirección SPA `from = "/*" to = "/index.html" status = 200`
- [ ] T008 Inicializar Supabase CLI: `npx supabase init` (genera `supabase/config.toml`; responder *No* a la configuración de VS Code/Deno), crear `supabase/seed.sql` vacío con un comentario y documentar en `README.md` (sección "Desarrollo") los comandos `npx supabase login` y `npx supabase link --project-ref <ref>`
- [ ] T009 [P] **Mocks (Pencil MCP, en otra sesión)**: en `design/medapark.pen` crear las pantallas *Login* (base `docs/prototipos/HU01-iniciar-sesion.jpg`), *MFA – Configurar* (nueva: QR + clave + código; sin prototipo, seguir el estilo de HU02), *MFA – Verificar* (base `HU02-verificar-mfa.jpg`, **sin** "Reenviar código", con la indicación "Abre tu app autenticadora…" y **sin** "Administrador/Cerrar sesión" en el encabezado), *Layout admin + modal de cierre de sesión* (base `HU08-cerrar-sesion.jpg`, con menú lateral solo "Mi parqueadero") y *Página no encontrada*. Usar los tokens de `research.md` §R10. Requisito previo de las tareas de UI (T022, T027, T028, T033)

---

## Phase 2: Foundational (prerrequisitos bloqueantes)

**Purpose**: cliente Supabase, mensajes, errores, UI base, layouts, máquina de estados, guards, router y helper SQL.

**⚠️ CRITICAL**: ninguna user story puede empezar hasta completar esta fase.

- [ ] T010 Crear `src/lib/supabase.ts`: un único `createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })` exportado como `supabase`; si `import.meta.env.DEV`, asignar `window.__supabase = supabase` (declarar el tipo en `src/vite-env.d.ts`)
- [ ] T011 [P] Crear `src/lib/messages.ts` con el objeto `MSG` **exactamente** como en `contracts/auth-service.md` (§Catálogo de mensajes), exportado `as const`
- [ ] T012 [P] Crear `src/lib/errors.ts` con `toAuthErrorCode(error: unknown): AuthErrorCode` (mapeo de `research.md` §R3 por `error.code`; `status === 401` o `code === 'PGRST301'` → `sesion_invalida`; `TypeError`/fetch → `red`; desconocido → `red`) y `toUserMessage(code)` → `MSG`. Exportar el tipo `AuthErrorCode` desde aquí
- [ ] T013 [P] Pruebas `src/lib/errors.test.ts`: un caso por cada fila de la tabla de `research.md` §R3, más un objeto desconocido y `null`
- [ ] T014 [P] Crear los componentes base en `src/components/ui/`:
  - `Button.tsx`: variantes `primary` (verde), `secondary` (borde), `accent` (azul), `danger` (rojo), `ghost`; prop `loading`, que muestra un spinner y deshabilita.
  - `TextField.tsx`: `label`, asterisco rojo si `required`, ícono izquierdo opcional, `error` con ícono y `aria-describedby`, `hint`, borde rojo si hay error; hecho con `forwardRef` para react-hook-form.
  - `PasswordField.tsx`: extiende `TextField`, botón ojo con `aria-label` "Mostrar contraseña"/"Ocultar contraseña".
  - `Alert.tsx`: variantes `error`, `info` y `success`, con `role="alert"` para error y `role="status"` para las demás.
  - `Spinner.tsx`: prop `fullScreen`.
  - `Card.tsx`.
  - `Modal.tsx`: overlay, `role="dialog"`, `aria-modal`, `aria-labelledby`, trampa de foco, cierre con Esc y clic fuera, devuelve el foco al disparador.
- [ ] T015 [P] Crear los layouts en `src/components/layout/`:
  - `Logo.tsx`: SVG de pin + carro; texto "Meda" en `navy-900` y "Park" en `brand-600`; prop `size`.
  - `AuthLayout.tsx`: columna izquierda con logo, el lema "Parqueaderos más inteligentes para ciudades más conectadas" y una ilustración simple; columna derecha con la tarjeta y `<Outlet/>`. En menos de 768 px solo se muestra la tarjeta con el logo arriba.
  - `AdminLayout.tsx`: `AdminHeader` arriba, `AdminSidebar` a la izquierda (fondo `navy-800`; en móvil, un menú desplegable con botón hamburguesa) y el contenido con `<Outlet/>` sobre fondo `canvas`.
  - `AdminHeader.tsx`: logo a la izquierda; a la derecha el correo del usuario de `useAuth()` y el botón "Cerrar sesión", que en esta fase solo invoca la prop `onLogoutClick`.
  - `AdminSidebar.tsx`: ítems definidos en un arreglo exportado `adminNavItems` con `{ to: '/admin', label: 'Mi parqueadero', icon: Car }` y el estilo activo de `NavLink` (fondo `brand-600`). La 002 agrega ítems.
  - `PublicLayout.tsx`: header con el logo y el enlace "Acceso administradores" → `/admin/login`, y `<Outlet/>`.
- [ ] T016 [P] Crear `src/features/auth/authStage.ts` con el tipo `AuthStage` y `resolveAuthStage()` según `data-model.md` y `contracts/auth-service.md`
- [ ] T017 [P] Pruebas `src/features/auth/authStage.test.ts`: las 4 filas de la tabla de `research.md` §R6, más `aal2` con 0 factores (→ `autenticado`) y `aal1` con 2 factores (→ `requiere_verificacion`)
- [ ] T018 Crear `src/features/auth/authService.ts` con todas las funciones de `contracts/auth-service.md`: `signInWithPassword` (`trim` y `toLowerCase` del email), `getAuthSnapshot` (`getUser` + `mfa.getAuthenticatorAssuranceLevel` + `mfa.listFactors`, filtrando `factor_type === 'totp' && status === 'verified'` en `all`), `startTotpEnrollment` (unenroll de los `unverified` y luego `enroll({ factorType: 'totp', friendlyName: 'MedaPark', issuer: 'MedaPark' })`), `createChallenge`, `verifyCode` y `signOut` (`scope: 'local'`, que ignora errores de red). Todas devuelven `Result<T>` usando `toAuthErrorCode`/`toUserMessage`
- [ ] T019 [P] Pruebas `src/features/auth/authService.test.ts` con `vi.mock('../../lib/supabase')`: login OK; `invalid_credentials` → `credenciales_invalidas` con el mensaje literal; `startTotpEnrollment` elimina 2 factores unverified antes de enrolar; `verifyCode` mapea `mfa_verification_failed` y `mfa_challenge_expired`; `signOut` no lanza aunque el cliente falle
- [ ] T020 Crear `src/features/auth/AuthProvider.tsx` y `src/features/auth/useAuth.ts`: el estado `{ stage, user }` se inicializa en `cargando`; al montar ejecuta `getAuthSnapshot()` y `resolveAuthStage()`; se suscribe a `supabase.auth.onAuthStateChange` y recalcula ante `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `MFA_CHALLENGE_VERIFIED` y `USER_UPDATED` (diferir la llamada con `setTimeout(…, 0)` para no hacer `await` dentro del callback, como recomienda supabase-js); expone `refresh(): Promise<AuthStage>` y `signOut()` (llama a `authService.signOut()`, `resetFailures(user.id)` y fija `anonimo`). Exportar también `AuthContext` para poder simularlo en pruebas
- [ ] T021 Crear los guards en `src/app/guards/` (`RequireAal2.tsx`, `RequirePendingMfa.tsx` con la prop `expected: 'requiere_enrolamiento' | 'requiere_verificacion'`, y `RedirectIfAuthenticated.tsx`) según la matriz de `contracts/routes.md`; con `cargando` muestran `<Spinner fullScreen/>`; redirecciones con `<Navigate replace/>`
- [ ] T022 Crear `src/app/router.tsx` (`createBrowserRouter`) con las rutas de `contracts/routes.md`; `src/app/App.tsx` (`<AuthProvider><RouterProvider router={router}/></AuthProvider>`); `src/main.tsx` (StrictMode, importa `./styles/index.css`); y los placeholders `src/pages/public/HomePage.tsx` ("Mapa de parqueaderos, próximamente"), `src/pages/admin/PanelPage.tsx` (saludo "Bienvenido, <correo>" y tarjeta vacía) y `src/pages/NotFoundPage.tsx` ("Página no encontrada" con enlace "Ir al inicio": `/admin` si la ruta empieza con `/admin`, `/` en otro caso)
- [ ] T023 [P] Pruebas `src/app/guards/guards.test.tsx`: renderizar las rutas con `createMemoryRouter` y un `AuthContext.Provider` simulado; un caso por **cada celda** de la matriz de acceso de `contracts/routes.md` (5 rutas × 4 stages) y el caso `cargando` → spinner
- [ ] T024 Crear la migración `supabase/migrations/20261017000100_auth_helpers.sql` con el contenido **exacto** de `contracts/sql-helpers.md` (extensión pgtap y `public.es_sesion_aal2()`)
- [ ] T025 [P] Crear `supabase/tests/001_auth_helpers.test.sql` con el esqueleto de `contracts/sql-helpers.md` (5 pruebas)
- [ ] T026 Aplicar y verificar: `npx supabase db push` y `npx supabase test db --linked` en verde (requiere el proyecto enlazado, ver `quickstart.md` §1)

**Checkpoint**: `npm run dev` muestra `/` con "Acceso administradores"; `/admin` redirige a `/admin/login`; `npm test` y `npm run db:test` en verde.

---

## Phase 3: User Story 1 - Iniciar sesión con correo y contraseña (Priority: P1) 🎯 MVP

**Goal**: el administrador ingresa con sus credenciales y pasa al segundo factor (HU1).

**Independent Test**: `quickstart.md` §US1 (pasos 1 a 6).

### Tests for User Story 1

- [ ] T027 [P] [US1] Pruebas `src/features/auth/schemas.test.ts` (`loginSchema`): vacío → "El correo electrónico es obligatorio." y "La contraseña es obligatoria."; `admin@dominio` y `admin.com` → "Verificar correo electrónico"; `  Admin@MedaPark.test  ` es válido tras `trim`; la contraseña con espacios no se recorta
- [ ] T028 [P] [US1] Pruebas `src/features/auth/pages/LoginPage.test.tsx` (mock de `authService` y de `useAuth`): enviar vacío muestra los errores por campo y "Debe completar los campos requeridos" sin llamar a `signInWithPassword`; formato inválido muestra "Verificar correo electrónico"; las credenciales inválidas muestran el mensaje literal y limpian la contraseña; durante la petición el botón "Ingresar" está deshabilitado (un doble clic produce una sola llamada); el toggle de contraseña cambia `type`; `location.state.notice` se muestra en un `Alert`; no existen textos "Registrarse" ni "Olvidaste"

### Implementation for User Story 1

- [ ] T029 [US1] Crear `loginSchema` en `src/features/auth/schemas.ts` según `data-model.md` §Validaciones
- [ ] T030 [US1] Crear `src/features/auth/pages/LoginPage.tsx` (fiel a `HU01-iniciar-sesion.jpg` y al mock): título "Iniciar sesión"; `TextField` de correo con ícono Mail y placeholder `usuario@dominio`; `PasswordField` con ícono Lock y placeholder `Ingresa tu contraseña`; botón primario "Ingresar" a todo el ancho; `useForm({ resolver: zodResolver(loginSchema), mode: 'onTouched' })`; el resumen "Debe completar los campos requeridos" aparece si al enviar hay algún campo vacío; los errores del servidor van en un `Alert` bajo el botón. Muestra `location.state.notice` si existe
- [ ] T031 [US1] En `LoginPage.tsx`, tras `signInWithPassword` OK: `const stage = await refresh()` y navegar con `replace` a `/admin/mfa/configurar` o `/admin/mfa/verificar` según el stage; si hay error: `setValue('password', '')` y mostrar el mensaje

**Checkpoint**: US1 funciona por sí sola: credenciales válidas llevan a la pantalla MFA correspondiente.

---

## Phase 4: User Story 2 - Verificar identidad con segundo factor (Priority: P1)

**Goal**: enrolamiento TOTP la primera vez y verificación en cada ingreso, con límite de intentos (HU2).

**Independent Test**: `quickstart.md` §US2-A y §US2-B.

### Tests for User Story 2

- [ ] T032 [P] [US2] Pruebas `src/features/auth/mfaAttempts.test.ts`: incrementa por usuario; aísla usuarios distintos; `resetFailures` borra; `MAX_MFA_ATTEMPTS === 5`
- [ ] T033 [P] [US2] Pruebas `src/features/auth/components/OtpInput.test.tsx`: ignora letras; limita a 6; acepta pegar `"123456"` y `" 12 34 56 "` (normaliza); expone `aria-label="Código de verificación"`; `onComplete` se llama al llegar a 6 dígitos
- [ ] T034 [P] [US2] Pruebas `src/features/auth/pages/MfaVerifyPage.test.tsx` (mock de `authService`): al montar crea el challenge; un código incorrecto muestra "El código de verificación es incorrecto", limpia el campo y suma un fallo; `codigo_expirado` muestra "El código de verificación ha expirado. Solicita uno nuevo.", crea un challenge nuevo y **no** suma un fallo; el 5.º fallo llama a `signOut` y navega a `/admin/login` con `state.notice = MSG.mfa.demasiadosIntentos`; "Volver al inicio de sesión" llama a `signOut` y navega; un código correcto llama a `refresh` y navega a `/admin`; "Verificar código" está deshabilitado con menos de 6 dígitos; se muestra el texto "Abre tu app autenticadora para ver un código nuevo" y **no** existe "Reenviar código"
- [ ] T035 [P] [US2] Pruebas `src/features/auth/pages/MfaEnrollPage.test.tsx`: en StrictMode se llama a `startTotpEnrollment` **una sola vez**; se renderizan el `<img>` del QR con `alt="Código QR para tu app autenticadora"` y el secreto; un código incorrecto muestra el mensaje; un código correcto ejecuta `createChallenge` + `verifyCode`, luego `refresh` y navega a `/admin`; "Volver al inicio de sesión" llama a `signOut`

### Implementation for User Story 2

- [ ] T036 [P] [US2] Crear `src/features/auth/mfaAttempts.ts` según `contracts/auth-service.md` (clave `medapark:mfa-fallos:<userId>` en `sessionStorage`, envuelto en try/catch)
- [ ] T037 [P] [US2] Agregar `otpSchema` a `src/features/auth/schemas.ts` y crear `src/features/auth/components/OtpInput.tsx`: un `<input>` con `inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength={6}` y `pattern="\d{6}"`, presentado como 6 casillas (caracteres con `letter-spacing` o `div`s superpuestos); controlado (`value`, `onChange`, `onComplete`)
- [ ] T038 [P] [US2] Crear `src/features/auth/components/AuthSteps.tsx`: indicador "✓ Credenciales verificadas → 2 Verificación MFA" (como en `HU02-verificar-mfa.jpg`), que se muestra en la columna izquierda de `AuthLayout` en las pantallas MFA
- [ ] T039 [US2] Crear `src/features/auth/pages/MfaVerifyPage.tsx` (fiel a `HU02-verificar-mfa.jpg`, adaptado): ícono de escudo o candado; título "Verificación en dos pasos"; subtítulo "Ingresa el código de 6 dígitos de tu app autenticadora."; caja con el correo del usuario; `OtpInput` con label "Código de verificación *"; botón primario "Verificar código" (deshabilitado si hay menos de 6 dígitos o si está en carga); texto de ayuda `MSG.mfa.ayudaCodigoNuevo`; botón secundario "← Volver al inicio de sesión". Lógica: `getAuthSnapshot()` para obtener `verifiedTotpFactorId`, `createChallenge` al montar (protegido con `useRef` contra StrictMode) y al recibir `codigo_expirado`; `verifyCode`; manejo de fallos con `mfaAttempts` (al 5.º: `signOut()` y `navigate('/admin/login', { replace: true, state: { notice: MSG.mfa.demasiadosIntentos } })`); éxito: `resetFailures`, `await refresh()` y `navigate('/admin', { replace: true })`; `factor_no_encontrado`: `signOut()` y navegar a login con `notice = MSG.general.red`
- [ ] T040 [US2] Crear `src/features/auth/pages/MfaEnrollPage.tsx`: título "Configurar verificación en dos pasos"; los 3 pasos de `contracts/auth-service.md` (§Textos de UI); `<img src={qrCodeSvg} alt="Código QR para tu app autenticadora" width={200} height={200}>`; la clave manual con el botón "Copiar" (`navigator.clipboard.writeText`, que muestra "Copiada"); `OtpInput`, "Verificar código" y "Volver al inicio de sesión". Lógica: `startTotpEnrollment()` una sola vez (`useRef`); al verificar: `createChallenge(factorId)` y luego `verifyCode`; éxito: `await refresh()` y `/admin`; error: mensaje (sin contador de intentos en el enrolamiento, ya que el factor aún no es válido); si `startTotpEnrollment` falla, `Alert` con el mensaje y el botón "Reintentar"
- [ ] T041 [US2] Registrar las rutas `/admin/mfa/configurar` y `/admin/mfa/verificar` en `src/app/router.tsx` con `RequirePendingMfa` y `AuthLayout` (si quedaron como placeholder en T022)

**Checkpoint**: US1 + US2 dan acceso completo (aal2) al panel placeholder.

---

## Phase 5: User Story 3 - Cerrar sesión y proteger el área administrativa (Priority: P2)

**Goal**: cierre de sesión con confirmación y redirección ante una sesión inválida (HU8).

**Independent Test**: `quickstart.md` §US3.

### Tests for User Story 3

- [ ] T042 [P] [US3] Pruebas `src/features/auth/components/LogoutDialog.test.tsx`: abre con el título "Cerrar sesión" y el texto `MSG.logout.pregunta`; "Cancelar", Esc y clic fuera cierran sin llamar a `signOut`; "Cerrar sesión" llama a `signOut` y navega a `/admin/login`; el foco inicial está en "Cancelar"; durante el cierre el botón muestra carga
- [ ] T043 [P] [US3] Pruebas `src/components/layout/AdminHeader.test.tsx`: muestra el correo del usuario y "Cerrar sesión"; al pulsarlo abre el diálogo
- [ ] T044 [P] [US3] Pruebas `src/features/auth/AuthProvider.test.tsx` (mock de `supabase.auth.onAuthStateChange`): el evento `SIGNED_OUT` lleva el stage a `anonimo`; `MFA_CHALLENGE_VERIFIED` lleva a `autenticado` (con un snapshot simulado `aal2`); si `getUser` falla con `session_not_found` al iniciar, el stage es `anonimo` y se limpia la sesión local

### Implementation for User Story 3

- [ ] T045 [US3] Crear `src/features/auth/components/LogoutDialog.tsx` (fiel a `HU08-cerrar-sesion.jpg`): `Modal` con ícono LogOut en un círculo `danger-50`, título `MSG.logout.titulo`, `MSG.logout.pregunta`, `MSG.logout.detalle` y los botones "Cancelar" (secundario) y "Cerrar sesión" (`danger`). Al confirmar: `await signOut()` de `useAuth` y `navigate('/admin/login', { replace: true })`
- [ ] T046 [US3] Integrar `LogoutDialog` en `AdminLayout.tsx` (estado `open`) conectado a `AdminHeader.onLogoutClick`
- [ ] T047 [US3] Manejo de sesión inválida en `src/features/auth/AuthProvider.tsx`: exportar `handleSessionError(error)`, que, si `toAuthErrorCode(error) === 'sesion_invalida'`, ejecuta `signOut()` (el guard redirige). Documentar en un comentario JSDoc que las features 002 y 003 deben llamarlo en sus `catch` de acceso a datos
- [ ] T048 [US3] Verificar que `NotFoundPage` funciona dentro de `AdminLayout` para `/admin/*` (ruta comodín en `router.tsx`) y fuera de él para `*`

**Checkpoint**: las tres stories funcionan de forma independiente; la matriz de acceso de `contracts/routes.md` se cumple.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T049 [P] Revisión responsive a 360 px, 768 px y 1280 px de Login, MFA (ambas) y el layout admin con el modal; corregir desbordes en `src/components/layout/*` y en las páginas
- [ ] T050 [P] Revisión de accesibilidad: navegación completa con teclado (Tab y Shift+Tab) en Login → MFA → panel → modal; foco visible (`focus-visible:ring-2 ring-accent-600`); contraste AA de los textos `ink-500` sobre blanco
- [ ] T051 [P] Actualizar `README.md` con la sección "Desarrollo" (prerrequisitos, `.env.local`, comandos npm y Supabase) y el enlace a `specs/001-autenticacion-admin/quickstart.md`
- [ ] T052 Ejecutar `npm run lint`, `npm run typecheck`, `npm test` y `npm run db:test`, y corregir hasta tener todo en verde
- [ ] T053 Ejecutar la validación manual completa de `specs/001-autenticacion-admin/quickstart.md` y anotar los resultados en `specs/001-autenticacion-admin/checklists/validacion-manual.md` (fecha y pasos OK o fallidos)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)**: sin dependencias. T009 (mocks) puede hacerse en paralelo en otra sesión, pero debe terminar antes de T030, T039, T040 y T045.
- **Foundational (2)**: depende de Setup. Bloquea todas las stories. T026 requiere el proyecto Supabase creado y enlazado.
- **US1 (3)**: depende de Foundational.
- **US2 (4)**: depende de Foundational. Para la prueba manual end-to-end necesita US1 (llegar al estado aal1), pero sus pruebas automatizadas son independientes (mocks).
- **US3 (5)**: depende de Foundational. Para probarla de forma manual necesita US1 + US2 (sesión aal2).
- **Polish (6)**: al final.

### Within Each User Story

- Pruebas [P] primero (deben fallar), luego la implementación, y las pruebas en verde antes del checkpoint.
- `schemas` / `mfaAttempts` / `OtpInput` → páginas → rutas.

### Parallel Opportunities

- Setup: T003, T004, T005, T006 y T007 en paralelo tras T002.
- Foundational: T011–T017 en paralelo; T018 tras T012; T020 tras T016 y T018; T021 tras T020; T023, T024 y T025 en paralelo.
- US1: T027 ∥ T028; US2: T032 ∥ T033 ∥ T034 ∥ T035 y T036 ∥ T037 ∥ T038; US3: T042 ∥ T043 ∥ T044.

---

## Parallel Example: User Story 2

```bash
Task: "T032 Pruebas mfaAttempts en src/features/auth/mfaAttempts.test.ts"
Task: "T033 Pruebas OtpInput en src/features/auth/components/OtpInput.test.tsx"
Task: "T036 Implementar src/features/auth/mfaAttempts.ts"
Task: "T037 Implementar OtpInput en src/features/auth/components/OtpInput.tsx"
Task: "T038 Implementar AuthSteps en src/features/auth/components/AuthSteps.tsx"
```

---

## Implementation Strategy

### MVP First

1. Phase 1 + Phase 2 (incluye el proyecto Supabase enlazado).
2. US1 → validar el login → US2 → validar el acceso aal2 completo. **Este es el MVP de la feature** (las HU1 y HU2 juntas dan acceso seguro).
3. US3 → cierre de sesión y protección.
4. Polish → merge a `main`.

### Notas

- Commit por tarea o grupo lógico: `feat(001): T030 pantalla de inicio de sesión`.
- No implementar nada de las features 002 y 003 (el panel y el mapa son placeholders).
- Ante cualquier duda de texto, `contracts/auth-service.md` §Catálogo de mensajes es la referencia.
