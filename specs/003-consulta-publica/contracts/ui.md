# Contrato: página pública y componentes (003)

## Rutas

| Ruta | Página | Layout | Guard |
|------|--------|--------|-------|
| `/` (con el query opcional `?parqueadero=<uuid>`) | `pages/public/Home` (existente, **rediseñada**) | `PublicLayout` (001) | ninguno |
| `/parking/:id` | redirección `<Navigate to={`/?parqueadero=${id}`} replace/>` (`pages/public/ParkingDetail` se conserva en el repo, sin ruta) | — | ninguno |

## Datos y dominio

Ver [public-view.md](./public-view.md): `listPublicParkings()` en `src/services/parkings.ts` y las funciones
puras de `src/domain/publicParking.ts` (`toPublicParking`, `googleMapsUrl`, `hasValidCoordinates`, `isFull`,
`availabilitySummary` y `sortByName`).

### Extensión de `MSG`

```ts
publico: {
  titulo: 'Mapa de parqueaderos',
  subtitulo: 'Consulta los parqueaderos registrados y selecciona uno para ver su información detallada.',
  listaTitulo: (n: number) => `Parqueaderos activos (${n})`,
  vacio: 'Aún no hay parqueaderos disponibles.',
  errorCarga: 'No fue posible cargar los parqueaderos. Intenta nuevamente.',
  reintentar: 'Reintentar',
  noDisponible: 'Este parqueadero ya no está disponible.',
  sinCeldas: 'Sin celdas disponibles',
  notaUltimoEstado: 'La información mostrada corresponde al último estado registrado por el administrador.',
  comoLlegar: 'Cómo llegar',
  leyendaDisponible: 'Parqueadero con celdas disponibles',
  leyendaLleno: 'Parqueadero sin celdas disponibles',
},
```

## Componentes

### `pages/public/Home` (rediseño de la página existente)

- Estado: `{ estado: 'cargando' | 'error' | 'listo', parkings: PublicParking[] }`. Carga al montar.
- `selectedId = searchParams.get('parqueadero')`; `selected = parkings.find(...)`.
- Si `estado === 'listo'` y hay `selectedId` sin coincidencia → `Alert` warning `MSG.publico.noDisponible`
  y se limpia el parámetro (`replace`).
- Layout según `research.md` §R6: título y subtítulo; `ParkingMap`; columna derecha (desktop) con
  `ParkingList` o `ParkingDetailPanel`.
- Esc con un detalle abierto → cerrar.

### `components/map/ParkingMap` (existente, rediseñado; props: `parkings`, `selectedId`, `onSelect(id)`)

- `MapBase` (002) + un `ParkingMarker` (existente, rediseñado) por parqueadero con el ícono `disponible`, `lleno` o `seleccionado`; `eventHandlers.click`
  llama a `onSelect`; `keyboard: true`; `title` = nombre (accesible).
- `Tooltip` permanente sobre el seleccionado: nombre (negrita) y dirección.
- `fitBounds` al cargar y `flyTo` al cambiar la selección (componente interno con `useMap`).
- `components/public/MapLegend`, abajo a la izquierda: pin verde `MSG.publico.leyendaDisponible` y pin gris
  `MSG.publico.leyendaLleno`.
- `aria-label="Mapa de parqueaderos de Medellín"`.

### `components/public/ParkingList` (nuevo; props: `parkings`, `selectedId`, `onSelect`)

- Encabezado con el ícono `Car` y `MSG.publico.listaTitulo(n)`.
- `<ul>` con scroll; cada `<li>` es un `<button>` con el pin (verde o gris), el nombre, un punto verde y la
  dirección, y la disponibilidad por tipo ("12 disponibles de 20" por tipo, con su ícono `Car`/`Bike`); si
  está lleno, un badge `MSG.publico.sinCeldas`; y un chevron `ChevronRight`. Fondo `accent-50` si está
  seleccionado.
- Vacío: `MSG.publico.vacio`.

### `components/public/ParkingDetailPanel` (nuevo; reutiliza el contenido de `ParkingDetail`; props: `parking`, `onClose`)

Fiel a `docs/prototipos/HU10-detalle-parqueadero.jpg`:

1. Encabezado: ícono `Car` en un círculo `accent-50`, el nombre (h2) y el botón "X"
   (`aria-label="Cerrar detalle"`). **Sin** badge "Activo" (todos los visibles lo son).
2. Fila "Dirección" (`MapPin`) y, a la derecha, el botón outline "Cómo llegar" (`Navigation` o `Map`), que es
   un `<a href={googleMapsUrl(...)} target="_blank" rel="noopener noreferrer">` y solo se renderiza si
   `hasValidCoordinates`.
3. "Horario de atención" (`Clock`) | "Información de contacto" (`Phone` teléfono; `Mail` correo solo si existe).
   El teléfono es un enlace `tel:`.
4. "Disponibilidad actual de celdas" (`BarChart3`): tarjeta por oferta con ícono, nombre plural, número
   grande de disponibles (verde, o gris si es 0), "celdas disponibles" y "capacidad total".
5. "Tarifas configuradas" (`CircleDollarSign`): por oferta, el nombre plural, `formatCOP(hourly_rate)` y
   "por hora".
6. `Alert` info con `MSG.publico.notaUltimoEstado`.

- Desktop: ocupa la columna derecha. Móvil: `fixed inset-0` (o `inset-x-0 bottom-0 max-h-[85dvh]`) con
  `role="dialog"`, `aria-modal="true"`, `aria-labelledby` y el foco inicial en el botón de cierre.

## Encabezado público (`PublicLayout`, 001)

Sin cambios funcionales: logo a la izquierda y "Acceso administradores" a la derecha (enlace discreto, botón
ghost con el ícono `LogIn`).
