# Research: Consulta Pública (003)

**Feature**: `003-consulta-publica` · **Fecha**: 2026-10-17 (rev. back existente; cambios del back vía CB-NNN, CRITICIDAD ALTA)

## R1. Datos públicos: la vista existente `public_parking_lots`

- **Decision**: leer la vista existente con `select('*').order('name')`, que el repo ya usa en
  `getPublicParkings`, y mapear cada fila plana (`car_*`, `motorcycle_*`) a `PublicParking` con
  `toPublicParking` (`contracts/public-view.md`).
- **Rationale**: Principio II (back sin cambios). La vista ya aplica la publicabilidad (`status = true` y
  capacidad > 0), no expone `admin_id` y calcula los disponibles.
- **Alternatives considered**: una función SQL nueva (descartada: no se permiten cambios en la BD).

## R2. Carga y frescura

- **Decision**: una sola petición al montar; sin polling ni realtime; "Reintentar" solo ante un error
  (comportamiento que ya tiene `Home`).
- **Rationale**: HU7/HU10 ("último estado registrado", sin tiempo real).

## R3. Mapa (rediseño de `ParkingMap` y `ParkingMarker` del repo)

- **Decision**: `ParkingMap` pasa a usar `MapBase` (002, mosaicos de OpenStreetMap) y `ParkingMarker` usa los íconos de
  `markerIcons` (002) con las variantes:
  - `disponible`: pin `brand-600`;
  - `lleno`: pin gris `#8A94A6`;
  - `seleccionado`: pin `accent-600`, 1.25× de tamaño, con `zIndexOffset` alto.

  Se elimina el `Popup` con el enlace "Ver parqueadero": ahora el clic selecciona y abre el panel. El
  seleccionado muestra un `Tooltip` permanente con el nombre y la dirección. Al cargar,
  `fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })` (una sola vez). Al seleccionar,
  `flyTo([lat, lng], max(zoom, 15))`.
- **Rationale**: fidelidad a los prototipos HU09/HU10, reutilizando lo existente.
- **Alternatives considered**: `react-leaflet-cluster` (el clustering está fuera de alcance).

## R4. Enlace de Google Maps (HU11)

- **Decision**: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` como `<a target="_blank"
  rel="noopener noreferrer">`. Reemplaza la URL actual del repo (`maps/search/?api=1&query=`), que muestra el
  lugar pero no prepara la ruta que pide la HU11.
- **Rationale**: Maps URLs universales; en el móvil abre la app; no requiere API key.

## R5. Selección en la URL y compatibilidad

- **Decision**: `useSearchParams` con `parqueadero`. Abrir (push), cerrar con la X o Esc (push) y "Atrás"
  revierte. Un id inexistente → `Alert` con `noDisponible` y se limpia (replace). `/parking/:id` →
  `<Navigate to={'/?parqueadero=' + id} replace/>`.

## R6. Layout responsive

- **Decision**: ≥ 1024 px: grid `1fr 400px`, el mapa con alto `calc(100dvh - 190px)` (mínimo 520 px) y la
  columna derecha con la lista o el detalle. < 1024 px: el mapa (55 dvh) con la lista debajo y el detalle
  como panel fijo a pantalla completa (`role="dialog"`). `map.invalidateSize()` si cambia el layout.

## R7. Pruebas

- **Decision**: Vitest con `supabase` simulado: `toPublicParking` (con y sin cada tipo, filas incompletas
  descartadas), `googleMapsUrl`, `isFull`, `availabilitySummary`, `sortByName`, `listPublicParkings`,
  `ParkingList`, `ParkingDetailPanel` y `Home` (selección por URL, id inexistente y error con
  "Reintentar"), mockeando `ParkingMap`. La regla de publicabilidad la aplica el back y se valida a mano en
  `quickstart.md`.
