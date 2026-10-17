# Feature Specification: Consulta Pública de Parqueaderos

**Feature Branch**: `003-consulta-publica`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Consulta pública de parqueaderos: mapa, detalle y ruta en Google Maps (HU9–HU11)". Fuentes: `docs/historias-usuario/RQ02v2-historias-usuario-medapark.pdf` (HU9, HU10, HU11), `docs/analisis-mvp.md` (§4 prototipos) y los prototipos `docs/prototipos/HU09-*.jpg`, `HU10-*.jpg` y `HU11-*.jpg`.

## Contexto

El **Usuario** (sin cuenta, anónimo) abre MedaPark y ve en un mapa de Medellín los parqueaderos publicados.
Al seleccionar uno consulta su detalle (horario, tarifas, disponibilidad por tipo y contacto) y puede pulsar
"Cómo llegar" para abrir Google Maps con la ruta. La información refleja **el último estado registrado por
el administrador**; no hay actualización en tiempo real.

Un parqueadero es **publicable** si está en estado Activo y la suma de sus capacidades por tipo es mayor a 0
(regla definida en la feature 002).

**Dependencias**: el **back existente** (sin cambios), que ya publica los parqueaderos publicables mediante
la vista `public_parking_lots` (`docs/supabase-esquema-actual.md`); la feature 002 (los administradores
mantienen los datos); la feature 001 (layout público con "Acceso administradores").

## Clarifications

### Session 2026-10-17

- Q: ¿Qué servicio de mapas se usa? → A: mapa interactivo de OpenStreetMap, sin cuenta ni llave. "Cómo llegar" abre Google Maps mediante un enlace.
- Q: ¿Se incluye la lista lateral "Parqueaderos activos (N)" del prototipo? → A: sí. No es búsqueda ni filtro: lista todos los parqueaderos publicados y al seleccionar uno se abre su detalle.
- Q: ¿Se muestran marcadores de parqueaderos inactivos (leyenda del prototipo)? → A: no. HU9 prevalece: los inactivos no aparecen. La leyenda solo explica los marcadores visibles.
- Q: ¿Se muestran los parqueaderos publicados que no tienen celdas disponibles en este momento (llenos)? → A: sí (HU9 solo exige Activo y capacidad > 0). Se distinguen con un marcador gris y la etiqueta "Sin celdas disponibles".
- Q: ¿El encabezado público muestra "Usuario / Cerrar sesión" como en el prototipo? → A: no. El Usuario es anónimo; el encabezado muestra el logo y el enlace "Acceso administradores".
- Q: ¿El detalle seleccionado se puede compartir o abrir por enlace? → A: sí. La selección se refleja en la dirección de la página (`/?parqueadero=<id>`) y "Atrás" cierra el detalle. Si el parqueadero ya no está publicado, se muestra "Este parqueadero ya no está disponible."
- Q: ¿De dónde salen los datos públicos? → A: de la vista existente del back (sin cambios), que ya aplica la regla de publicabilidad. Se reutilizan el servicio y los componentes de mapa del repo, rediseñados según los prototipos.
- Q: ¿Qué pasa con la página de detalle existente `/parking/:id`? → A: se reemplaza por el panel de detalle; esa URL redirige a `/?parqueadero=:id` para no romper enlaces ya publicados.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar el mapa de parqueaderos (Priority: P1) · HU9

Como Usuario necesito visualizar en un mapa interactivo los parqueaderos registrados en la plataforma para
identificar fácilmente las alternativas disponibles en la ciudad.

**Why this priority**: es la puerta de entrada pública y la razón de ser del producto.

**Independent Test**: con al menos 3 parqueaderos (uno activo con celdas, uno inactivo y uno activo con
capacidad 0), abrir la página principal sin sesión y verificar que solo aparece el primero en el mapa y en la
lista.

**Acceptance Scenarios**:

1. **Given** un visitante sin sesión, **When** abre la página principal, **Then** ve el título "Mapa de parqueaderos", el subtítulo "Consulta los parqueaderos registrados y selecciona uno para ver su información detallada.", un mapa interactivo centrado en Medellín con controles de zoom, y la lista "Parqueaderos activos (N)".
2. **Given** parqueaderos en varios estados, **When** se carga el mapa, **Then** solo aparecen (en el mapa y en la lista) los que están en estado Activo **y** tienen capacidad mayor a 0 en algún tipo; los Inactivos o sin celdas no aparecen.
3. **Given** un parqueadero publicado, **When** se muestra en el mapa, **Then** su marcador está en las coordenadas registradas por el administrador.
4. **Given** la lista lateral, **When** se observa cada ítem, **Then** muestra el nombre, la dirección y, por cada tipo atendido, las celdas disponibles y la capacidad total (por ejemplo, "Automóviles 12/20 · Motocicletas 8/15"). La lista se ordena alfabéticamente por nombre.
5. **Given** el mapa, **When** el Usuario busca un campo de búsqueda, filtros o agrupación de marcadores, **Then** no existen (fuera de alcance).
6. **Given** un parqueadero publicado sin celdas disponibles en ningún tipo, **When** se muestra, **Then** su marcador es gris y en la lista aparece la etiqueta "Sin celdas disponibles".
7. **Given** ningún parqueadero publicado, **When** se carga la página, **Then** el mapa se muestra vacío y la lista dice "Aún no hay parqueaderos disponibles."
8. **Given** un error al obtener los datos, **When** se carga la página, **Then** se muestra "No fue posible cargar los parqueaderos. Intenta nuevamente." con el botón "Reintentar", y el mapa sigue visible.
9. **Given** un parqueadero que el administrador acaba de cambiar a Inactivo, **When** el Usuario recarga la página, **Then** ya no aparece. Si la página estaba abierta antes del cambio, sigue viéndose hasta recargar (sin tiempo real).
10. **Given** el encabezado público, **When** se observa, **Then** muestra el logo de MedaPark y el enlace "Acceso administradores"; no hay opciones de sesión de Usuario.

---

### User Story 2 - Consultar el detalle de un parqueadero (Priority: P1) · HU10

Como Usuario necesito consultar la información detallada de un parqueadero al seleccionarlo en el mapa para
decidir si se ajusta a mis necesidades antes de dirigirme allí.

**Why this priority**: sin el detalle, el mapa solo muestra ubicaciones; la decisión del Usuario depende de
la disponibilidad, las tarifas y el horario.

**Independent Test**: seleccionar un parqueadero que atiende ambos tipos y otro que solo atiende uno;
verificar que los datos coinciden exactamente con lo registrado por el administrador.

**Acceptance Scenarios**:

1. **Given** el mapa, **When** el Usuario hace clic en un marcador **o** en un ítem de la lista, **Then** se abre el panel de detalle de ese parqueadero, el marcador se resalta y el mapa se centra en él.
2. **Given** el panel de detalle, **When** se observa, **Then** muestra: nombre, dirección, horario de atención, "Disponibilidad actual de celdas" por tipo atendido (celdas disponibles y capacidad total), "Tarifas configuradas" por tipo atendido ("$ 5.000 por hora"), información de contacto (teléfono, y correo solo si fue registrado) y el botón "Cómo llegar".
3. **Given** un parqueadero que no atiende motocicletas, **When** se ve su detalle, **Then** no aparece información de disponibilidad ni de tarifa de motocicletas.
4. **Given** el panel de detalle, **When** se observa su pie, **Then** se muestra la nota "La información mostrada corresponde al último estado registrado por el administrador."
5. **Given** el panel abierto, **When** el Usuario pulsa la "X", presiona Esc o usa "Atrás" del navegador, **Then** el panel se cierra y el mapa queda sin selección.
6. **Given** el enlace `/?parqueadero=<id>` de un parqueadero publicado, **When** se abre, **Then** el mapa carga con ese detalle abierto; si el parqueadero no está publicado o no existe, se muestra "Este parqueadero ya no está disponible." y el mapa sin selección.
7. **Given** los datos del detalle, **When** se comparan con lo registrado por el administrador (HU3/HU5), **Then** coinciden exactamente (salvo el formato de moneda y de números).

---

### User Story 3 - Generar ruta con Google Maps (Priority: P2) · HU11

Como Usuario necesito generar una ruta hacia el parqueadero seleccionado para llegar fácilmente usando una
aplicación de navegación que ya conozco.

**Why this priority**: completa el recorrido del Usuario, pero el valor principal (encontrar el parqueadero y
ver su disponibilidad) ya lo entregan US1 y US2.

**Independent Test**: abrir el detalle de un parqueadero, pulsar "Cómo llegar" y verificar que se abre Google
Maps con el destino en las coordenadas de ese parqueadero.

**Acceptance Scenarios**:

1. **Given** el detalle de un parqueadero con coordenadas, **When** el Usuario pulsa "Cómo llegar", **Then** se abre Google Maps (en una pestaña nueva en el computador, o la app de Google Maps en el móvil si está instalada) con el destino en la ubicación del parqueadero, listo para calcular la ruta desde la ubicación del Usuario.
2. **Given** el botón "Cómo llegar", **When** se pulsa, **Then** MedaPark permanece abierto en su pestaña con el mismo detalle seleccionado.
3. **Given** un parqueadero sin coordenadas válidas (caso no esperado, ya que son obligatorias), **When** se ve su detalle, **Then** el botón "Cómo llegar" no se muestra.
4. **Given** la integración, **When** se revisa, **Then** MedaPark no calcula tiempos, tráfico ni rutas alternativas; todo eso lo hace Google Maps.

---

### Edge Cases

- **Coordenadas idénticas** de dos parqueaderos: ambos marcadores existen; el que está encima se selecciona con clic, y la lista permite elegir cualquiera.
- **Muchos parqueaderos** (hasta 50): la lista tiene scroll propio; el mapa no agrupa marcadores (sin clustering por alcance).
- **Pantalla móvil (< 768 px)**: el mapa ocupa el ancho completo y la lista se muestra debajo. El detalle se abre como un panel inferior a pantalla completa con botón de cierre.
- **El mapa no carga los mosaicos** (sin conexión al proveedor de mapas): la lista sigue funcionando y desde ella se puede abrir el detalle y "Cómo llegar".
- **Datos desactualizados**: la disponibilidad puede no coincidir con la realidad si el administrador no registró los movimientos; la nota del detalle lo advierte.
- **Un administrador autenticado** que abre la página pública: ve exactamente lo mismo que un visitante anónimo.

## Requirements *(mandatory)*

### Functional Requirements

**Mapa (HU9)**

- **FR-001**: La página principal (`/`) MUST ser accesible sin iniciar sesión ni registrarse.
- **FR-002**: El mapa MUST mostrar un marcador por cada parqueadero **publicable** (estado Activo y capacidad total mayor a 0), en sus coordenadas registradas, y ningún otro.
- **FR-003**: El sistema MUST mostrar la lista "Parqueaderos activos (N)" con los mismos parqueaderos del mapa, ordenados por nombre, con su dirección y su disponibilidad por tipo atendido.
- **FR-004**: Los parqueaderos publicables sin celdas disponibles en ningún tipo MUST distinguirse con un marcador gris y la etiqueta "Sin celdas disponibles".
- **FR-005**: El mapa MUST NOT incluir búsqueda, filtros, agrupación de marcadores ni navegación embebida.
- **FR-006**: El mapa MUST tener controles de zoom e iniciar centrado en Medellín, con todos los parqueaderos a la vista cuando los haya.
- **FR-007**: La información pública MUST NOT exponer datos internos (identidad del administrador, fechas internas, estado de parqueaderos no publicables).

**Detalle (HU10)**

- **FR-008**: Al seleccionar un marcador o un ítem de la lista, el sistema MUST abrir el detalle con: nombre, dirección, horario de atención, disponibilidad actual (disponibles y capacidad total) y tarifa por hora de cada tipo atendido, teléfono, correo (solo si existe) y "Cómo llegar".
- **FR-009**: Si el parqueadero no atiende un tipo de vehículo, MUST NOT mostrarse disponibilidad ni tarifa de ese tipo.
- **FR-010**: El detalle MUST incluir la nota "La información mostrada corresponde al último estado registrado por el administrador."
- **FR-011**: La selección MUST reflejarse en la dirección (`?parqueadero=<id>`). Abrir esa dirección MUST abrir el detalle; si el parqueadero no es publicable o no existe, se muestra "Este parqueadero ya no está disponible.".
- **FR-012**: El detalle MUST poder cerrarse con la "X", con Esc o con "Atrás".

**Ruta (HU11)**

- **FR-013**: "Cómo llegar" MUST abrir Google Maps con el destino en las coordenadas del parqueadero, en una nueva pestaña o en la app según el dispositivo, sin cerrar MedaPark.
- **FR-014**: Si el parqueadero no tiene coordenadas válidas, "Cómo llegar" MUST NOT mostrarse.
- **FR-015**: La integración MUST limitarse a generar el enlace; no se calculan tiempos, tráfico ni rutas dentro de MedaPark.

**Transversales**

- **FR-016**: La información mostrada MUST ser la última guardada al momento de cargar la página; no hay actualización automática en tiempo real.
- **FR-017**: La interfaz MUST estar en español, mostrar tarifas en pesos colombianos ("$ 5.000") y ser utilizable desde 360 px de ancho.
- **FR-018**: La dirección antigua del detalle (`/parking/<id>`) MUST redirigir a `/?parqueadero=<id>`.

### Key Entities

- **Parqueadero publicado** (vista pública): nombre, dirección, latitud, longitud, horario de atención, teléfono, correo de contacto (opcional) y lista de ofertas por tipo atendido.
- **Oferta pública por tipo**: tipo de vehículo, tarifa por hora, capacidad total y celdas disponibles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un Usuario encuentra un parqueadero y ve su disponibilidad en menos de 30 segundos desde que abre la página, sin crear cuenta.
- **SC-002**: La página principal muestra el mapa con los parqueaderos en menos de 3 segundos con una conexión 4G típica.
- **SC-003**: El 100 % de los parqueaderos Inactivos o sin celdas configuradas quedan fuera del mapa y de la lista en la siguiente carga.
- **SC-004**: El 100 % de los datos del detalle coinciden con los registrados por el administrador.
- **SC-005**: "Cómo llegar" abre Google Maps con el destino correcto en el 100 % de los parqueaderos probados (desktop y móvil).

## Desviaciones respecto a las HU y prototipos

| Origen | Elemento | Decisión | Motivo |
|--------|----------|----------|--------|
| Prototipo HU9/HU10/HU11 | Menú lateral (Inicio, Parqueaderos, Usuarios, Reportes, Configuración) y "Usuario / Cerrar sesión" | Excluidos; el encabezado público tiene logo y "Acceso administradores" | Usuario anónimo, sin HU para esas opciones |
| Prototipo HU9 | Marcadores grises de "Parqueadero inactivo" | Excluidos; el gris se usa para "Sin celdas disponibles" | HU9: los inactivos no aparecen |
| Prototipo HU9 | Lista "Parqueaderos activos (N)" | Incluida | Decisión del equipo |
| HU10 | "Botón Cómo llegar solo si tiene enlace o coordenadas" | Siempre visible para los publicados (las coordenadas son obligatorias en HU3); la regla se conserva | Consistencia con HU3 |
| HU9 | "Mapa interactivo" (el prototipo usa estilo Google) | Mapa de OpenStreetMap | Decisión del equipo (sin llave ni costos) |

## Assumptions

- La cantidad de parqueaderos publicados es baja (≤ 50), así que se cargan todos de una vez al abrir la página.
- El back ya expone solo los parqueaderos publicables y sus columnas públicas; esta feature no requiere cambios en la BD.
- El Usuario puede no conceder su ubicación; MedaPark no la solicita (Google Maps la gestiona al calcular la ruta).
- El enlace de Google Maps usa las coordenadas (más precisas que la dirección de texto).
- No hay analítica ni registro de consultas de Usuarios.
