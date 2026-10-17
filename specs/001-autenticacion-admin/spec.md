# Feature Specification: Autenticación del Administrador de Parqueadero

**Feature Branch**: `001-autenticacion-admin`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Autenticación del administrador de parqueadero con MFA TOTP y cierre de sesión (HU1, HU2, HU8)". Fuentes: `docs/historias-usuario/RQ02v2-historias-usuario-medapark.pdf` (HU1, HU2, HU8), `docs/analisis-mvp.md` (§5 MFA, §7 mensajes, §8 rutas) y los prototipos `docs/prototipos/HU01-*.jpg`, `HU02-*.jpg` y `HU08-*.jpg`.

## Contexto

MedaPark tiene **una sola puerta de entrada autenticada**, la del Administrador de Parqueadero. Las cuentas
las crea manualmente el equipo de desarrollo; no hay registro público, recuperación ni cambio de contraseña.
El acceso exige **dos factores**: correo y contraseña, y un código de verificación de 6 dígitos que genera
una **app autenticadora** (TOTP) en el teléfono del administrador. El Usuario público nunca inicia sesión.

Esta feature entrega además la **estructura base del área administrativa**: encabezado con la identidad del
administrador y "Cerrar sesión", menú lateral, protección de rutas y un panel inicial. El contenido funcional
del panel (HU4) y las demás pantallas de gestión se especifican en `002-gestion-parqueadero`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Iniciar sesión con correo y contraseña (Priority: P1) · HU1

Como Administrador de Parqueadero necesito iniciar sesión con mi correo y mi contraseña para empezar el
acceso a la gestión de mi parqueadero.

**Why this priority**: es la única puerta de entrada al sistema administrativo. Sin ella no existe ninguna
otra funcionalidad de administración.

**Independent Test**: con una cuenta de administrador creada por el equipo, ingresar credenciales válidas y
comprobar que el sistema pasa al segundo factor. Con credenciales inválidas o campos vacíos, comprobar los
mensajes y que no se avanza.

**Acceptance Scenarios**:

1. **Given** la pantalla "Iniciar sesión" con los campos vacíos, **When** el administrador pulsa "Ingresar", **Then** no se intenta autenticar, cada campo vacío se marca en rojo con su mensaje de obligatoriedad y se muestra "Debe completar los campos requeridos".
2. **Given** el correo "admin@dominio" o "admin.com", **When** el campo pierde el foco o se pulsa "Ingresar", **Then** se muestra "Verificar correo electrónico" bajo el campo y no se intenta autenticar.
3. **Given** un correo con formato válido y una contraseña que no coinciden con ninguna cuenta, **When** se pulsa "Ingresar", **Then** se muestra "El correo electrónico o la contraseña son incorrectos", la contraseña se limpia y el correo se conserva.
4. **Given** credenciales correctas de un administrador que **ya configuró** su app autenticadora, **When** se pulsa "Ingresar", **Then** el sistema lleva a la pantalla "Verificación en dos pasos" (US2) y **no** da acceso al panel.
5. **Given** credenciales correctas de un administrador que **aún no configuró** su app autenticadora, **When** se pulsa "Ingresar", **Then** el sistema lleva a la pantalla "Configurar verificación en dos pasos" (US2, escenario de enrolamiento).
6. **Given** la pantalla de inicio de sesión, **When** se observa su contenido, **Then** no existen opciones "Registrarse", "¿Olvidaste tu contraseña?" ni similares.
7. **Given** el campo contraseña con texto, **When** se pulsa el ícono de ojo, **Then** la contraseña se muestra u oculta alternadamente.
8. **Given** que se pulsó "Ingresar" y la verificación está en curso, **When** el administrador vuelve a pulsar el botón, **Then** no se envía una segunda solicitud (el botón queda deshabilitado con un indicador de carga).

---

### User Story 2 - Verificar identidad con segundo factor (Priority: P1) · HU2

Como Administrador de Parqueadero necesito verificar mi identidad con un código de mi app autenticadora
después de ingresar correo y contraseña, para aumentar la seguridad de acceso al panel. La primera vez debo
vincular mi app autenticadora escaneando un código QR.

**Why this priority**: la HU2 la exige para considerar completa la autenticación; sin ella el administrador
no puede entrar al panel. Comparte la prioridad P1 con la US1 porque ambas son necesarias para el primer
acceso.

**Independent Test**: con una cuenta sin factor configurado, completar el enrolamiento escaneando el QR y
validar un código. Luego cerrar sesión, volver a entrar y verificar con un código vigente, uno incorrecto y
uno expirado. Comprobar que solo el código correcto da acceso al panel.

**Acceptance Scenarios**:

*Enrolamiento (primera vez)*

1. **Given** un administrador que superó el primer factor y no tiene app autenticadora vinculada, **When** llega a "Configurar verificación en dos pasos", **Then** ve las instrucciones, un código QR, la clave para ingreso manual y un campo obligatorio "Código de verificación" de 6 dígitos.
2. **Given** la pantalla de enrolamiento, **When** el administrador escanea el QR, ingresa el código de 6 dígitos que muestra su app y pulsa "Verificar código", **Then** la app queda vinculada, la autenticación se completa y el administrador llega al panel de gestión.
3. **Given** la pantalla de enrolamiento, **When** ingresa un código incorrecto, **Then** se muestra "El código de verificación es incorrecto" y la app **no** queda vinculada.
4. **Given** un administrador que abandonó el enrolamiento sin completarlo, **When** vuelve a iniciar sesión, **Then** se le presenta un enrolamiento nuevo con un QR nuevo; el intento anterior no queda utilizable.

*Verificación (inicios de sesión siguientes)*

5. **Given** un administrador con app vinculada que superó el primer factor, **When** llega a "Verificación en dos pasos", **Then** ve el correo con el que inició sesión, el campo "Código de verificación" (6 dígitos), el botón "Verificar código", la indicación "Abre tu app autenticadora para ver un código nuevo" y la opción "Volver al inicio de sesión".
6. **Given** el código vigente que muestra la app, **When** pulsa "Verificar código", **Then** la autenticación se completa y llega al panel de gestión.
7. **Given** un código que no corresponde, **When** pulsa "Verificar código", **Then** se muestra "El código de verificación es incorrecto", el campo se limpia y no hay acceso al panel.
8. **Given** que la solicitud de verificación pendiente venció (el administrador dejó la pantalla abierta más de lo permitido), **When** pulsa "Verificar código", **Then** se muestra "El código de verificación ha expirado. Solicita uno nuevo." y el sistema prepara una nueva verificación para que el administrador ingrese el código actual de su app.
9. **Given** 4 intentos fallidos consecutivos, **When** el administrador falla el 5.º intento, **Then** se cancela la autenticación pendiente, se muestra "Demasiados intentos fallidos. Inicia sesión nuevamente." y el sistema regresa a "Iniciar sesión".
10. **Given** la pantalla de verificación (o de enrolamiento), **When** el administrador pulsa "Volver al inicio de sesión", **Then** se cancela la autenticación pendiente y regresa a "Iniciar sesión" con el formulario vacío.
11. **Given** una autenticación pendiente del segundo factor, **When** el administrador escribe en la barra de direcciones la URL de cualquier pantalla administrativa, **Then** el sistema lo devuelve a la pantalla del segundo factor que le corresponda.
12. **Given** un visitante sin ninguna sesión, **When** abre directamente la URL de verificación o de enrolamiento, **Then** el sistema lo redirige a "Iniciar sesión".
13. **Given** cualquier verificación (correcta o fallida), **When** se completa, **Then** no se modifica ningún dato de parqueaderos, tarifas, capacidad ni ocupación.

---

### User Story 3 - Cerrar sesión y proteger el área administrativa (Priority: P2) · HU8

Como Administrador de Parqueadero necesito cerrar mi sesión para terminar de forma segura el acceso a las
funcionalidades de gestión. Además, el sistema debe impedir el acceso al área administrativa a quien no esté
completamente autenticado.

**Why this priority**: completa el ciclo de vida de la sesión y protege el panel. Se puede entregar después
de US1 y US2 sin bloquearlas.

**Independent Test**: con sesión completa, cerrar sesión desde el encabezado, confirmar y luego intentar abrir
`/admin` por URL. Debe terminar en "Iniciar sesión". Volver a entrar y comprobar que la información sigue
igual.

**Acceptance Scenarios**:

1. **Given** un administrador completamente autenticado en cualquier pantalla del área administrativa, **When** observa el encabezado, **Then** ve el logo de MedaPark, su identificación (correo) y la opción "Cerrar sesión".
2. **Given** un administrador autenticado, **When** pulsa "Cerrar sesión", **Then** aparece un diálogo de confirmación con el título "Cerrar sesión", el texto "¿Estás seguro de que deseas cerrar tu sesión?" y los botones "Cancelar" y "Cerrar sesión".
3. **Given** el diálogo de confirmación, **When** pulsa "Cancelar" (o Esc, o fuera del diálogo), **Then** el diálogo se cierra y la sesión continúa sin cambios.
4. **Given** el diálogo de confirmación, **When** pulsa "Cerrar sesión", **Then** la sesión se finaliza en el servidor y el administrador es redirigido a "Iniciar sesión".
5. **Given** una sesión cerrada, **When** el administrador usa "Atrás" del navegador o escribe la URL de una pantalla administrativa, **Then** el sistema lo redirige a "Iniciar sesión".
6. **Given** una sesión cerrada, **When** el administrador inicia sesión de nuevo (ambos factores), **Then** encuentra la información de su parqueadero tal como estaba (el cierre de sesión no modifica ni elimina datos).
7. **Given** una sesión que expiró o dejó de ser válida, **When** el administrador intenta cualquier acción o navegación administrativa, **Then** el sistema lo redirige a "Iniciar sesión".
8. **Given** un administrador completamente autenticado, **When** abre `/admin/login`, **Then** el sistema lo redirige al panel de gestión.
9. **Given** un administrador con sesión abierta en dos pestañas, **When** cierra sesión en una, **Then** la otra pestaña, ante la siguiente navegación o acción, lo redirige a "Iniciar sesión".

---

### Edge Cases

- **Correo con espacios o mayúsculas**: se eliminan los espacios al inicio y al final y la comparación no distingue mayúsculas.
- **Error de red o servicio no disponible** en cualquier paso: se muestra "No fue posible conectar con el servidor. Intenta nuevamente." sin perder lo digitado (excepto la contraseña) y sin avanzar de paso.
- **Cuenta deshabilitada o eliminada por el equipo** con credenciales que antes eran válidas: se trata como credenciales incorrectas (mismo mensaje de HU1, sin revelar el motivo).
- **Código con menos de 6 dígitos o con letras**: el campo solo admite dígitos, y "Verificar código" queda deshabilitado hasta completar 6.
- **Pegar el código**: se puede pegar un código de 6 dígitos completo en el campo.
- **Reloj del teléfono desfasado**: se aceptan los códigos inmediatamente anterior y siguiente al actual (tolerancia estándar de TOTP). Fuera de eso, el código es incorrecto.
- **Recargar la página durante el segundo factor**: el administrador permanece en la pantalla del segundo factor (la autenticación pendiente sobrevive a la recarga hasta que se complete, se cancele o expire).
- **Pérdida del teléfono** con la app autenticadora: fuera del sistema. El equipo de desarrollo elimina el factor de la cuenta y el administrador vuelve a enrolarse (riesgo documentado).
- **Ruta administrativa inexistente** (por ejemplo, `/admin/xyz`) con sesión completa: se muestra "Página no encontrada" con un enlace al panel.

## Requirements *(mandatory)*

### Functional Requirements

**Inicio de sesión (HU1)**

- **FR-001**: El sistema MUST ofrecer una pantalla "Iniciar sesión" con los campos obligatorios "Correo electrónico" y "Contraseña" y el botón "Ingresar". Es la única pantalla de credenciales del sistema.
- **FR-002**: El sistema MUST validar que el correo tenga formato `usuario@dominio.tld` y, si no lo cumple, mostrar "Verificar correo electrónico" sin intentar autenticar.
- **FR-003**: Si algún campo obligatorio está vacío al pulsar "Ingresar", el sistema MUST impedir el intento, resaltar los campos vacíos y mostrar "Debe completar los campos requeridos".
- **FR-004**: Si el correo o la contraseña no corresponden a una cuenta de administrador, el sistema MUST mostrar exactamente "El correo electrónico o la contraseña son incorrectos", sin indicar cuál de los dos falló.
- **FR-005**: Al validar correctamente el primer factor, el sistema MUST dirigir al administrador al paso de segundo factor (enrolamiento o verificación) y MUST NOT conceder acceso a ninguna funcionalidad administrativa todavía.
- **FR-006**: La pantalla MUST NOT ofrecer registro, recuperación ni cambio de contraseña.
- **FR-007**: El campo contraseña MUST permitir mostrar u ocultar su contenido.
- **FR-008**: Mientras una solicitud de autenticación está en curso, el botón correspondiente MUST quedar deshabilitado con indicador de carga.

**Segundo factor (HU2)**

- **FR-009**: El segundo factor MUST aplicar a todas las cuentas de Administrador de Parqueadero, sin excepción.
- **FR-010**: Si el administrador no tiene app autenticadora vinculada, el sistema MUST presentar la pantalla "Configurar verificación en dos pasos" con un código QR, la clave para ingreso manual y el campo "Código de verificación". La vinculación solo se confirma cuando el administrador ingresa un código válido generado por su app.
- **FR-011**: Los enrolamientos iniciados y no confirmados MUST descartarse al iniciar un nuevo enrolamiento, de modo que solo exista como máximo una app vinculada por cuenta.
- **FR-012**: Si el administrador tiene app vinculada, el sistema MUST presentar la pantalla "Verificación en dos pasos" con el campo obligatorio "Código de verificación" (6 dígitos numéricos), el botón "Verificar código", la indicación "Abre tu app autenticadora para ver un código nuevo" y la opción "Volver al inicio de sesión".
- **FR-013**: Al pulsar "Verificar código", el sistema MUST comprobar que el código corresponde al factor del administrador y está vigente. Si es correcto, completa la autenticación y redirige al panel de gestión.
- **FR-014**: Si el código es incorrecto, el sistema MUST mostrar "El código de verificación es incorrecto" y no dar acceso.
- **FR-015**: Si la solicitud de verificación venció, el sistema MUST mostrar "El código de verificación ha expirado. Solicita uno nuevo." y generar automáticamente una solicitud nueva, sin que el administrador deba volver a HU1.
- **FR-016**: El sistema MUST limitar los intentos: tras **5 intentos fallidos consecutivos** en la misma autenticación pendiente, la cancela, muestra "Demasiados intentos fallidos. Inicia sesión nuevamente." y regresa a "Iniciar sesión". Adicionalmente, el servidor MUST aplicar su propio límite de frecuencia de verificaciones.
- **FR-017**: "Volver al inicio de sesión" MUST cancelar la autenticación pendiente (invalidando la sesión parcial) y regresar a "Iniciar sesión".
- **FR-018**: La sesión MUST considerarse completamente autenticada **solo** tras superar ambos factores. Toda operación administrativa en el servidor MUST exigir este nivel de autenticación, no solo la interfaz.
- **FR-019**: El proceso de segundo factor MUST NOT modificar datos de parqueaderos, tarifas, capacidad ni ocupación.

**Cierre de sesión y protección (HU8, y criterios de HU2, HU3 y HU4)**

- **FR-020**: Todas las pantallas del área administrativa MUST mostrar un encabezado con el logo de MedaPark, el correo del administrador y la opción "Cerrar sesión".
- **FR-021**: "Cerrar sesión" MUST pedir confirmación ("¿Estás seguro de que deseas cerrar tu sesión?", con "Cancelar" y "Cerrar sesión") y, al confirmar, finalizar la sesión en el servidor y redirigir a "Iniciar sesión".
- **FR-022**: El sistema MUST impedir el acceso por URL a cualquier pantalla administrativa (`/admin` y subrutas) a quien no tenga sesión completa: sin sesión, se redirige a "Iniciar sesión"; con solo el primer factor, a la pantalla de segundo factor correspondiente.
- **FR-023**: Si la sesión expira o se invalida (incluido el cierre desde otra pestaña), el sistema MUST redirigir a "Iniciar sesión" en la siguiente navegación o acción administrativa.
- **FR-024**: El cierre de sesión MUST NOT modificar ni eliminar la cuenta ni la información del parqueadero, tarifas, capacidad u ocupación.
- **FR-025**: Un administrador completamente autenticado que abra "Iniciar sesión" MUST ser redirigido al panel de gestión.
- **FR-026**: El área administrativa MUST tener un menú lateral cuya única opción en esta feature es "Mi parqueadero" (panel). Las opciones "Usuarios", "Reportes" y "Configuración" de los prototipos MUST NOT existir.
- **FR-027**: El panel de gestión (`/admin`) MUST existir como destino tras la autenticación. En esta feature muestra un saludo y un estado vacío; su contenido funcional (HU4) lo define la feature 002.
- **FR-028**: El área pública (feature 003) MUST ofrecer un enlace discreto "Acceso administradores" hacia "Iniciar sesión". En esta feature basta con que la ruta `/` muestre ese enlace en un encabezado provisional.

**Transversales**

- **FR-029**: Toda la interfaz MUST estar en español. Los errores inesperados muestran "No fue posible conectar con el servidor. Intenta nuevamente." sin detalles técnicos.
- **FR-030**: Las pantallas MUST seguir la línea visual de los prototipos HU01, HU02 y HU08 y ser utilizables desde 360 px de ancho.

### Key Entities

- **Cuenta de Administrador**: identidad creada por el equipo de desarrollo, con correo único y contraseña. Tiene como máximo un factor TOTP vinculado. Se asocia a un único parqueadero (feature 002).
- **Factor de autenticación (TOTP)**: vínculo entre la cuenta y una app autenticadora. Estados: *no verificado* (enrolamiento iniciado) y *verificado*.
- **Sesión**: estado de autenticación del navegador. Niveles: *sin sesión*, *primer factor superado* (pendiente de segundo factor) y *completamente autenticada*.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador con app vinculada completa el inicio de sesión (ambos factores) en menos de 60 segundos.
- **SC-002**: Un administrador nuevo completa el enrolamiento de su app autenticadora en menos de 3 minutos siguiendo solo las instrucciones de pantalla.
- **SC-003**: El 100 % de los intentos de abrir una URL administrativa sin sesión completa terminan en la pantalla de inicio de sesión o de segundo factor, sin mostrar datos administrativos.
- **SC-004**: El 100 % de las operaciones administrativas de datos realizadas con una sesión de solo primer factor son rechazadas por el servidor.
- **SC-005**: Todos los mensajes de error y confirmación de esta feature (HU1, HU2 y HU8) aparecen con el texto exacto definido en la spec en el 100 % de los casos probados.
- **SC-006**: Tras cerrar sesión e iniciarla de nuevo, el 100 % de los datos del parqueadero se conservan sin cambios.

## Desviaciones respecto a las HU

| HU | Criterio original | Comportamiento especificado | Motivo |
|----|-------------------|-----------------------------|--------|
| HU2 | "Generar/enviar un código" | El código lo genera la app autenticadora del administrador (TOTP) | Decisión del equipo: MFA nativo de la plataforma, sin proveedor de correo |
| HU2 | Botón/enlace "Reenviar código" | Se reemplaza por la indicación "Abre tu app autenticadora para ver un código nuevo" | En TOTP el código se renueva solo cada 30 s |
| HU2 | "El código debe tener una vigencia limitada" | Vigencia de 30 s del código TOTP más vencimiento de la solicitud de verificación (FR-015) | Equivalente funcional |
| HU2 | (no existe) | Pantalla nueva "Configurar verificación en dos pasos" (enrolamiento con QR) | Requisito técnico de TOTP la primera vez |
| HU1 | "Debe indicar que se deben completar los campos requeridos" | Texto definido: "Debe completar los campos requeridos" | La HU no fija el texto |
| HU8 | (no especifica confirmación) | Diálogo de confirmación según el prototipo HU08 | Prototipo |

## Assumptions

- Las cuentas de administrador las crea el equipo desde el panel de la plataforma de backend, con el correo ya confirmado. No hay invitación por correo.
- El administrador dispone de un teléfono con una app autenticadora compatible con TOTP (Google Authenticator, Microsoft Authenticator, Authy, etc.).
- La duración de la sesión y su renovación usan los valores por defecto de la plataforma de autenticación (sesión renovable mientras el navegador permanezca activo). No hay "recordarme".
- El conteo de 5 intentos fallidos se lleva por autenticación pendiente en el navegador y se complementa con el límite de frecuencia del servidor. Para un MVP académico se considera suficiente.
- El enlace "Acceso administradores" del área pública es una adición mínima necesaria para llegar a la pantalla de login. No hay HU que lo prohíba.
- La HU1 exige que la validación se conecte al servicio de autenticación de la plataforma de backend elegida (Supabase Auth). Esto se concreta en el plan.
