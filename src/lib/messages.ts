export const MSG = {
  login: {
    correoObligatorio: 'El correo electrónico es obligatorio.',
    contrasenaObligatoria: 'La contraseña es obligatoria.',
    correoFormato: 'Verificar correo electrónico',
    requeridos: 'Debe completar los campos requeridos',
    credenciales: 'El correo electrónico o la contraseña son incorrectos',
  },
  mfa: {
    incorrecto: 'El código de verificación es incorrecto',
    expirado: 'El código de verificación ha expirado. Solicita uno nuevo.',
    demasiadosIntentos: 'Demasiados intentos fallidos. Inicia sesión nuevamente.',
    ayudaCodigoNuevo: 'Abre tu app autenticadora para ver un código nuevo',
  },
  logout: {
    titulo: 'Cerrar sesión',
    pregunta: '¿Estás seguro de que deseas cerrar tu sesión?',
    detalle: 'Se finalizará tu sesión activa y serás redirigido a la pantalla de inicio de sesión.',
  },
  general: {
    red: 'No fue posible conectar con el servidor. Intenta nuevamente.',
    limiteFrecuencia: 'Demasiados intentos. Espera unos minutos e intenta nuevamente.',
    permisoDenegado:
      'No tienes permisos para realizar esta acción. Contacta al administrador del sistema.',
    noEncontrada: 'Página no encontrada',
  },
  parqueadero: {
    requeridos: 'Debe completar los campos obligatorios',
    campoObligatorio: 'Este campo es obligatorio.',
    registrado: 'Parqueadero registrado exitosamente',
    actualizado: 'Información actualizada exitosamente',
    quitarTipo:
      'Debe reducir a cero las celdas de este tipo de vehículo antes de quitarlo de los tipos atendidos',
    telefonoNumerico: 'Solo se permiten caracteres numéricos.',
    telefonoLongitud: 'Debe tener entre 7 y 10 dígitos.',
    correoFormato: 'Debe tener un formato de correo electrónico válido.',
    latitudRango: 'Rango válido: -90 a 90.',
    longitudRango: 'Rango válido: -180 a 180.',
    fueraDeMedellin: 'La ubicación está fuera de Medellín. Verifica las coordenadas.',
    tarifaRango: 'Ingresa un valor entero entre 1 y 999.999.',
    capacidadNueva: 'Ingresa un valor entero entre 1 y 9.999.',
    longitud: (min: number, max: number) => `Debe tener entre ${min} y ${max} caracteres.`,
    yaExiste: 'Ya tienes un parqueadero registrado.',
    registroIncompleto:
      'El parqueadero se registró, pero no se pudieron guardar los tipos de vehículo. Agrégalos desde Editar información.',
    guardadoParcial:
      'Algunos cambios no se pudieron guardar. Revisa la información e intenta nuevamente.',
    datosInvalidos: 'Revisa los datos ingresados.',
    avisoInactivo: 'Tu parqueadero está inactivo y no aparece en el mapa público.',
    avisoSinCeldas:
      'Tu parqueadero no aparece en el mapa público porque no tiene celdas configuradas.',
    avisoSinTipos: 'Tu parqueadero no tiene tipos de vehículo configurados.',
    correoNoRegistrado: 'No registrado',
  },
  celdas: {
    reducir:
      'No puede reducir la cantidad de celdas por debajo de las celdas actualmente ocupadas',
    enteroNoNegativo: 'Valor numérico entero mayor o igual a 0.',
    actualizadas: 'Celdas actualizadas exitosamente',
  },
  ocupacion: {
    sinDisponibles: 'No hay celdas disponibles de este tipo',
    sinOcupadas: 'No hay celdas ocupadas de este tipo para liberar',
    sinCapacidad: 'Configura las celdas para gestionar la ocupación',
    ingresoRegistrado: 'Ingreso registrado',
    salidaRegistrada: 'Salida registrada',
    info: 'La disponibilidad se actualiza al registrar ingresos o salidas. Los cambios se reflejarán en el panel de gestión y en la vista pública del parqueadero.',
  },
} as const;
