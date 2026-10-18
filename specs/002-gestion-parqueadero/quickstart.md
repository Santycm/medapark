# Quickstart: Gestión del Parqueadero (002)

## 0. Prerrequisitos

- Feature 001 implementada y validada.
- Dos administradores con MFA enrolado: `admin1` (**sin** parqueadero) y `admin2` (sin parqueadero), creados
  por el equipo del back.
- **Back**: sin cambios. La solicitud **CB-001** (permisos INSERT/UPDATE) resultó no requerida: US1, US4 y US5 funcionan con los permisos actuales. Si alguna operación mostrara "No tienes permisos para realizar esta acción. Contacta al administrador del sistema.", validar también ese caso.
- Ningún cambio en la BD se hace sin una solicitud CB-NNN autorizada (`docs/cambios-back/`).

## 1. Verificación automatizada

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 2. Validación manual por user story

### US1: Registrar (HU3) con `admin1`

| # | Paso | Esperado |
|---|------|----------|
| 1 | Login completo | Panel "Aún no has registrado tu parqueadero"; el menú solo muestra "Mi parqueadero" |
| 2 | "Registrar parqueadero" → "Guardar" vacío | "Debe completar los campos obligatorios" y los campos en rojo |
| 3 | Teléfono `300-123` | "Solo se permiten caracteres numéricos." |
| 4 | Correo `contacto@dominio` | "Debe tener un formato de correo electrónico válido." |
| 5 | Latitud `95` / longitud `-181` | Mensajes de rango |
| 6 | Latitud `4.7110`, longitud `-74.0721` | Aviso "La ubicación está fuera de Medellín…" (no bloquea) |
| 7 | Clic en el mapa cerca del Parque Berrío | Latitud y longitud se llenan (≈ 6.2518, −75.5680) |
| 8 | Marcar Automóviles con capacidad `0` | "Ingresa un valor entero entre 1 y 9.999." |
| 9 | Datos válidos: Automóviles $5000 / 2 celdas, Motocicletas $2000 / 1 celda → "Guardar" | "Parqueadero registrado exitosamente"; el panel muestra "Activo", "Automóviles: 2 disponibles / 2" y "Motocicletas: 1 disponibles / 1" |
| 10 | Abrir `/admin/parqueadero/registrar` | Redirige a `/admin` |
| 11 | (Si el back aún no concede permisos) "Guardar" | "No tienes permisos para realizar esta acción…" |

### US2: Panel (HU4)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Panel de `admin1` | Datos en modo lectura, "$ 5.000" y "$ 2.000", y los accesos |
| 2 | Login con `admin2` | Solo "Registrar parqueadero"; nada de `admin1` |

### US3: Ocupación (HU7) con `admin1`

| # | Paso | Esperado |
|---|------|----------|
| 1 | "Gestionar ocupación" | Automóviles 2/0/2 y Motocicletas 1/0/1 (capacidad/ocupadas/disponibles) |
| 2 | Ingreso de Automóvil × 2 | Ocupadas 2, disponibles 0; botón deshabilitado + "No hay celdas disponibles de este tipo" |
| 3 | Salida de Motocicleta | Deshabilitada + "No hay celdas ocupadas de este tipo para liberar" |
| 4 | Salida de Automóvil × 1 | Ocupadas 1, disponibles 1 |
| 5 | Dos pestañas con 1 disponible: ingreso en ambas | Una funciona; la otra muestra "No hay celdas disponibles de este tipo" y recarga los conteos |

### US4: Editar (HU5) con `admin1`

| # | Paso | Esperado |
|---|------|----------|
| 1 | "Editar información" | Formulario precargado + "Estado del parqueadero" |
| 2 | Desmarcar Automóviles (capacidad 2) | Advertencia "Debe reducir a cero las celdas…" y sigue marcado |
| 3 | Capacidad de Automóviles `0` → "Guardar cambios" (con 1 ocupada) | "No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas"; no se guarda nada |
| 4 | Capacidad de Motocicletas `0` → "Guardar cambios" | "Información actualizada exitosamente" |
| 5 | Editar → desmarcar Motocicletas (ahora en 0), cambiar el horario y el estado a Inactivo → guardar | Éxito; el panel muestra "Inactivo" y su aviso; no aparece Motocicletas |
| 6 | Editar → cambiar el nombre → "Cancelar" | Sin cambios |
| 7 | Volver a Activo | El aviso desaparece |

### US5: Configurar celdas (HU6) con `admin1`

| # | Paso | Esperado |
|---|------|----------|
| 1 | "Configurar celdas" | Solo Automóviles, valor 2, "Ocupadas actualmente: 1" |
| 2 | "−" hasta 0 → "Guardar cambios" | "No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas" |
| 3 | Fijar 20 → guardar | "Celdas actualizadas exitosamente"; el panel muestra "Automóviles: 19 disponibles / 20" |

### Aislamiento (lo garantiza el back; solo se comprueba)

Con `admin2` (aal2), en la consola del navegador (`window.__supabase` solo existe en DEV):

```js
await window.__supabase.from('parking_lots').select('*')   // → [] (no ve el de admin1)
```

> La visibilidad en el mapa público (US1-11, US4-8 y SC-006) se valida en la feature 003.
