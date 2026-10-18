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
} as const;
