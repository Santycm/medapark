# Análisis del MVP MedaPark (insumo del ciclo SDD)

**Fecha**: 2026-10-17
**Fuente**: `docs/historias-usuario/RQ02v2-historias-usuario-medapark.pdf` (v3, 06/10/2026) y prototipos en `docs/prototipos/`
**Alcance**: MVP para trabajo universitario. No es una app de producción.

Este documento consolida las decisiones tomadas en el análisis (wizard con el equipo) antes de escribir
las specs. Cualquier spec, plan o tarea que contradiga este documento debe actualizarse o justificar la
desviación.

---

## 1. Contexto

Aplicación web para la consulta pública de parqueaderos en Medellín y su gestión por parte de
administradores. Hay dos actores:

| Actor | Cuenta | Qué hace |
|-------|--------|----------|
| Usuario | No (anónimo) | Ve un mapa con los parqueaderos activos, consulta el detalle (horario, tarifas, disponibilidad) y genera la ruta en Google Maps. |
| Administrador de Parqueadero | Sí, la crea el equipo de desarrollo en Supabase | Inicia sesión con MFA, registra y edita su **único** parqueadero, configura celdas y registra ingresos y salidas. |

## 2. Mapa HU → Feature

| Feature (rama/spec) | Historias | Prioridad de entrega |
|---------------------|-----------|----------------------|
| `001-autenticacion-admin` | HU1 Iniciar sesión, HU2 MFA, HU8 Cerrar sesión | 1.ª (base del proyecto) |
| `002-gestion-parqueadero` | HU3 Registrar, HU4 Consultar mi parqueadero, HU5 Editar, HU6 Configurar celdas, HU7 Gestionar ocupación | 2.ª |
| `003-consulta-publica` | HU9 Mapa, HU10 Detalle, HU11 Cómo llegar | 3.ª |

Dependencias: 002 depende de 001 (sesión aal2). 003 depende del esquema de 002 (datos de parqueaderos).

## 3. Decisiones de stack (tomadas con el equipo)

| Tema | Decisión |
|------|----------|
| Frontend | Vite + React 18 + TypeScript (strict) + Tailwind CSS + React Router + React Hook Form + Zod |
| Backend | Supabase **en la nube** (plan free): Auth, PostgreSQL, RLS y RPC. Migraciones versionadas en `supabase/migrations` con la CLI de Supabase |
| MFA | **TOTP nativo de Supabase Auth** (app autenticadora). Ver §5 |
| Mapas | Leaflet + OpenStreetMap (`react-leaflet`), sin API key |
| Ruta | Enlace `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` (sin API de Google) |
| Pruebas | Vitest + Testing Library (validaciones, reglas de negocio y algunos componentes) y pgTAP para RLS/RPC |
| Despliegue | Netlify (opcional, al final). El código se versiona en `github.com/manuruizb/medapark-app` (privado) |
| Mocks | Pencil (MCP) a partir de `docs/prototipos/*.jpg`. Se realizan en otra sesión antes de implementar la UI |
| Agente de implementación | Claude Code (las skills `/speckit-*` están en `.claude/skills`) |

## 4. Elementos de los prototipos: qué entra y qué no

| Elemento del prototipo | Decisión |
|------------------------|----------|
| Mapa selector de ubicación en HU3/HU5 (clic o arrastre del marcador para llenar lat/lng) | **Entra**, sin buscador ni geocodificación. Los campos lat/lng siguen siendo editables a mano y son la fuente de verdad |
| Buscador "Buscar dirección…" sobre el mapa de HU3 | **No entra** (no hay geocodificación, según la aclaración de HU3) |
| Lista lateral "Parqueaderos activos (N)" en HU9 | **Entra** (no es búsqueda ni filtro) |
| Pantalla independiente "Configurar celdas" (HU6) con botones +/- | **Entra**, además de la capacidad en los formularios de HU3 y HU5 |
| Campo "Registrar placa" (HU7) | **No entra**: no hay historial y el prototipo no lo muestra |
| Menú lateral "Usuarios", "Reportes", "Configuración" y tarjeta "Reportes" | **No entra** (no hay HU) |
| "Usuario ▾ / Cerrar sesión" en el encabezado del mapa público | **No entra**: el usuario es anónimo. En su lugar va el enlace "Acceso administradores" |
| Marcadores grises de "Parqueadero inactivo" en el mapa público | **No entra**: HU9 dice que los inactivos no aparecen. El gris se reutiliza para los parqueaderos publicados **sin celdas disponibles** (llenos), según el clarify de la 003 |
| Correo de contacto marcado obligatorio en el prototipo de HU5 | **Prevalece el texto**: es opcional |
| Modal de confirmación al cerrar sesión (prototipo HU8) | **Entra** |

## 5. MFA: decisión y desviación documentada de HU2

Se usa el **MFA TOTP nativo de Supabase**. Supabase no redirige a otra página: la app llama a la API
(`mfa.enroll`, `mfa.challenge`, `mfa.verify`) y dibuja sus propias pantallas.

Flujo:

1. HU1: correo y contraseña correctos. La sesión queda en nivel `aal1` (factor 1 superado; no da acceso al panel).
2. Si el admin **no tiene factor TOTP verificado**, va a la pantalla **Configurar verificación en dos pasos**
   (primera vez): QR, clave manual y campo de código de 6 dígitos para confirmar el enrolamiento.
3. Si ya tiene factor, va a la pantalla **Verificación en dos pasos** (HU2): código de 6 dígitos de la app.
4. Si el código es correcto, la sesión pasa a `aal2` y el admin entra al panel.

**Desviaciones frente a la HU2** (control de cambios a registrar en el documento de HU):

| Criterio HU2 | Cómo se cumple con TOTP |
|--------------|-------------------------|
| "Generar/enviar código" | Lo genera la app autenticadora del admin. No se envía correo |
| "Vigencia limitada" | El código TOTP cambia cada 30 s. Además, el *challenge* de Supabase expira; si expira se muestra "El código de verificación ha expirado. Solicita uno nuevo." y la app crea un challenge nuevo automáticamente |
| "Reenviar código" | **Se reemplaza** por la indicación "Abre tu app autenticadora para ver un código nuevo". No hay reenvío |
| "Limitar intentos" | Límites de tasa del servidor de Supabase y, además, después de **5 intentos fallidos consecutivos** se cancela la autenticación pendiente y se vuelve a HU1 |
| Pantalla de enrolamiento | **Nueva** (no existe en las HU): la necesita TOTP la primera vez |

Riesgo nuevo: si el admin pierde el dispositivo, el equipo debe eliminar su factor desde el dashboard de Supabase.

## 6. Inconsistencias del documento y cómo se resolvieron

| # | Texto original | Interpretación adoptada |
|---|----------------|-------------------------|
| 1 | HU7: "La cantidad de celdas ocupadas **debe superar** la capacidad total" | Errata: **no debe superar**. Invariante `0 ≤ ocupadas ≤ capacidad` |
| 2 | HU7: "La cantidad de celdas ocupadas **debe ser inferior a cero**" | Errata: **no debe ser inferior a cero** |
| 3 | HU6: "valores enteros **mayores a cero**" y también "se puede actualizar a 0" (el prototipo dice "mayor o igual a 0") | Enteros **≥ 0**. Pasar a 0 (o a menos de las ocupadas) solo se permite si `nueva capacidad ≥ ocupadas` |
| 4 | HU7/HU8 refieren el panel como "HU3" | El panel de gestión es **HU4** |
| 5 | HU3 aclaración: "no se muestra en un mapa propio de edición", pero el prototipo trae un mapa | Se incluye el mapa selector (decisión del equipo, §4) |
| 6 | HU10: "Cómo llegar solo si hay enlace/coordenadas" y HU3: coordenadas obligatorias | El botón siempre estará visible para los parqueaderos publicados; la regla condicional se conserva por robustez |
| 7 | HU9: marcadores inactivos en la leyenda del prototipo | No se muestran (§4) |
| 8 | HU5: "Los mismos campos de HU4", pero la lista incluye tipos, tarifas y capacidad (HU3) | El formulario de edición usa **los campos de HU3** más el Estado |
| 9 | HU3: tarifa "una o dos opciones" | Tarifa **por hora**, en pesos colombianos (COP), entero > 0, una por cada tipo atendido |
| 10 | HU5: desmarcar un tipo con celdas > 0 | Se bloquea si la capacidad **guardada** de ese tipo es > 0. Primero se guarda la capacidad en 0 (y para eso no puede haber ocupadas) |

## 7. Mensajes exactos (textos de las HU)

| Clave | Texto | HU |
|-------|-------|----|
| login.correoFormato | Verificar correo electrónico | HU1 |
| login.requeridos | Debe completar los campos requeridos | HU1 |
| login.credenciales | El correo electrónico o la contraseña son incorrectos | HU1 |
| mfa.incorrecto | El código de verificación es incorrecto | HU2 |
| mfa.expirado | El código de verificación ha expirado. Solicita uno nuevo. | HU2 |
| parq.requeridos | Debe completar los campos obligatorios | HU3, HU5 |
| parq.registrado | Parqueadero registrado exitosamente | HU3 |
| parq.actualizado | Información actualizada exitosamente | HU5 |
| parq.quitarTipo | Debe reducir a cero las celdas de este tipo de vehículo antes de quitarlo de los tipos atendidos | HU5 |
| celdas.reducir | No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas | HU6 |
| ocup.sinDisponibles | No hay celdas disponibles de este tipo | HU7 |
| ocup.sinOcupadas | No hay celdas ocupadas de este tipo para liberar | HU7 |

Los mensajes que no aparecen en las HU (por ejemplo, demasiados intentos MFA o error de red) se definen en cada spec.

## 8. Inventario de pantallas y rutas

| Ruta | Pantalla | HU | Acceso |
|------|----------|----|--------|
| `/` | Mapa de parqueaderos + lista lateral + panel de detalle | HU9, HU10, HU11 | Público |
| `/admin/login` | Iniciar sesión | HU1 | Público (si ya hay sesión aal2, redirige a `/admin`) |
| `/admin/mfa/configurar` | Configurar verificación en dos pasos (QR) | HU2 (desviación) | Sesión aal1 sin factor |
| `/admin/mfa/verificar` | Verificación en dos pasos | HU2 | Sesión aal1 con factor |
| `/admin` | Panel "Mi parqueadero" (o CTA "Registrar parqueadero") | HU4 | aal2 |
| `/admin/parqueadero/registrar` | Registrar parqueadero | HU3 | aal2, sin parqueadero |
| `/admin/parqueadero/editar` | Editar mi parqueadero | HU5 | aal2, con parqueadero |
| `/admin/parqueadero/celdas` | Configurar celdas | HU6 | aal2, con parqueadero |
| `/admin/ocupacion` | Gestionar ocupación | HU7 | aal2, con parqueadero y capacidad > 0 |
| (modal) | Confirmar cierre de sesión | HU8 | aal2 |

## 9. Fuera de alcance (MVP)

Registro público, recuperación o cambio de contraseña, roles adicionales, más de un parqueadero por cuenta,
historial o bitácora de ingresos y salidas, placas, tiempo real (websockets), clustering, búsqueda, filtros,
geocodificación, navegación embebida, cálculo de tiempos o tráfico, reportes, gestión de usuarios, pagos y
reservas.

## 10. Riesgos (del documento y del análisis)

- Pérdida del dispositivo TOTP del admin: el equipo debe restablecer el factor manualmente.
- Plan free de Supabase: el proyecto se pausa tras 7 días sin actividad. Hay que reactivarlo antes de la demo.
- La disponibilidad depende de la disciplina del admin (no hay verificación automática).
- Datos iniciales de la Alcaldía: **no se cargan datos de ejemplo** (decisión del clarify de 002). Para la demo, el equipo crea varias cuentas de administrador y registra sus parqueaderos desde la app.
