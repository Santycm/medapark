# Feature Specification: Gestión del Parqueadero por el Administrador

**Feature Branch**: `002-gestion-parqueadero`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Gestión del parqueadero por el administrador: registrar, consultar, editar, configurar celdas y gestionar ocupación (HU3–HU7)". Fuentes: `docs/historias-usuario/RQ02v2-historias-usuario-medapark.pdf` (HU3 a HU7), `docs/analisis-mvp.md` (§4 prototipos, §6 inconsistencias, §7 mensajes) y los prototipos `docs/prototipos/HU03-*.jpg` a `HU07-*.jpg`.

## Contexto

Un Administrador de Parqueadero **completamente autenticado** (ambos factores, feature 001) gestiona su
**único** parqueadero: lo registra, consulta su información en un panel, la edita (incluido el estado
Activo/Inactivo), configura la cantidad de celdas por tipo de vehículo y registra ingresos y salidas para
mantener actualizada la disponibilidad que verán los Usuarios en el mapa público (feature 003).

Las celdas se manejan como **conteos agregados por tipo de vehículo** (automóviles y motocicletas). No
existen celdas individuales, placas ni historial de movimientos.

**Dependencias**: feature 001 (sesión completa, layout administrativo y protección de rutas) y el **back
existente** de Supabase, administrado por el equipo (`docs/supabase-esquema-actual.md`). El diseño funciona con el back
tal como está, sin cambios (la solicitud **CB-001** de permisos de escritura resultó no requerida).
El back ya garantiza: un parqueadero por administrador, acceso solo del dueño con sesión completa,
`0 ≤ ocupadas ≤ capacidad`, tarifa > 0, crear un tipo solo con capacidad > 0, eliminar un tipo solo con capacidad
y ocupadas en 0, y el registro atómico de ingresos y salidas.

## Clarifications

### Session 2026-10-17

- Q: ¿Cómo se validan las coordenadas (redacción ambigua de HU3)? → A: se acepta el rango global (latitud −90 a 90, longitud −180 a 180). Si el punto queda fuera del área metropolitana del Valle de Aburrá, se muestra un **aviso no bloqueante** "La ubicación está fuera de Medellín. Verifica las coordenadas."
- Q: ¿Se cargan datos de demostración (parqueaderos de ejemplo)? → A: **No.** Solo existen los parqueaderos que los administradores registren desde la aplicación.
- Q: ¿El formulario de registro/edición incluye mapa para ubicar el parqueadero? → A: sí, un mapa selector (clic o arrastre del marcador para llenar latitud y longitud), sin buscador ni geocodificación. Los campos de latitud y longitud siguen siendo editables a mano.
- Q: ¿La configuración de celdas (HU6) tiene pantalla propia? → A: sí, la pantalla "Configurar celdas" con controles +/−, además de los campos de capacidad en los formularios de registro y edición.
- Q: ¿Se registra la placa en la gestión de ocupación (HU7)? → A: no. Fuera de alcance.
- Q: ¿Se puede modificar la base de datos para soportar esta feature? → A: el diseño se adapta al back existente. Cualquier cambio en el back es 🔴 CRITICIDAD ALTA y requiere un check de autorización (`docs/cambios-back/`). No hizo falta ningún cambio: la solicitud **CB-001** (permisos INSERT/UPDATE del administrador) resultó no requerida. Las reglas que el back no expresa se validan en el front.
- Q: ¿Qué capacidad mínima tiene un tipo de vehículo al registrarlo o agregarlo? → A: 1 celda (HU6: "enteros mayores a cero"; el back no permite crear un tipo con 0). Un tipo existente sí puede bajar a 0 después (HU6), siempre que no tenga celdas ocupadas.
- Q: ¿El guardado de la edición es atómico? → A: el back no ofrece una operación atómica para la edición, así que el front valida **todas** las reglas con datos recién leídos antes de escribir y guarda en un orden que minimiza los estados intermedios. Si un paso falla, se informa y se recarga la información.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar mi parqueadero (Priority: P1) · HU3

Como Administrador de Parqueadero necesito registrar la información básica de mi parqueadero para configurar
el establecimiento que administraré y permitir su consulta posterior por parte de los Usuarios.

**Why this priority**: sin un parqueadero registrado no existe ninguna otra funcionalidad de gestión ni de
consulta pública.

**Independent Test**: con un administrador sin parqueadero, completar el formulario (con y sin errores),
guardar y verificar que el parqueadero queda asociado a la cuenta en estado Activo y que la opción de
registro desaparece.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado sin parqueadero, **When** abre "Registrar parqueadero", **Then** ve el formulario con: Nombre*, Dirección*, Latitud*, Longitud*, mapa selector, Teléfono de contacto*, Correo electrónico de contacto (opcional), Horario de atención*, Tipos de vehículo atendidos* (Automóviles, Motocicletas) y los botones "Cancelar" y "Guardar".
2. **Given** el formulario, **When** marca "Automóviles", **Then** aparecen los campos obligatorios "Tarifa por hora (Automóviles)" y "Capacidad de celdas (Automóviles)" (mínimo 1); si desmarca el tipo, esos campos desaparecen. Lo mismo aplica a "Motocicletas".
3. **Given** campos obligatorios vacíos, **When** pulsa "Guardar", **Then** no se guarda, cada campo faltante se resalta en rojo con su mensaje y se muestra "Debe completar los campos obligatorios".
4. **Given** el teléfono "300-123 45ab", **When** sale del campo o guarda, **Then** se muestra "Solo se permiten caracteres numéricos." y no se guarda.
5. **Given** el correo de contacto "contacto@dominio", **When** sale del campo o guarda, **Then** se muestra "Debe tener un formato de correo electrónico válido." y no se guarda. Si el correo queda vacío, se guarda sin error.
6. **Given** latitud "95" o longitud "-181" o texto no numérico, **When** guarda, **Then** se muestra "Rango válido: -90 a 90." o "Rango válido: -180 a 180." respectivamente y no se guarda.
7. **Given** coordenadas válidas fuera del Valle de Aburrá (por ejemplo, 4.7110, -74.0721), **When** se ingresan, **Then** se muestra el aviso "La ubicación está fuera de Medellín. Verifica las coordenadas." y **sí** se permite guardar.
8. **Given** el mapa selector, **When** el administrador hace clic en un punto o arrastra el marcador, **Then** Latitud y Longitud se llenan con ese punto (6 decimales). Si escribe coordenadas válidas, el marcador se mueve a ellas.
9. **Given** todos los datos válidos, **When** pulsa "Guardar", **Then** se muestra "Parqueadero registrado exitosamente", el parqueadero queda asociado a su cuenta en estado **Activo**, con 0 celdas ocupadas por tipo, y el administrador llega al panel (US2).
13. **Given** una capacidad de 0 para un tipo marcado, **When** pulsa "Guardar", **Then** se muestra "Ingresa un valor entero entre 1 y 9.999." en ese campo y no se guarda.
10. **Given** un administrador que ya tiene parqueadero, **When** intenta abrir "Registrar parqueadero" (botón o URL), **Then** la opción no está disponible y es redirigido a su panel.
11. **Given** un parqueadero cuyos tipos quedaron luego con capacidad 0 (US5), **When** se consulta el mapa público, **Then** no aparece hasta que vuelva a tener al menos un tipo con capacidad mayor a 0.
12. **Given** el formulario con datos, **When** pulsa "Cancelar", **Then** se descartan los datos y vuelve al panel (que muestra la opción "Registrar parqueadero").

---

### User Story 2 - Consultar mi parqueadero (panel de gestión) (Priority: P1) · HU4

Como Administrador de Parqueadero necesito acceder al panel de gestión de mi parqueadero después de iniciar
sesión para consultar su información general y acceder a las funciones de gestión.

**Why this priority**: es el destino tras el login y el centro de navegación de toda la gestión.

**Independent Test**: entrar con un administrador sin parqueadero (debe ver el llamado a registrar) y con uno
que sí tiene (debe ver toda su información en modo lectura, la disponibilidad por tipo y los accesos).

**Acceptance Scenarios**:

1. **Given** un administrador sin parqueadero, **When** llega al panel, **Then** ve un estado vacío con el botón "Registrar parqueadero" y **no** ve "Gestionar ocupación", "Editar información" ni "Configurar celdas".
2. **Given** un administrador con parqueadero, **When** llega al panel "Mi parqueadero", **Then** ve en modo lectura: nombre, estado (Activo/Inactivo), dirección, latitud y longitud, teléfono, correo de contacto (o "No registrado"), horario de atención y tarifas por hora de cada tipo atendido.
3. **Given** un parqueadero que atiende automóviles con 20 celdas y 5 ocupadas, **When** se ve la sección "Disponibilidad por tipo de vehículo", **Then** muestra "Automóviles: 15 disponibles / 20". Los tipos no atendidos no se muestran.
4. **Given** el panel con parqueadero, **When** pulsa "Editar información", **Then** abre el formulario de edición (US4); **When** pulsa "Gestionar ocupación", **Then** abre la gestión de ocupación (US3); **When** pulsa "Configurar celdas", **Then** abre la configuración de celdas (US5).
5. **Given** un parqueadero cuya capacidad total es 0 en todos sus tipos, **When** se ve el panel, **Then** "Gestionar ocupación" aparece deshabilitado con la nota "Configura las celdas para gestionar la ocupación" y se muestra el aviso "Tu parqueadero no aparece en el mapa público porque no tiene celdas configuradas."
6. **Given** un parqueadero en estado Inactivo, **When** se ve el panel, **Then** se muestra el aviso "Tu parqueadero está inactivo y no aparece en el mapa público."
7. **Given** dos administradores A y B, **When** A consulta su panel, **Then** nunca ve datos del parqueadero de B, ni siquiera manipulando la URL o las peticiones.

---

### User Story 3 - Gestionar ocupación (Priority: P2) · HU7

Como Administrador de Parqueadero necesito registrar el ingreso y la salida de vehículos para mantener
actualizada la cantidad de celdas ocupadas y disponibles que consultan los Usuarios.

**Why this priority**: es la operación diaria que da valor al Usuario (disponibilidad). Requiere un
parqueadero registrado (US1).

**Independent Test**: con un parqueadero de 2 celdas de automóvil, registrar 2 ingresos (el botón se
deshabilita y aparece el mensaje), luego 2 salidas (se deshabilita "Registrar salida") y comprobar que los
conteos se ven en el panel.

**Acceptance Scenarios**:

1. **Given** un parqueadero que atiende ambos tipos, **When** abre "Gestionar ocupación", **Then** ve para cada tipo atendido la capacidad total, las celdas ocupadas y las disponibles, y dos bloques: "Registrar ingreso" y "Registrar salida", cada uno con selector de "Tipo de vehículo*" (Automóvil/Motocicleta) y su botón. También ve la opción "Volver al panel".
2. **Given** automóviles con capacidad 50 y 32 ocupadas, **When** registra un ingreso de automóvil, **Then** las ocupadas pasan a 33 y las disponibles a 17 de inmediato, y el cambio queda guardado.
3. **Given** automóviles con 0 disponibles, **When** selecciona "Automóvil" en "Registrar ingreso", **Then** el botón "Registrar ingreso" está deshabilitado y se muestra "No hay celdas disponibles de este tipo".
4. **Given** motocicletas con 12 ocupadas, **When** registra una salida de motocicleta, **Then** las ocupadas pasan a 11 y las disponibles aumentan en 1.
5. **Given** motocicletas con 0 ocupadas, **When** selecciona "Motocicleta" en "Registrar salida", **Then** el botón está deshabilitado y se muestra "No hay celdas ocupadas de este tipo para liberar".
6. **Given** un parqueadero que solo atiende automóviles, **When** abre la pantalla, **Then** no se muestra nada relativo a motocicletas y el selector de tipo queda fijo en "Automóvil".
7. **Given** la misma cuenta abierta en dos pestañas con 1 celda disponible, **When** registra un ingreso en ambas casi a la vez, **Then** solo uno se aplica; el otro muestra "No hay celdas disponibles de este tipo" y los conteos se actualizan al valor real.
8. **Given** un parqueadero sin capacidad configurada (todos los tipos en 0), **When** intenta abrir "Gestionar ocupación" por URL, **Then** ve el mensaje "Configura las celdas para gestionar la ocupación" con un enlace a "Configurar celdas".
9. **Given** un ingreso o salida registrado, **When** el administrador vuelve al panel, **Then** ve la disponibilidad actualizada; y un Usuario que cargue o recargue el mapa público ve el último estado guardado (sin actualización en tiempo real).
10. **Given** un parqueadero en estado Inactivo, **When** el administrador gestiona la ocupación, **Then** puede registrar ingresos y salidas normalmente.

---

### User Story 4 - Editar mi parqueadero (Priority: P2) · HU5

Como Administrador de Parqueadero necesito actualizar la información de mi parqueadero, incluido su estado
Activo/Inactivo, para mantener los datos publicados correctos y vigentes.

**Why this priority**: mantiene la información pública correcta y permite ocultar el parqueadero (Inactivo).

**Independent Test**: editar el nombre y el horario, cambiar a Inactivo, guardar y comprobar el mensaje, el
panel actualizado y que el parqueadero deja de ser publicable. Intentar quitar un tipo con celdas y reducir
la capacidad por debajo de las ocupadas.

**Acceptance Scenarios**:

1. **Given** un administrador con parqueadero, **When** abre "Editar información", **Then** ve el formulario de US1 precargado con los datos actuales más el campo "Estado del parqueadero" (opciones "Activo: El parqueadero aparece en el mapa y está disponible para los usuarios." e "Inactivo: El parqueadero no aparece en el mapa y no está disponible.") y los botones "Cancelar" y "Guardar cambios".
2. **Given** cambios válidos, **When** pulsa "Guardar cambios", **Then** se muestra "Información actualizada exitosamente" y vuelve al panel con los datos actualizados en modo lectura.
3. **Given** un campo obligatorio vaciado, **When** pulsa "Guardar cambios", **Then** se muestra "Debe completar los campos obligatorios", el campo se resalta en rojo y no se guarda nada.
4. **Given** "Motocicletas" atendido con capacidad guardada 20, **When** intenta desmarcarlo, **Then** se muestra la advertencia "Debe reducir a cero las celdas de este tipo de vehículo antes de quitarlo de los tipos atendidos" y el tipo permanece marcado.
5. **Given** "Motocicletas" atendido con capacidad guardada 0, **When** lo desmarca y guarda, **Then** el parqueadero deja de atender motocicletas y su tarifa y capacidad se eliminan.
6. **Given** un único tipo atendido con capacidad guardada 0, **When** lo desmarca y pulsa "Guardar cambios", **Then** no se guarda, "Tipos de vehículo atendidos" se resalta en rojo y se muestra "Debe completar los campos obligatorios" (debe quedar al menos un tipo).
7. **Given** automóviles con 32 ocupadas, **When** cambia la capacidad de automóviles a 30 y guarda, **Then** se muestra "No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas" y no se guarda **ningún** cambio del formulario (la validación ocurre antes de escribir, con datos recién leídos).
8. **Given** el estado cambiado a Inactivo y guardado, **When** un Usuario carga el mapa público, **Then** el parqueadero no aparece en el mapa ni en ninguna consulta pública. Al volver a Activo (con capacidad > 0) vuelve a aparecer.
9. **Given** latitud o longitud modificadas y guardadas, **When** se consulta el mapa público o "Cómo llegar", **Then** se usa la nueva ubicación.
10. **Given** cambios sin guardar, **When** pulsa "Cancelar", **Then** se descartan y vuelve al panel con la información previa intacta.
11. **Given** un tipo nuevo marcado durante la edición (por ejemplo, Motocicletas), **When** guarda, **Then** su tarifa y su capacidad (mínimo 1) son obligatorias y el tipo inicia con 0 ocupadas.

---

### User Story 5 - Configurar celdas del parqueadero (Priority: P3) · HU6

Como Administrador de Parqueadero necesito registrar la cantidad total de celdas para automóviles y
motocicletas para que el sistema calcule y muestre la disponibilidad a los Usuarios.

**Why this priority**: la capacidad ya se puede definir en el registro y en la edición (US1/US4); esta
pantalla dedicada es un acceso rápido y fiel al prototipo HU06.

**Independent Test**: abrir "Configurar celdas", aumentar y disminuir con +/−, intentar reducir por debajo
de las ocupadas y guardar valores válidos; verificar el total y el panel.

**Acceptance Scenarios**:

1. **Given** un parqueadero que atiende ambos tipos, **When** abre "Configurar celdas", **Then** ve el encabezado del parqueadero (nombre, dirección, coordenadas, estado), una tarjeta por tipo atendido con "Cantidad total de celdas" y controles −/+ con campo numérico, la nota "Valor numérico entero mayor o igual a 0.", el resumen "Total de celdas configuradas" y los botones "Cancelar" y "Guardar cambios".
2. **Given** un parqueadero que no atiende motocicletas, **When** abre la pantalla, **Then** no se muestra la tarjeta de motocicletas.
3. **Given** un valor 0, **When** pulsa "−", **Then** el valor permanece en 0 (el botón queda deshabilitado). Valores decimales, negativos o no numéricos no se aceptan.
4. **Given** automóviles con 32 ocupadas, **When** fija 30 y guarda, **Then** se muestra "No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas" y no se guarda el cambio.
5. **Given** motocicletas con 0 ocupadas, **When** fija 0 y guarda, **Then** se guarda; si ningún tipo tiene capacidad mayor a 0, el parqueadero deja de aparecer en el mapa público.
6. **Given** valores válidos, **When** pulsa "Guardar cambios", **Then** se muestra "Celdas actualizadas exitosamente", la disponibilidad se recalcula (disponibles = capacidad − ocupadas) y vuelve al panel.
7. **Given** cambios sin guardar, **When** pulsa "Cancelar", **Then** se descartan y vuelve al panel.

---

### Edge Cases

- **Sesión de solo primer factor o vencida** al guardar o registrar: el servidor rechaza la operación y el administrador es redirigido a "Iniciar sesión" (feature 001), sin cambios en los datos.
- **Registro duplicado** (dos pestañas pulsan "Guardar" en el registro a la vez): el back solo permite un parqueadero por cuenta; la segunda muestra "Ya tienes un parqueadero registrado." y redirige al panel.
- **Registro incompleto**: si el parqueadero se crea pero falla el guardado de sus tipos de vehículo, se muestra "El parqueadero se registró, pero no se pudieron guardar los tipos de vehículo. Agrégalos desde Editar información." El panel muestra ese parqueadero con el aviso "Tu parqueadero no tiene tipos de vehículo configurados." y el acceso a "Editar información".
- **Guardado parcial en la edición**: si un paso del guardado falla después de que otro tuvo éxito (red o permisos), se muestra "Algunos cambios no se pudieron guardar. Revisa la información e intenta nuevamente." y el formulario se recarga con los datos reales del servidor.
- **Permisos del back**: si el back rechaza una operación por permisos, se muestra "No tienes permisos para realizar esta acción. Contacta al administrador del sistema." y no cambia nada en pantalla (el mensaje existe por seguridad; con los permisos actuales del back el administrador no lo ve en el flujo normal).
- **Edición concurrente** en dos pestañas: gana la última en guardar (no hay bloqueo optimista en el MVP), excepto las reglas de capacidad y ocupación, que siempre se validan contra el valor actual del servidor.
- **Ocupación cambió mientras se editaba la capacidad**: la validación "capacidad ≥ ocupadas" se evalúa en el servidor al guardar; si falla, se muestra el mensaje de HU6 y se recargan los valores.
- **El mapa selector no carga** (sin internet hacia los mosaicos): el formulario sigue siendo usable escribiendo latitud y longitud a mano.
- **Coordenadas con coma decimal** ("6,2442"): se normaliza la coma a punto antes de validar.
- **Espacios** al inicio o al final de los textos: se eliminan antes de validar y guardar; un campo con solo espacios cuenta como vacío.
- **Tarifas**: se ingresan como enteros en pesos colombianos (sin decimales ni separadores); se muestran con separador de miles (`$ 5.000`).
- **Error de red** al guardar o registrar movimientos: "No fue posible conectar con el servidor. Intenta nuevamente."; el formulario conserva lo digitado y los conteos no cambian en pantalla hasta confirmar con el servidor.
- **Doble clic** en "Guardar" o en un botón de ingreso o salida: mientras la petición está en curso el botón queda deshabilitado; cada clic que se completa equivale a un movimiento.

## Requirements *(mandatory)*

### Functional Requirements

**Generales y seguridad (HU3–HU7)**

- **FR-001**: Todas las funcionalidades de esta feature MUST requerir una sesión completamente autenticada (ambos factores). Sin ella, el administrador es redirigido a "Iniciar sesión".
- **FR-002**: Cada cuenta de administrador MUST tener **como máximo un** parqueadero, asociado a la cuenta de forma permanente. El sistema MUST impedir en el servidor la creación de un segundo parqueadero.
- **FR-003**: El administrador MUST poder consultar y modificar **solo** su propio parqueadero. El servidor MUST rechazar cualquier lectura o escritura sobre parqueaderos de otros administradores, aunque se manipulen las peticiones.
- **FR-004**: La invariante `0 ≤ ocupadas ≤ capacidad` la garantiza el back; el front MUST respetarla y prevenir los intentos inválidos. "Al menos un tipo atendido" y los formatos de teléfono y longitud de textos MUST validarse en el front (el back no los expresa).
- **FR-005**: Los textos de error y confirmación citados en las HU MUST mostrarse literalmente (`docs/analisis-mvp.md` §7).

**Registro (HU3)**

- **FR-006**: El formulario de registro MUST incluir: Nombre del parqueadero (obligatorio, 3–100 caracteres), Dirección (obligatorio, 5–200), Latitud y Longitud (obligatorios, numéricos con hasta 6 decimales), Teléfono de contacto (obligatorio, solo dígitos, 7–10), Correo electrónico de contacto (opcional, formato válido), Horario de atención (obligatorio, texto libre de 3–120 caracteres), Tipos de vehículo atendidos (obligatorio, al menos uno de Automóviles y Motocicletas) y, por cada tipo marcado, Tarifa por hora (obligatoria, entero en COP de 1 a 999.999) y Capacidad de celdas (obligatoria, entero de **1** a 9.999 al registrar o agregar un tipo; de 0 a 9.999 al editar un tipo ya existente).
- **FR-007**: Si falta algún campo obligatorio al guardar, el sistema MUST mostrar "Debe completar los campos obligatorios" y resaltar en rojo cada campo faltante.
- **FR-008**: Teléfono con caracteres no numéricos → "Solo se permiten caracteres numéricos."; correo de contacto inválido → "Debe tener un formato de correo electrónico válido."; latitud fuera de −90..90 → "Rango válido: -90 a 90."; longitud fuera de −180..180 → "Rango válido: -180 a 180.".
- **FR-009**: Si las coordenadas válidas quedan fuera del área del Valle de Aburrá (latitud 6.00 a 6.50 y longitud −75.75 a −75.30), el sistema MUST mostrar el aviso no bloqueante "La ubicación está fuera de Medellín. Verifica las coordenadas.".
- **FR-010**: El formulario MUST incluir un mapa selector centrado en Medellín que, al hacer clic o arrastrar el marcador, llene Latitud y Longitud. No se ofrece búsqueda de direcciones.
- **FR-011**: Al guardar con éxito, el sistema MUST crear el parqueadero en estado **Activo**, con 0 celdas ocupadas por tipo, asociado al administrador autenticado; mostrar "Parqueadero registrado exitosamente" y llevar al panel. Si el parqueadero se crea pero sus tipos no, aplica el caso límite "Registro incompleto".
- **FR-012**: La opción "Registrar parqueadero" MUST estar disponible solo para administradores sin parqueadero; en otro caso, la ruta redirige al panel.

**Panel (HU4)**

- **FR-013**: El panel MUST mostrar en modo lectura todos los datos del parqueadero, su estado y, por cada tipo atendido, "<Tipo>: <disponibles> disponibles / <capacidad>" y la tarifa por hora.
- **FR-014**: Sin parqueadero registrado, el panel MUST mostrar solo la opción "Registrar parqueadero"; "Gestionar ocupación", "Editar información" y "Configurar celdas" MUST NOT estar disponibles.
- **FR-015**: El panel MUST avisar cuando el parqueadero no es visible públicamente y por qué (Inactivo, o sin celdas configuradas).
- **FR-016**: El menú lateral MUST incluir "Mi parqueadero", "Gestionar ocupación" y "Configurar celdas"; las dos últimas solo cuando existe parqueadero.

**Edición (HU5)**

- **FR-017**: El formulario de edición MUST permitir modificar todos los campos de HU3 más el Estado (Activo/Inactivo), con las mismas validaciones.
- **FR-018**: El sistema MUST impedir desmarcar un tipo de vehículo cuya capacidad **guardada** sea mayor a 0, mostrando "Debe reducir a cero las celdas de este tipo de vehículo antes de quitarlo de los tipos atendidos".
- **FR-019**: Antes de escribir, el sistema MUST volver a leer el parqueadero y validar **todas** las reglas (capacidad ≥ ocupadas, tipos a quitar con capacidad guardada 0, al menos un tipo, capacidad ≥ 1 en los tipos nuevos). Si alguna falla, no se escribe nada. Si todas pasan, guarda primero los cambios de los tipos y después los datos generales; ante un fallo intermedio aplica el caso límite "Guardado parcial".
- **FR-020**: Al guardar con éxito: "Información actualizada exitosamente" y retorno al panel. "Cancelar" descarta los cambios.
- **FR-021**: Un parqueadero Inactivo MUST dejar de ser publicable de inmediato. Al volver a Activo, es publicable de nuevo si tiene capacidad mayor a 0 en algún tipo.

**Celdas (HU6)**

- **FR-022**: La pantalla "Configurar celdas" MUST mostrar solo los tipos atendidos, con un valor entero ≥ 0 editable por campo y controles −/+, además del total configurado.
- **FR-023**: La capacidad de un tipo MUST NOT quedar por debajo de sus celdas ocupadas; si se intenta, "No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas" y no se guarda.
- **FR-024**: Al guardar con éxito: "Celdas actualizadas exitosamente", recálculo de disponibles y retorno al panel.

**Ocupación (HU7)**

- **FR-025**: La pantalla "Gestionar ocupación" MUST mostrar, por cada tipo atendido, la capacidad total, las ocupadas y las disponibles (disponibles = capacidad − ocupadas).
- **FR-026**: "Registrar ingreso" MUST aumentar en 1 las ocupadas del tipo seleccionado, solo si hay disponibles; si no, el botón está deshabilitado y se muestra "No hay celdas disponibles de este tipo".
- **FR-027**: "Registrar salida" MUST disminuir en 1 las ocupadas del tipo seleccionado, solo si hay ocupadas; si no, el botón está deshabilitado y se muestra "No hay celdas ocupadas de este tipo para liberar".
- **FR-028**: Cada ingreso o salida MUST aplicarse de forma atómica en el servidor (sin perder ni duplicar movimientos ante clics concurrentes) y guardarse de inmediato; la pantalla muestra los conteos devueltos por el servidor.
- **FR-029**: La gestión de ocupación MUST requerir un parqueadero con capacidad mayor a 0 en al menos un tipo; en caso contrario, se muestra el aviso con el enlace a "Configurar celdas".
- **FR-030**: No se registran placas ni historial de movimientos.

### Key Entities

- **Parqueadero**: establecimiento de un único administrador. Atributos: nombre, estado (activo/inactivo), dirección, latitud, longitud, teléfono, correo de contacto (opcional), horario de atención, fechas de creación y actualización.
- **Configuración por tipo de vehículo**: lo que un parqueadero ofrece para un tipo (automóvil o motocicleta). Atributos: tarifa por hora (COP), capacidad total y celdas ocupadas. Existe solo para los tipos atendidos (1 o 2 por parqueadero). Las disponibles se calculan como capacidad − ocupadas.
- **Administrador**: cuenta de la feature 001; dueño de 0 o 1 parqueadero.
- **Publicabilidad** (regla derivada): un parqueadero es visible al público si está Activo y la suma de sus capacidades es mayor a 0.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador registra su parqueadero completo (ambos tipos) en menos de 5 minutos.
- **SC-002**: Registrar un ingreso o una salida toma como máximo 2 interacciones (elegir el tipo y pulsar), y el conteo actualizado se ve en menos de 2 segundos.
- **SC-003**: En 100 movimientos concurrentes simulados sobre un mismo tipo, las ocupadas nunca superan la capacidad ni bajan de 0, y el conteo final coincide con los movimientos aceptados.
- **SC-004**: El 100 % de los intentos de leer o modificar el parqueadero de otro administrador son rechazados por el servidor.
- **SC-005**: El 100 % de los mensajes citados en HU3–HU7 aparecen con su texto exacto en los casos probados.
- **SC-006**: Tras cambiar a Inactivo (o dejar la capacidad total en 0), el parqueadero deja de figurar en la consulta pública en la siguiente carga del mapa.

## Desviaciones e interpretaciones respecto a las HU

| HU | Texto original | Interpretación especificada | Motivo |
|----|----------------|------------------------------|--------|
| HU7 | "La cantidad de celdas ocupadas debe superar la capacidad total" | **No debe** superar la capacidad | Errata evidente |
| HU7 | "La cantidad de celdas ocupadas debe ser inferior a cero" | **No debe** ser inferior a cero | Errata evidente |
| HU7 | Campo "Registrar placa" | Excluido | Sin historial; no aparece en el prototipo (decisión del equipo) |
| HU6 | "Valores enteros mayores a cero" y "se puede actualizar a 0" | ≥ 1 al crear un tipo; ≥ 0 al actualizar un tipo existente, sujeto a capacidad ≥ ocupadas | Contradicción interna; el back no permite crear un tipo con capacidad 0 |
| HU5 | Guardado de la edición (implícitamente atómico) | Validación previa completa + guardado secuencial con manejo de guardado parcial | El back (sin cambios) no ofrece una operación atómica para la edición |
| HU7/HU8 | Refieren el panel como "HU3" | El panel es la HU4 | Errata de referencia |
| HU3 | "No se muestra en un mapa propio de edición" | Se incluye el mapa selector (sin geocodificación) | Decisión del equipo según el prototipo |
| HU3 | Campo "Estado" en el registro | No se muestra en el registro; siempre inicia Activo. Se cambia en HU5 | La HU indica "Activo por defecto"; el prototipo de HU3 no lo muestra |
| HU5 | El prototipo marca el correo de contacto como obligatorio | Opcional | Prevalece el texto (HU3/HU5) |
| HU5 | "Los mismos campos de HU4" | Los campos editables de HU3 más el Estado | HU4 es de solo lectura |
| HU6 | Mensaje de éxito no definido | "Celdas actualizadas exitosamente" | Necesario para la retroalimentación |
| HU4 | Avisos de visibilidad y "Configurar celdas" en el panel | Agregados | Derivados de HU3, HU5, HU6 y HU9, y del prototipo HU08 |

## Assumptions

- Moneda: pesos colombianos (COP), enteros, solo tarifa por hora (sin fracciones, días ni mensualidades).
- El área de referencia "Medellín" para el aviso de coordenadas es el rectángulo aproximado del Valle de Aburrá: latitud 6.00–6.50, longitud −75.75 a −75.30.
- No hay carga de datos de ejemplo desde este proyecto. El back ya tiene parqueaderos de prueba cargados por el equipo; para la demo se usan esos o se registran desde la aplicación.
- El back ya permite al administrador autenticado crear y editar su parqueadero: la solicitud **CB-001** resultó no requerida (se verificó en la prueba manual).
- La edición concurrente del mismo parqueadero en dos pestañas es improbable (un solo administrador); se acepta "gana el último" salvo las reglas de capacidad y ocupación.
- No se requiere eliminar un parqueadero; para retirarlo de la consulta pública se usa el estado Inactivo.
- El teléfono admite fijos y celulares colombianos sin indicativo (7 a 10 dígitos).
