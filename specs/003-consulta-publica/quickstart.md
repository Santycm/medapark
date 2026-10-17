# Quickstart: Consulta Pública (003)

## 0. Prerrequisitos

- Features 001 y 002 implementadas. Como **no hay datos de ejemplo**, preparar 4 parqueaderos con 4 cuentas
  de administrador (crearlas en el dashboard de Supabase y registrar cada parqueadero desde la app):

| Admin | Parqueadero | Coordenadas | Tipos (tarifa / capacidad / ocupadas) | Estado |
|-------|-------------|-------------|----------------------------------------|--------|
| admin1 | Parqueadero Centro | 6.2518, -75.5680 | Autos 5000 / 20 / 8 · Motos 2000 / 15 / 7 | Activo |
| admin2 | Parqueadero Estadio | 6.2567, -75.5906 | Autos 4500 / 15 / 15 | Activo (lleno) |
| admin3 | Parqueadero Poblado | 6.2088, -75.5672 | Motos 2500 / 10 / 0 | **Inactivo** |
| admin4 | Parqueadero Laureles | 6.2447, -75.5946 | Autos 4000 / 0 / 0 | Activo (sin celdas) |

- Aplicar la migración: `npx supabase db push`.

## 1. Verificación automatizada

```bash
npm run lint
npm run typecheck
npm test
npx supabase test db --linked     # 001_*, 002_* y 003_publico en verde
```

## 2. Validación manual

Usar una ventana privada (sin sesión).

### US1: Mapa (HU9)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Abrir `http://localhost:5173/` | "Mapa de parqueaderos", subtítulo, mapa de Medellín y "Parqueaderos activos (2)" |
| 2 | Revisar los marcadores | Centro (verde) y Estadio (gris); no aparecen Poblado (inactivo) ni Laureles (sin celdas) |
| 3 | Revisar la lista | Orden alfabético: Centro, Estadio; Estadio con "Sin celdas disponibles"; Centro con autos 12/20 y motos 8/15 |
| 4 | Buscar un buscador o filtros | No existen |
| 5 | Encabezado | Logo y "Acceso administradores"; sin "Usuario" ni "Cerrar sesión" |
| 6 | Con admin3, cambiar Poblado a Activo; recargar el mapa | Aparece Poblado (3 en la lista) |
| 7 | DevTools → Network offline → recargar | "No fue posible cargar los parqueaderos. Intenta nuevamente." y "Reintentar" |

### US2: Detalle (HU10)

| # | Paso | Esperado |
|---|------|----------|
| 1 | Clic en el marcador de Centro | Se abre el detalle; la URL tiene `?parqueadero=<id>`; marcador azul con tooltip |
| 2 | Revisar el detalle | Dirección, horario, contacto (teléfono y correo si se registró), disponibilidad autos 12/20 y motos 8/15, tarifas "$ 5.000 por hora" y "$ 2.000 por hora", y la nota del último estado |
| 3 | Cerrar el detalle (X) y hacer clic en Estadio desde la lista | Solo Automóviles; disponibles 0 en gris; sin información de motos |
| 4 | Con el detalle abierto, pulsar "Atrás"; volver a abrirlo y pulsar Esc | "Atrás" cierra el detalle; Esc también lo cierra |
| 5 | Copiar la URL de Centro y abrirla en otra pestaña | Abre con el detalle de Centro |
| 6 | Abrir `/?parqueadero=00000000-0000-0000-0000-000000000000` | "Este parqueadero ya no está disponible." |
| 7 | Vista móvil (375 px) | Mapa arriba y lista abajo; el detalle se abre a pantalla completa con la X |

### US3: Cómo llegar (HU11)

| # | Paso | Esperado |
|---|------|----------|
| 1 | En el detalle de Centro, "Cómo llegar" | Pestaña nueva con `https://www.google.com/maps/dir/?api=1&destination=6.2518,-75.568` y el destino marcado |
| 2 | Volver a MedaPark | Sigue abierto con el mismo detalle |
| 3 | En un celular con Google Maps | Se abre la app con el destino |

### Frescura (HU7 + HU10)

1. Abrir el mapa público en una pestaña (Centro: autos 12).
2. En otra ventana, con admin1, registrar un ingreso de automóvil.
3. La pestaña pública **sigue** mostrando 12 (sin tiempo real); al recargar, muestra 11.
