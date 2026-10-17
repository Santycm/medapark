# Quickstart: Gestión del Parqueadero (002)

## 0. Prerrequisitos

- La feature 001 implementada y validada. Dos administradores con MFA enrolado: `admin1@medapark.test` y
  `admin2@medapark.test`.
- Migración aplicada y tipos generados:

```bash
npx supabase db push
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

## 1. Verificación automatizada

```bash
npm run lint
npm run typecheck
npm test
npx supabase test db --linked     # 001_* y 002_* en verde
```

Opcional (concurrencia, SC-003). Requiere un admin de pruebas con parqueadero que atienda automóviles con
capacidad ≥ 50 y su secreto TOTP:

```bash
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... E2E_TOTP_SECRET=... npx vitest run tests/integration
```

## 2. Validación manual por user story

### US1: Registrar (HU3) con `admin1`

| # | Paso | Esperado |
|---|------|----------|
| 1 | Login completo | Panel con "Aún no has registrado tu parqueadero" y el botón "Registrar parqueadero"; el menú solo muestra "Mi parqueadero" |
| 2 | "Registrar parqueadero" → "Guardar" vacío | "Debe completar los campos obligatorios" y los campos en rojo |
| 3 | Teléfono `300-123` | "Solo se permiten caracteres numéricos." |
| 4 | Correo `contacto@dominio` | "Debe tener un formato de correo electrónico válido." |
| 5 | Latitud `95` / longitud `-181` | "Rango válido: -90 a 90." / "Rango válido: -180 a 180." |
| 6 | Latitud `4.7110`, longitud `-74.0721` | Aviso "La ubicación está fuera de Medellín. Verifica las coordenadas." (no bloquea) |
| 7 | Clic en el mapa cerca del Parque Berrío | Latitud y longitud se llenan (≈ 6.2518, −75.5680) |
| 8 | Marcar Automóviles → aparecen tarifa y capacidad; desmarcar → desaparecen | OK |
| 9 | Datos: "Parqueadero Centro", "Calle 50 # 45-10, Medellín", tel. `3001234567`, horario "Lunes a Domingo, 6:00 a.m. - 10:00 p.m.", Automóviles $5000 / 2 celdas, Motocicletas $2000 / 0 celdas → "Guardar" | "Parqueadero registrado exitosamente"; el panel muestra todo, el badge "Activo", "Automóviles: 2 disponibles / 2" y "Motocicletas: 0 disponibles / 0" |
| 10 | Abrir `/admin/parqueadero/registrar` por URL | Redirige a `/admin` |

### US2: Panel (HU4)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Revisar el panel de `admin1` | Datos en modo lectura, tarifas "$ 5.000" y "$ 2.000", y accesos a Editar, Gestionar ocupación y Configurar celdas |
| 2 | Login con `admin2` (sin parqueadero) | Ve solo "Registrar parqueadero"; nada de `admin1` |

### US3: Ocupación (HU7) con `admin1`

| # | Paso | Esperado |
|---|------|----------|
| 1 | "Gestionar ocupación" | Automóviles: capacidad 2, ocupadas 0, disponibles 2; Motocicletas: capacidad 0 |
| 2 | Ingreso de Automóvil × 2 | Ocupadas 2, disponibles 0; el botón se deshabilita y aparece "No hay celdas disponibles de este tipo" |
| 3 | Seleccionar Motocicleta en "Registrar salida" | Deshabilitado, con "No hay celdas ocupadas de este tipo para liberar" |
| 4 | Salida de Automóvil × 1 | Ocupadas 1, disponibles 1 |
| 5 | "Volver al panel" | "Automóviles: 1 disponibles / 2" |

### US4: Editar (HU5) con `admin1`

| # | Paso | Esperado |
|---|------|----------|
| 1 | "Editar información" | Formulario precargado más "Estado del parqueadero" |
| 2 | Desmarcar Automóviles (capacidad 2) | Advertencia "Debe reducir a cero las celdas de este tipo de vehículo antes de quitarlo de los tipos atendidos" y sigue marcado |
| 3 | Capacidad de Automóviles `0` → "Guardar cambios" (con 1 ocupada) | "No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas"; no se guarda nada |
| 4 | Desmarcar Motocicletas (capacidad 0), cambiar el horario y el estado a Inactivo → "Guardar cambios" | "Información actualizada exitosamente"; el panel muestra "Inactivo" y el aviso de inactivo; ya no aparece Motocicletas |
| 5 | Editar → cambiar el nombre → "Cancelar" | El nombre no cambia |
| 6 | Volver a Activo | Aviso desaparece |

### US5: Configurar celdas (HU6) con `admin1`

| # | Paso | Esperado |
|---|------|----------|
| 1 | "Configurar celdas" | Solo la tarjeta de Automóviles, el valor 2 y "Ocupadas actualmente: 1" |
| 2 | "−" hasta 0 → "Guardar cambios" | "No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas" |
| 3 | Fijar 20 → "Guardar cambios" | "Celdas actualizadas exitosamente"; el panel muestra "Automóviles: 19 disponibles / 20" |

### Aislamiento (FR-003, SC-004)

Con `admin2` autenticado (aal2), en la consola de desarrollo:

```js
await window.__supabase.from('parqueaderos').select('*')                     // → [] (no ve el de admin1)
await window.__supabase.from('parqueaderos').update({ nombre: 'X' }).neq('id', '') // → error de permisos
await window.__supabase.rpc('registrar_ingreso', { p_tipo: 'automovil' })        // → PARQUEADERO_NO_EXISTE
```

Con `admin1` en aal1 (después de la contraseña y antes del código): `select` → `[]`, y cualquier RPC devuelve
`NO_AUTENTICADO_AAL2`.

> La visibilidad en el mapa público (US1-11, US4-8, SC-006) se valida en la feature 003.
