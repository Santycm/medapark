# Research: Consulta Pública (003)

**Feature**: `003-consulta-publica` · **Fecha**: 2026-10-17

## R1. Acceso anónimo a los datos: función de solo lectura

- **Decision**: una función `public.listar_parqueaderos_publicos()` (`security definer`, `stable`,
  `set search_path = ''`) que devuelve solo los parqueaderos **publicables**, con las columnas públicas y
  sus ofertas en un `jsonb` (incluido `celdas_disponibles` calculado). `EXECUTE` se concede a `anon` y
  `authenticated`. Las tablas siguen **sin** `SELECT` para `anon` (002).
- **Rationale**: Principio II (el acceso anónimo se limita a los datos públicos de parqueaderos
  publicables, sin `admin_id`). Una sola llamada trae todo lo que necesitan el mapa, la lista y el detalle
  (≤ 50 filas). La regla de publicabilidad vive en un único lugar del servidor.
- **Alternatives considered**: (a) políticas RLS para `anon` sobre las tablas (expone `admin_id` y obliga a
  filtrar columnas en cada consulta); (b) una vista `security_invoker = false` (el linter de Supabase la marca
  como riesgo; la función es equivalente y explícita).

## R2. Carga y frescura

- **Decision**: una llamada al montar la página. Sin polling, sin realtime y sin caché más allá del ciclo
  de vida de la página. El botón "Reintentar" aparece solo ante un error.
- **Rationale**: HU7 y HU10 ("último estado registrado", "no realizará actualización automática en tiempo
  real") y el Principio III.

## R3. Mapa (reutiliza la 002)

- **Decision**: `MapBase` + `markerIcons` de `src/components/map/` (CARTO Voyager, sin llave). Íconos:
  - `disponible`: pin `brand-600` (verde) con carro blanco;
  - `lleno`: pin gris `#8A94A6`;
  - `seleccionado`: pin `accent-600` (azul), más grande, con `zIndexOffset` alto.

  Al cargar: si hay ≥ 1 parqueadero, `map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })`; si no,
  centro `MEDELLIN_CENTRO` con zoom 13. Al seleccionar: `map.flyTo([lat, lng], Math.max(map.getZoom(), 15))`.
  El marcador seleccionado muestra un `Tooltip` permanente con el nombre y la dirección (como el prototipo).
- **Rationale**: consistencia con la 002 y fidelidad al prototipo HU9/HU10.
- **Alternatives considered**: `react-leaflet-cluster` (el clustering está fuera de alcance según HU9).

## R4. Enlace de Google Maps (HU11)

- **Decision**: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` (Maps URLs, el formato
  universal documentado por Google). Se usa como `<a href target="_blank" rel="noopener noreferrer">`: en
  desktop abre una pestaña nueva; en Android/iOS el sistema lo intercepta y abre la app de Google Maps si está
  instalada. Las coordenadas se formatean con punto decimal y hasta 6 decimales.
- **Rationale**: HU11 limita la integración a la generación de un enlace. No requiere API key. Un `<a>` real
  es más accesible y más compatible con los bloqueadores de pop-ups que `window.open`.
- **Alternatives considered**: el destino por dirección de texto (`destination=Calle+50…`, que es menos
  preciso) y la Google Directions API (fuera de alcance y de pago).

## R5. Estado de selección en la URL

- **Decision**: `useSearchParams` con la clave `parqueadero`. Abrir → `setSearchParams({ parqueadero: id })`
  (push). Cerrar con la X o Esc → `setSearchParams({})` (push). "Atrás" vuelve al estado anterior. Si el `id`
  no está en la lista cargada, se muestra un `Alert` con "Este parqueadero ya no está disponible." y se
  limpia el parámetro (`replace`).
- **Rationale**: FR-011 y FR-012, enlaces compartibles y sin estado global.

## R6. Layout responsive

- **Decision**:
  - ≥ 1024 px: grid de 2 columnas (`1fr` y `400px`); el mapa con alto `calc(100dvh - 190px)` y mínimo 520 px;
    la columna derecha muestra la **lista** o, si hay selección, el **detalle** (como en los prototipos
    HU09 y HU10), con un botón "X" para volver a la lista.
  - < 1024 px: una columna con el mapa (alto 55 dvh) y la lista debajo. El detalle es un panel fijo inferior
    a pantalla completa (`role="dialog"`, `aria-modal`), con su botón de cierre.
- **Rationale**: prototipos y FR-017 (≥ 360 px).

## R7. Pruebas

- **pgTAP** `supabase/tests/003_publico.test.sql`: con la fixture de usuarios de la 002 y datos insertados
  como `postgres` (A activo con capacidad > 0; B inactivo; C activo con capacidad 0; D activo y lleno), como
  `anon`: la función devuelve A y D (en orden por nombre); no devuelve B ni C; los registros no tienen
  `admin_id`; `celdas_disponibles = capacidad_total − celdas_ocupadas`; `anon` **no** puede hacer `select`
  directo sobre las tablas. Al cambiar A a inactivo, deja de aparecer (SC-003).
- **Vitest**: dominio (`googleMapsUrl`, `estaLleno`, `resumenDisponibilidad`, `ordenarPorNombre`),
  servicio (mapeo y errores), `ParqueaderoDetalle` (tipos atendidos, correo opcional, nota y enlace),
  `ParqueaderosList` (vacío, lleno, contador N) y la página (selección por URL, id inexistente, error con
  "Reintentar"), mockeando el componente de mapa.
