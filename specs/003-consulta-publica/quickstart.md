# Quickstart: Consulta Pública (003)

## 0. Prerrequisitos

- Features 001 y 002 implementadas.
- **Datos**: el back ya tiene parqueaderos de prueba del equipo. Para cubrir todos los casos, usar la app
  (feature 002, con cuentas de prueba) para dejar al menos:

| Caso | Cómo obtenerlo (desde la app) | ¿Debe verse en el mapa? |
|------|-------------------------------|-------------------------|
| A. Activo con disponibilidad | registrar o usar uno existente | Sí (verde) |
| B. Activo y lleno | registrar ingresos hasta ocupar todo | Sí (gris, "Sin celdas disponibles") |
| C. Inactivo | Editar → Estado Inactivo | No |
| D. Activo con capacidad 0 | Configurar celdas → 0 en todos los tipos | No |

> No se modifica la BD por fuera de la app. Estos cambios son operaciones normales de los administradores.

## 1. Verificación automatizada

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 2. Validación manual (ventana privada, sin sesión)

### US1: Mapa (HU9)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Abrir `/` | "Mapa de parqueaderos", subtítulo, mapa de Medellín y "Parqueaderos activos (N)" |
| 2 | Marcadores | A en verde y B en gris; no aparecen C ni D |
| 3 | Lista | Orden alfabético; B con "Sin celdas disponibles"; la disponibilidad por tipo de A |
| 4 | Buscar un buscador o filtros | No existen |
| 5 | Encabezado | Logo y "Acceso administradores" |
| 6 | Pasar C a Activo (con admin) y recargar | C aparece |
| 7 | DevTools → offline → recargar | "No fue posible cargar los parqueaderos. Intenta nuevamente." y "Reintentar" |

### US2: Detalle (HU10)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Clic en el marcador de A | Detalle abierto; URL con `?parqueadero=<id>`; marcador azul con tooltip |
| 2 | Revisar el detalle | Dirección, horario, contacto (correo solo si existe), disponibilidad y tarifas ("$ 5.000 por hora") solo de los tipos atendidos y la nota del último estado |
| 3 | Cerrar (X) y elegir B desde la lista | Detalle de B; disponibles 0 en gris |
| 4 | Con el detalle abierto, "Atrás"; volver a abrirlo y pulsar Esc | Ambos cierran el detalle |
| 5 | Copiar la URL y abrirla en otra pestaña | Abre con el detalle |
| 6 | `/?parqueadero=00000000-0000-0000-0000-000000000000` | "Este parqueadero ya no está disponible." |
| 7 | `/parking/<id de A>` | Redirige a `/?parqueadero=<id de A>` |
| 8 | 375 px | Mapa arriba, lista abajo; detalle a pantalla completa |

### US3: Cómo llegar (HU11)

| # | Paso | Esperado |
|---|------|----------|
| 1 | "Cómo llegar" en A | Pestaña nueva `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` |
| 2 | Volver a MedaPark | Sigue con el mismo detalle |
| 3 | En un celular con Google Maps | Abre la app con el destino |

### Frescura

Con el mapa abierto en una pestaña, registrar un ingreso en A desde el panel admin (otra ventana): el mapa no
cambia hasta recargar; al recargar, los disponibles bajan en 1.
