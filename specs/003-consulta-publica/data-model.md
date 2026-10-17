# Data Model: Consulta Pública (003)

Esta feature **no crea tablas**. Lee las de la 002 mediante una función de solo lectura.

## Vista lógica `ParqueaderoPublico`

Origen: `public.listar_parqueaderos_publicos()` ([contracts/public-rpc.md](./contracts/public-rpc.md)).

| Campo | Origen | Notas |
|-------|--------|-------|
| `id` | `parqueaderos.id` | Se usa en `?parqueadero=` |
| `nombre`, `direccion`, `telefono`, `correo_contacto`, `horario_atencion` | `parqueaderos` | `correo_contacto` puede ser `null` |
| `latitud`, `longitud` | `parqueaderos` | Posición del marcador y destino de Google Maps |
| `ofertas[]` | `ofertas_vehiculo` | Una por tipo atendido |
| `ofertas[].tipo` | | `automovil` \| `motocicleta` |
| `ofertas[].tarifa_hora` | | COP enteros |
| `ofertas[].capacidad_total` | | |
| `ofertas[].celdas_disponibles` | `capacidad_total − celdas_ocupadas` | Calculado en el servidor |

**Campos excluidos a propósito**: `admin_id`, `estado` (siempre activo), `celdas_ocupadas` (se publica solo
el número de disponibles), `created_at` y `updated_at`.

## Regla de inclusión (publicabilidad)

```text
incluido(p) ⇔ p.estado = 'activo' ∧ Σ capacidad_total(p) > 0
```

## Estados derivados en la UI

| Estado | Condición | Marcador | Lista |
|--------|-----------|----------|-------|
| Con disponibilidad | ∃ oferta con `celdas_disponibles > 0` | verde | normal |
| Lleno | ∀ ofertas `celdas_disponibles = 0` | gris | badge "Sin celdas disponibles" |
| Seleccionado | `id === ?parqueadero` | azul y más grande, con tooltip | fondo resaltado |

## Estado de la página

```ts
type EstadoCarga = 'cargando' | 'error' | 'listo';
// selección: URLSearchParams 'parqueadero' (string | null)
```
