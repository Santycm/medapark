# Contrato: rutas y pantallas (002)

## Rutas nuevas (dentro de `AdminLayout` + `RequireAal2` de la 001)

`MyParkingProvider` (`src/context/`) envuelve el `<Outlet/>` de `AdminLayout`. Los guards nuevos
(`src/router/guards/`) leen `useMyParking()`: con `cargando` muestran un spinner y con `error` muestran un `Alert` con el botón
"Reintentar".

| Ruta | Página | Guard adicional | Comportamiento del guard |
|------|--------|-----------------|--------------------------|
| `/admin` | `pages/app/Panel` (reemplaza el placeholder de la 001) | — | Muestra el estado vacío o la información |
| `/admin/parqueadero/registrar` | `pages/app/RegisterParking` | `RequireNoParking` | Con parqueadero → `/admin` (`replace`) |
| `/admin/parqueadero/editar` | `pages/app/EditParking` | `RequireParking` | Sin parqueadero → `/admin` |
| `/admin/parqueadero/celdas` | `pages/app/ConfigureSpaces` | `RequireParking` | Sin parqueadero → `/admin` |
| `/admin/ocupacion` | `pages/app/ManageOccupancy` | `RequireParking` | Sin parqueadero → `/admin`. Con capacidad total 0 → renderiza el aviso `MSG.ocupacion.sinCapacidad` con el enlace "Configurar celdas" |

## Menú lateral (`adminNavItems`)

| Ítem | Ruta | Ícono (lucide) | Visible |
|------|------|----------------|---------|
| Mi parqueadero | `/admin` | `Building2` | siempre |
| Gestionar ocupación | `/admin/ocupacion` | `Car` | con parqueadero |
| Configurar celdas | `/admin/parqueadero/celdas` | `LayoutGrid` | con parqueadero |

## Pantallas

### Panel (HU4): `docs/prototipos/HU04-consultar-mi-parqueadero.jpg`

- Migas: "Inicio › Mi parqueadero".
- **Sin parqueadero**: tarjeta centrada con ícono `Building2`, título "Aún no has registrado tu
  parqueadero", texto "Registra la información de tu parqueadero para que los usuarios puedan
  consultarlo." y el botón primario "Registrar parqueadero" → `/admin/parqueadero/registrar`.
- **Con parqueadero**:
  1. Encabezado: título "Mi parqueadero", subtítulo "Consulta la información general de tu parqueadero." y
     a la derecha un badge de estado (punto verde "Activo" o punto gris "Inactivo").
  2. `Alert` informativo con el aviso de publicabilidad, si aplica (`unpublishedReason`: inactivo, sin tipos o sin celdas).
  3. `Alert` de éxito con el `flash` de `location.state`, si existe (se oculta a los 5 s).
  4. Tarjeta de información: ícono y nombre; botones "Editar información" (outline, `Pencil`) y "Gestionar
     ocupación" (accent, `Car`); grilla de campos con ícono: Dirección (`MapPin`), Coordenadas (`Map`: "Latitud:
     x" / "Longitud: y"), Teléfono de contacto (`Phone`), Correo electrónico de contacto (`Mail`, o "No
     registrado"), Horario de atención (`Clock`) y Tarifas por hora (`CircleDollarSign`: "Automóviles: $ 5.000",
     "Motocicletas: $ 2.000").
  5. Sección "Disponibilidad por tipo de vehículo": una tarjeta por tipo atendido (Automóviles con fondo
     `accent-50`, Motocicletas con fondo `brand-50`) con "Celdas disponibles" (número grande en verde) y
     "Capacidad total"; texto accesible "Automóviles: 15 disponibles / 20".
  6. Tarjetas de acceso: "Gestionar ocupación" (deshabilitada con la nota `MSG.ocupacion.sinCapacidad` si la
     capacidad total es 0), "Editar información" y "Configurar celdas".

### RegisterParking / EditParking (HU3/HU5): `HU03-*.jpg`, `HU05-*.jpg`

- Encabezado con flecha "←" (vuelve a `/admin`), título "Registrar parqueadero" o "Editar mi parqueadero",
  subtítulo "Ingresa la información básica del parqueadero para administrarlo en el sistema." o "Actualiza
  la información de tu parqueadero para mantener los datos correctos y vigentes."; en la edición, el badge
  de estado actual.
- `components/parking/ParkingForm` en 2 columnas (≥ 1024 px) o 1 columna (móvil):
  - **Izquierda**: Nombre del parqueadero* (`Building2`, placeholder "Ej. Parqueadero Centro"),
    Dirección* (`MapPin`, "Ej. Calle 50 # 45-10, Medellín"), Latitud* ("Ej. 6.2442", ayuda "Rango válido: -90
    a 90.") y Longitud* ("Ej. -75.5812", ayuda "Rango válido: -180 a 180.") en la misma fila, Teléfono de
    contacto* (`Phone`, "3001234567", ayuda "Solo se permiten caracteres numéricos."), Correo electrónico de
    contacto (opcional) (`Mail`, "contacto@dominio.com") y Horario de atención* (`Clock`, "Ej. Lunes a
    Domingo, 6:00 a.m. - 10:00 p.m.").
  - **Derecha**: "Ubicación en el mapa*" con `LocationPicker` (alto 280 px), una caja informativa "Haz clic en
    el mapa o arrastra el marcador para establecer la ubicación del parqueadero." con "Latitud: x Longitud:
    y" y el aviso `fueraDeMedellin` en ámbar si aplica; "Tipos de vehículo atendidos*" con los checkboxes
    Automóviles (`Car`) y Motocicletas (`Bike`); por cada tipo marcado, la fila "Tarifa por hora (<Tipo>)*"
    (`CircleDollarSign`, "Ej. 5000") y "Capacidad de celdas (<Tipo>)*" (`LayoutGrid`, "Ej. 50"; mínimo 1 al registrar o agregar el tipo); y solo en la
    edición, "Estado del parqueadero" con dos tarjetas radio (Activo / Inactivo con sus descripciones).
- Pie: resumen de error `MSG.parqueadero.requeridos` (si aplica), "Cancelar" (secundario) y "Guardar" o
  "Guardar cambios" (primario, `Save`, con `loading`).
- Resultado: registro → `navigate('/admin', { replace: true, state: { flash: MSG.parqueadero.registrado } })`;
  edición → `flash: MSG.parqueadero.actualizado`. Error de negocio → `Alert` en el pie y, si el error
  apunta a un campo (`TIPO_CON_CELDAS`, `CAPACIDAD_MENOR_A_OCUPADAS`, `CAPACIDAD_NUEVO_TIPO`), además `setError` en ese campo.
  Registro incompleto o guardado parcial: ver `back-usage.md` §3 y §4.

### ConfigureSpaces (HU6): `HU06-configurar-celdas.jpg`

- Migas "Mi parqueadero › Configurar celdas", "←", título "Configurar celdas del parqueadero" y subtítulo
  "Define la cantidad de celdas disponibles para automóviles y motocicletas."
- Tarjeta resumen del parqueadero (nombre, dirección, coordenadas y badge de estado): componente
  reutilizable `components/parking/ParkingSummary`, que también usa la página de ocupación.
- "Configuración de celdas": una tarjeta por tipo atendido con el texto "Cantidad total de celdas" y el
  componente `components/common/NumberStepper` (− [input] +; mínimo 0, máximo 9999; "−" deshabilitado en 0; solo dígitos) y la
  nota "Valor numérico entero mayor o igual a 0."; debajo, "Ocupadas actualmente: n" como referencia.
- Tarjeta "Total de celdas configuradas" ("Suma de celdas disponibles en el parqueadero."), con los
  subtotales por tipo y el total grande.
- Pie: "Cancelar" y "Guardar cambios". Éxito → `/admin` con `flash: MSG.celdas.actualizadas`.

### ManageOccupancy (HU7): `HU07-gestionar-ocupacion.jpg`

- Migas "Mi parqueadero › Gestionar ocupación", "←", título "Gestionar ocupación" y subtítulo "Registra los
  ingresos y salidas de vehículos para mantener actualizada la ocupación."
- `ParkingSummary`.
- "Ocupación actual" ("Cantidad de celdas ocupadas y disponibles por tipo de vehículo."): por tipo atendido,
  Capacidad total, Celdas ocupadas (azul) y Celdas disponibles (verde). Región `aria-live="polite"`.
- Dos tarjetas lado a lado (apiladas en móvil):
  - **Registrar ingreso** (`LogIn`, "Aumenta en uno la cantidad de celdas ocupadas."): "Tipo de vehículo*"
    como radio-cards (solo los tipos atendidos; preseleccionado el primero) y el botón primario
    "Registrar ingreso", deshabilitado si las disponibles del tipo son 0, con `MSG.ocupacion.sinDisponibles`
    debajo.
  - **Registrar salida** (`LogOut`, "Disminuye en uno la cantidad de celdas ocupadas."): ídem, con el botón
    `danger` "Registrar salida", deshabilitado si las ocupadas son 0, con `MSG.ocupacion.sinOcupadas`.
- Tras el éxito: `applyOccupancy(configId, occupied)` y el texto efímero "Ingreso registrado" o "Salida registrada"
  (`role="status"`, 3 s). Si llega un error `SIN_DISPONIBLES`/`SIN_OCUPADAS` (concurrencia): se muestra el mensaje y se hace
  `reload()`.
- Pie: `Alert` info con `MSG.ocupacion.info` y el botón "← Volver al panel".
