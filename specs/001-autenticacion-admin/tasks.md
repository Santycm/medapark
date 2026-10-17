---
description: "Task list for 001-autenticacion-admin (sobre el repo existente Santycm/medapark)"
---

# Tasks: Autenticación del Administrador de Parqueadero

**Input**: Design documents from `specs/001-autenticacion-admin/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (routes, auth-service), quickstart.md; `docs/supabase-esquema-actual.md`

**Tests**: OBLIGATORIAS (constitución, Principio IV): Vitest con Supabase simulado. **Nunca** contra el Supabase remoto.

**⚠️ Reglas**: no modificar Supabase (ni SQL, ni migraciones, ni configuración); no eliminar las pantallas existentes fuera del MVP; no hacer push a `main`.

**Organization**: US1 = HU1, US2 = HU2, US3 = HU8.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup y migración a TypeScript (sin cambios de comportamiento)

**Purpose**: dejar el código existente en TS, con tooling de pruebas, comportándose exactamente igual. Al terminar esta fase se hace un commit propio.

- [ ] T001 Crear la rama `feature/001-autenticacion-admin` desde `develop` y fijar `.specify/feature.json` en `{"feature_directory": "specs/001-autenticacion-admin"}`
- [ ] T002 Instalar las dependencias de TypeScript y tipos (`typescript`, `@types/leaflet`) y crear `tsconfig.json` (references), `tsconfig.app.json` (`strict`, `jsx: react-jsx`, `moduleResolution: bundler`, `types: ["vite/client", "vitest/globals"]`, `include: ["src"]`), `tsconfig.node.json` (para `vite.config.ts`) y `src/vite-env.d.ts` (tipos de `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`). Revisar `package.json` para escoger versiones compatibles con React 19 y Vite 8
- [ ] T003 [P] Renombrar `vite.config.js` → `vite.config.ts` (mismos plugins)
- [ ] T004 [P] Crear `src/lib/env.ts` (lee y valida que existan las 2 variables, con un error claro en español) y `.env.example`; migrar `src/lib/supabase.js` → `src/lib/supabase.ts` usando `env.ts` y `createClient<Database>(...)`; si `import.meta.env.DEV`, asignar `window.__supabase = supabase` (declarado en `vite-env.d.ts`) para la validación manual
- [ ] T005 Generar `src/lib/database.types.ts` con `npx supabase gen types typescript --project-id msmfidnqmqntxbcucnsf` (**solo lectura**; requiere `npx supabase login`) y versionarlo
- [ ] T006 Migrar `src/services/auth.js` → `src/services/auth.ts` y `src/services/parkings.js` → `src/services/parkings.ts`: mismas funciones, misma firma y mismo comportamiento, solo con tipos (`User`, `Session`, `Factor` de supabase-js; `Tables<'public_parking_lots'>`)
- [ ] T007 [P] Migrar `src/components/**/*.jsx` → `.tsx` (auth/*, common/Loader, map/ParkingMap, map/ParkingMarker) tipando las props
- [ ] T008 [P] Migrar `src/pages/**/*.jsx` → `.tsx` (auth/*, app/Profile, public/Home, public/ParkingDetail) tipando estado y eventos
- [ ] T009 Migrar `src/router/index.jsx`, `src/App.jsx` y `src/main.jsx` → `.tsx`; actualizar `index.html` (`/src/main.tsx`, `lang="es"`)
- [ ] T010 [P] Actualizar `eslint.config.js` a `typescript-eslint` (archivos `**/*.{ts,tsx}`) + `react-hooks` + `react-refresh` + `jsx-a11y` recomendado; agregar `.prettierrc` (`singleQuote: true`, `semi: true`, `printWidth: 100`) y `.prettierignore`
- [ ] T011 [P] Configurar Vitest en `vite.config.ts` (`test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'], css: false }`) e instalar `vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`; crear `src/test/setup.ts` (jest-dom, `cleanup`, limpieza de `sessionStorage`) y una prueba humo `src/lib/env.test.ts`
- [ ] T012 Agregar los scripts en `package.json`: `typecheck` (`tsc -b --noEmit`), `test` (`vitest run`), `test:watch`, `format` y `gen:types` (comando de T005); `build` = `tsc -b && vite build`
- [ ] T013 Validar la Fase 1: `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde, y ejecutar `quickstart.md` §3 (la app se comporta igual). Commit `refactor(001): migra el proyecto a TypeScript`
- [ ] T014 [P] **Mocks (Pencil MCP, en otra sesión)**: en `design/medapark.pen`, las pantallas *Login* (base `docs/prototipos/HU01-iniciar-sesion.jpg`, logo `public/img/logo.svg`), *MFA – Configurar* (nueva: QR + clave + código, estilo de HU02), *MFA – Verificar* (base `HU02-verificar-mfa.jpg`, **sin** "Reenviar código", con "Abre tu app autenticadora…" y sin "Administrador/Cerrar sesión"), *Layout admin + modal de cierre de sesión* (base `HU08-cerrar-sesion.jpg`, menú solo "Mi parqueadero") y *Página no encontrada*. Tokens de `research.md` §R10. Requisito previo de T030, T040, T041 y T047

---

## Phase 2: Foundational (bloquea las stories)

- [ ] T015 Reemplazar `src/index.css`: conservar `@import "tailwindcss";` y `@import 'leaflet/dist/leaflet.css';`, cambiar la fuente a Inter (Google Fonts 400/500/600/700) y agregar `@theme` con los tokens de `research.md` §R10
- [ ] T016 [P] Crear `src/lib/messages.ts` (`MSG` exacto de `contracts/auth-service.md`) y `src/lib/result.ts`
- [ ] T017 [P] Crear `src/lib/errors.ts` (`toAuthErrorCode`, `toUserMessage`, `isSessionError`, según `research.md` §R3, incluido `42501` → `permiso_denegado`) y `src/lib/errors.test.ts` (una fila por caso de la tabla, más un desconocido y `null`)
- [ ] T018 [P] Crear el kit de UI en `src/components/common/`: `Button.tsx` (variantes `primary`, `secondary`, `accent`, `danger` y `ghost`; `loading`), `TextField.tsx` (label, asterisco, ícono, `error` con `aria-describedby`, `hint`, `forwardRef`), `PasswordField.tsx` (ojo con `aria-label`), `Alert.tsx` (error, info, success y warning; `role` correcto), `Modal.tsx` (trampa de foco, Esc, clic fuera, devuelve el foco), `Card.tsx` y `Logo.tsx` (usa `/img/logo.svg`; variante ícono `/img/icon.svg`). `Loader.tsx` (existente) acepta la prop `fullScreen`
- [ ] T019 [P] Crear los layouts en `src/components/layout/`: `AuthLayout.tsx` (columna de marca con logo, el lema "Parqueaderos más inteligentes para ciudades más conectadas" e ilustración simple + tarjeta con `<Outlet/>`; en móvil solo la tarjeta), `AdminLayout.tsx` (header + sidebar `navy-800` + `<Outlet/>`; menú hamburguesa en móvil), `AdminHeader.tsx` (logo, correo de `useAuth`, botón "Cerrar sesión" → `onLogoutClick`), `AdminSidebar.tsx` (arreglo exportado `adminNavItems` = [{ to: '/admin', label: 'Mi parqueadero' }]) y `PublicLayout.tsx` (logo + "Acceso administradores" → `/admin/login`)
- [ ] T020 [P] Crear `src/domain/authStage.ts` y `src/domain/authStage.test.ts` (las 4 filas de `research.md` §R6, más aal2 con 0 factores y aal1 con 2)
- [ ] T021 Agregar a `src/services/auth.ts` las funciones nuevas de `contracts/auth-service.md` (`signInAdmin`, `getAuthSnapshot`, `startTotpEnrollment`, `createChallenge`, `verifyCode` y `signOutLocal`), **reutilizando** las existentes y sin modificarlas
- [ ] T022 [P] Pruebas `src/services/auth.test.ts` (mock de `../lib/supabase`): `signInAdmin` con `invalid_credentials` → mensaje literal; `startTotpEnrollment` elimina 2 factores `unverified` antes de `enrollMfa`; `verifyCode` distingue `mfa_verification_failed` y `mfa_challenge_expired`; `signOutLocal` usa `scope: 'local'` y no lanza; las funciones existentes conservan su comportamiento (`login` lanza el error)
- [ ] T023 Crear `src/context/AuthProvider.tsx` y `src/hooks/useAuth.ts` (`research.md` §R6 y §R8; exportar `AuthContext` y `handleSessionError`) y envolver la app en `src/App.tsx`
- [ ] T024 Crear los guards en `src/router/guards/` (`RequireAal2`, `RequirePendingMfa`, `RedirectIfAuthenticated`) según `contracts/routes.md`
- [ ] T025 Reescribir `src/router/index.tsx` según `contracts/routes.md`: rutas del MVP, redirecciones `/login` y `/verify-mfa`, rutas latentes (con `/profile` y `/setup-mfa` bajo `RequireAal2`), `pages/app/Panel.tsx` (placeholder "Bienvenido, <correo>"), `pages/NotFound.tsx` y comodines. En `pages/public/Home.tsx`, cambiar el botón "Administración" por "Acceso administradores" → `/admin/login`
- [ ] T026 [P] Pruebas `src/router/guards/guards.test.tsx`: cada celda de la matriz de acceso de `contracts/routes.md`, el estado `cargando` y las redirecciones `/login` y `/verify-mfa`

**Checkpoint**: `/admin` sin sesión → `/admin/login`; las pantallas latentes siguen abriendo por URL; pruebas en verde.

---

## Phase 3: User Story 1 - Iniciar sesión (P1) 🎯 MVP · HU1

**Independent Test**: `quickstart.md` §US1.

- [ ] T027 [P] [US1] Pruebas `src/domain/schemas/auth.test.ts` (`loginSchema`): vacíos → mensajes por campo; `admin@dominio` y `admin.com` → "Verificar correo electrónico"; `  Admin@X.co  ` es válido tras `trim`; la contraseña no se recorta
- [ ] T028 [P] [US1] Pruebas `src/pages/auth/Login.test.tsx` (mock de `services/auth` y `useAuth`): vacío → errores por campo + "Debe completar los campos requeridos" sin llamar a `signInAdmin`; formato inválido; credenciales inválidas → mensaje literal y contraseña limpia; botón deshabilitado durante la carga (doble clic = 1 llamada); toggle del ojo; `location.state.notice` visible; **no** existen "Registrarse" ni "¿Olvidaste tu contraseña?"
- [ ] T029 [US1] Crear `loginSchema` en `src/domain/schemas/auth.ts` (`data-model.md` §Validaciones)
- [ ] T030 [US1] Rediseñar `src/pages/auth/Login.tsx` (HU01 + mock) con `AuthLayout`, `TextField`/`PasswordField`, `Button` y react-hook-form (`mode: 'onTouched'`) usando `signInAdmin`. **Quitar** el enlace "¿Olvidaste tu contraseña?" (la ruta latente se conserva)
- [ ] T031 [US1] En `Login.tsx`, tras el éxito: `const stage = await refresh()` y navegar con `replace` a `/admin/mfa/configurar` o `/admin/mfa/verificar`; en error: limpiar la contraseña y mostrar el mensaje

---

## Phase 4: User Story 2 - Segundo factor obligatorio (P1) · HU2

**Independent Test**: `quickstart.md` §US2-A y §US2-B.

- [ ] T032 [P] [US2] Crear `src/domain/mfaAttempts.ts` y `mfaAttempts.test.ts` (por usuario; reset; `MAX_MFA_ATTEMPTS === 5`)
- [ ] T033 [P] [US2] Agregar `otpSchema` a `src/domain/schemas/auth.ts` y crear `src/components/auth/OtpInput.tsx` con `OtpInput.test.tsx` (solo dígitos, máximo 6, pegar `" 12 34 56 "`, `aria-label="Código de verificación"`, `onComplete`)
- [ ] T034 [P] [US2] Crear `src/components/auth/AuthSteps.tsx` ("✓ Credenciales verificadas → 2 Verificación MFA")
- [ ] T035 [P] [US2] Pruebas `src/pages/auth/VerifyMfa.test.tsx`: crea el challenge al montar; incorrecto → mensaje, limpia y suma un fallo; `codigo_expirado` → mensaje, nuevo challenge y sin sumar fallo; el 5.º fallo → `signOut` + `/admin/login` con `notice`; "Volver al inicio de sesión" → `signOut`; éxito → `refresh` + `/admin`; botón deshabilitado con menos de 6 dígitos; existe "Abre tu app autenticadora…" y **no** existe "Reenviar código"
- [ ] T036 [P] [US2] Pruebas `src/pages/auth/MfaEnroll.test.tsx`: en StrictMode llama a `startTotpEnrollment` **una vez**; el QR (`alt="Código QR para tu app autenticadora"`) y el secreto visibles; un código incorrecto muestra el mensaje; uno correcto → `createChallenge` + `verifyCode` + `refresh` + `/admin`; "Volver al inicio de sesión" → `signOut`
- [ ] T037 [US2] Rediseñar `src/pages/auth/VerifyMfa.tsx` (HU02 adaptado) con `AuthLayout`, `AuthSteps`, `OtpInput`, `Button` y la lógica de `plan.md` Design Notes 5 + `mfaAttempts`, usando las funciones `Result` de `services/auth`
- [ ] T038 [US2] Crear `src/pages/auth/MfaEnroll.tsx`: título, pasos y QR (`<img src={qrCodeSvg}>`), clave con "Copiar", `OtpInput`; `startTotpEnrollment()` una sola vez (`useRef`); verificación con `createChallenge` + `verifyCode` → `refresh` → `/admin`; botón "Reintentar" si falla el enrolamiento. Reutiliza la lógica de `SetupMfa.tsx` (que **no** se modifica)

**Checkpoint**: sin factor → enrolamiento obligatorio; con factor → verificación; ambos llevan al panel con aal2.

---

## Phase 5: User Story 3 - Cerrar sesión y proteger (P2) · HU8

**Independent Test**: `quickstart.md` §US3.

- [ ] T039 [P] [US3] Pruebas `src/components/auth/LogoutDialog.test.tsx` (título y texto; "Cancelar", Esc y clic fuera no cierran sesión; "Cerrar sesión" → `signOut` + `/admin/login`; foco inicial en "Cancelar")
- [ ] T040 [P] [US3] Pruebas `src/components/layout/AdminHeader.test.tsx` (correo + botón → abre el diálogo) y `src/context/AuthProvider.test.tsx` (`SIGNED_OUT` → `anonimo`; `MFA_CHALLENGE_VERIFIED` con snapshot aal2 → `autenticado`; `getCurrentUser` falla con `session_not_found` → `anonimo`)
- [ ] T041 [US3] Crear `src/components/auth/LogoutDialog.tsx` (HU08: ícono LogOut en `danger-50`, `MSG.logout.*`, "Cancelar" y "Cerrar sesión" `danger`) e integrarlo en `AdminLayout.tsx`
- [ ] T042 [US3] Verificar `NotFound` dentro de `AdminLayout` para `/admin/*` (enlace al panel) y fuera de él para `*` (enlace a `/`)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T043 [P] Prueba `src/router/latentRoutes.test.tsx`: renderizar Login, VerifyMfa, MfaEnroll, AdminLayout y PublicLayout y afirmar que no hay enlaces a `/forgot-password`, `/update-password`, `/profile` ni `/setup-mfa` (FR-032)
- [ ] T044 [P] Eliminar `src/components/auth/ProtectedRoute.tsx` si ya no tiene usos (`rg ProtectedRoute src`)
- [ ] T045 [P] Revisión responsive (360, 768 y 1280 px) y de accesibilidad (teclado Login → MFA → panel → modal, foco visible, contraste AA)
- [ ] T046 [P] Actualizar `README.md` (sección "Desarrollo": `.env`, scripts, Gitflow, regla de solo lectura de Supabase)
- [ ] T047 `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde
- [ ] T048 Validación manual completa de `quickstart.md` y resultados en `specs/001-autenticacion-admin/checklists/validacion-manual.md`
- [ ] T049 Abrir un PR `feature/001-autenticacion-admin` → `develop` (nunca a `main`)

---

## Dependencies & Execution Order

- **Phase 1** primero (la migración a TS es la base de todo; commit propio en T013). T014 (mocks) en paralelo, antes de T030, T037, T038 y T041.
- **Phase 2** depende de la Phase 1 y bloquea las stories. T021 → T023 → T024 → T025 → T026.
- **US1 → US2** para la prueba manual (US2 necesita la sesión aal1 de US1); las pruebas automatizadas son independientes.
- **US3** necesita US1 y US2 para la prueba manual.
- Paralelo: T003, T004, T007, T008, T010 y T011; T016–T020; T027 ∥ T028; T032–T036; T039 ∥ T040.

## Implementation Strategy

1. Phase 1 (migración a TS) → commit → validar que nada cambió.
2. Phase 2 → US1 → US2 (**MVP de la feature**: acceso seguro con MFA obligatorio) → US3.
3. Polish → PR a `develop`.
4. Commits: `feat(001): T037 verificación MFA rediseñada`.
