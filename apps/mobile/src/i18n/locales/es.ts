import type { Resources } from '../index';

const es: Resources = {
  brand: {
    tagline: 'La vida en Corea, más fácil',
  },

  common: {
    somethingWrong: 'Algo salió mal',
    uploadFailed: 'Error al subir',
    login: 'Iniciar sesión',
  },

  tabs: {
    home: 'Inicio',
    quote: 'Presupuesto',
    payment: 'Pago',
    profile: 'Perfil',
  },

  status: {
    reviewing: 'En revisión',
    quoted: 'Presupuesto listo',
    paid: 'Pagado',
    inProgress: 'En curso',
    completed: 'Completado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  },

  categories: {
    HOUSING: 'Vivienda',
    VISA: 'Visado',
    HOSPITAL: 'Hospital',
    BANK: 'Banco',
    TELECOM: 'Telefonía',
    OTHER: 'Otros',
  },

  contactChannels: {
    email: 'Correo',
    phone: 'Teléfono',
    whatsapp: 'WhatsApp',
  },

  password: {
    policy:
      'La contraseña debe tener 8 caracteres o más e incluir una letra, un número y un carácter especial',
    placeholder: '8+ caracteres con número y símbolo',
  },

  home: {
    greeting: 'Hola 👋',
    greetingNamed: 'Hola {{name}} 👋',
    subtitle: '¿Cómo podemos ayudarte a instalarte en Corea?',
    notifications: 'Notificaciones',
    requestQuote: 'Solicitar presupuesto',
    requestQuoteSub: 'Cuéntanos qué necesitas: del resto nos encargamos nosotros',
    categoriesLabel: 'CATEGORÍAS',
    recentLabel: 'SOLICITUDES RECIENTES',
    recentEmptyAuthed: 'Tus solicitudes aparecerán aquí.',
    recentEmptyGuest: 'Inicia sesión para crear y seguir tus solicitudes.',
  },

  login: {
    emailLabel: 'Correo',
    passwordLabel: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    submit: 'Iniciar sesión',
    orContinueWith: 'o continúa con',
    continueGoogle: 'Continuar con Google',
    continueApple: 'Continuar con Apple',
    continueGuest: '← Seguir navegando como invitado',
    newToLunote: '¿Nuevo en LUNOTE? ',
    createAccount: 'Crear cuenta',
  },

  signup: {
    title: 'Crear cuenta',
    subtitle: 'Empieza tu vida en Corea con LUNOTE',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo',
    password: 'Contraseña',
    submit: 'Crear cuenta',
    alreadyHaveAccount: '¿Ya tienes una cuenta? ',
    logIn: 'Iniciar sesión',
  },

  verifyEmail: {
    title: 'Revisa tu correo',
    subtitle: 'Enviamos un código de 6 dígitos a',
    yourEmail: 'tu correo',
    verify: 'Verificar',
    resendCode: 'Reenviar código',
    logOut: 'Cerrar sesión',
    codeSent: 'Se ha enviado un nuevo código a tu correo.',
  },

  forgotPassword: {
    resetTitle: 'Restablecer contraseña',
    requestSubtitle: 'Introduce el correo de tu cuenta y te enviaremos un código de 6 dígitos.',
    resetSubtitle: 'Introduce el código enviado a',
    email: 'Correo',
    sendCode: 'Enviar código',
    newPassword: 'Nueva contraseña',
    newPasswordPlaceholder: 'Al menos 8 caracteres',
    setNewPassword: 'Guardar nueva contraseña',
    resendCode: 'Reenviar código',
    backToLogin: '← Volver a iniciar sesión',
    codeResent: 'Si el correo existe, se ha enviado un nuevo código.',
    doneTitle: 'Contraseña actualizada',
    doneSubtitle: 'Inicia sesión con tu nueva contraseña.',
    doneButton: 'Volver a iniciar sesión',
  },

  changePassword: {
    title: 'Cambiar contraseña',
    current: 'Contraseña actual',
    newLabel: 'Nueva contraseña',
    confirm: 'Confirmar nueva contraseña',
    confirmPlaceholder: 'Vuelve a introducir la nueva contraseña',
    mismatch: 'Las nuevas contraseñas no coinciden',
    submit: 'Cambiar contraseña',
    confirmTitle: '¿Cambiar tu contraseña?',
    confirmMessage: 'Usarás la nueva contraseña desde tu próximo inicio de sesión.',
    goBack: 'Volver',
    doneTitle: 'Contraseña cambiada',
    doneSubtitle: 'Usa tu nueva contraseña la próxima vez que inicies sesión.',
    done: 'Listo',
  },

  quoteList: {
    title: 'Mis solicitudes',
    subtitle: 'Sigue el estado de tus solicitudes',
    emptyGuest: 'Inicia sesión para crear y seguir tus solicitudes.',
    login: 'Iniciar sesión',
    emptyNone: 'Aún no hay solicitudes: cuéntanos qué necesitas.',
    requestQuote: 'Solicitar presupuesto',
  },

  quoteRequest: {
    title: 'Solicitar presupuesto',
    category: 'Categoría',
    budget: 'Presupuesto deseado (opcional, USD)',
    budgetPlaceholder: '400',
    description: '¿Qué necesitas? (al menos 10 caracteres)',
    descriptionPlaceholder:
      'Describe tu situación: cuanto más detalle, mejor será el presupuesto.',
    attachments: 'Adjuntos (opcional, hasta {{max}}: fotos o PDF)',
    photo: 'FOTO',
    pdf: 'PDF',
    contactLabel: '¿Cómo debemos contactarte?',
    contactPlaceholder: 'Elige un método de contacto',
    contactNote:
      'Nuestro equipo se pondrá en contacto por este medio para hablar de tu presupuesto.',
    submit: 'Enviar solicitud',
    reviewNote: 'Revisaremos tu solicitud y te enviaremos un presupuesto en un plazo de 24 horas.',
    budgetError: 'El presupuesto deseado debe ser un número positivo',
  },

  payment: {
    title: 'Pagos',
    subtitle: 'Revisa presupuestos y completa pagos',
    emptyGuest: 'Inicia sesión para revisar presupuestos y pagos.',
    login: 'Iniciar sesión',
    emptyNone: 'Nada por pagar aún: los presupuestos aparecerán aquí.',
    payNow: 'Pagar ahora',
  },

  requestDetail: {
    title: 'Solicitud n.º {{id}}',
    requested: 'Solicitado el {{date}}',
    budgetSuffix: ' · Presupuesto {{amount}}',
    contact: 'Contacto: {{method}}',
    yourQuote: 'TU PRESUPUESTO',
    proceedPayment: 'Continuar al pago',
    reviewing:
      'Estamos revisando tu solicitud. Recibirás un presupuesto en un plazo de 24 horas.',
    cancel: 'Cancelar solicitud',
    cancelTitle: '¿Cancelar esta solicitud?',
    cancelMessageQuoted:
      'Tu presupuesto se descartará y esta acción no se puede deshacer.',
    cancelMessagePlain:
      'Esta acción no se puede deshacer: tendrías que enviar una nueva solicitud.',
    cancelConfirm: 'Sí, cancelar',
    cancelKeep: 'Conservar',
  },

  notifications: {
    title: 'Notificaciones',
    markAllRead: 'Marcar todo como leído ({{count}})',
    empty: 'Aún no hay notificaciones.',
  },

  notificationSettings: {
    title: 'Notificaciones',
    subtitle: 'Cómo te mantenemos al día',
    inAppTitle: 'Notificaciones en la app',
    inAppDesc: 'Novedades de presupuestos y solicitudes en tu bandeja de notificaciones.',
    alwaysOn: 'Siempre activadas',
    pushTitle: 'Notificaciones push',
    pushDesc: 'Próximamente: recibe novedades aunque la app esté cerrada.',
  },

  profile: {
    welcomeTitle: 'Te damos la bienvenida a LUNOTE',
    welcomeSubtitle: 'Inicia sesión para gestionar tus solicitudes, presupuestos y pagos.',
    login: 'Iniciar sesión',
    createAccount: 'Crear cuenta',
    changePhoto: 'Cambiar foto de perfil',
    accountDetails: 'Datos de la cuenta',
    language: 'Idioma',
    notifications: 'Notificaciones',
    support: 'Soporte',
    logOut: 'Cerrar sesión',
    logoutTitle: '¿Cerrar sesión de LUNOTE?',
    logoutMessage: 'Puedes volver a iniciar sesión cuando quieras con tu correo y contraseña.',
    logoutStay: 'Quedarme',
  },

  account: {
    title: 'Datos de la cuenta',
    profileSection: 'PERFIL',
    email: 'Correo',
    firstName: 'Nombre',
    lastName: 'Apellido',
    realNameNote:
      'Usa tu nombre real: así te identifica nuestro equipo para presupuestos y pagos.',
    saved: 'Guardado.',
    saveName: 'Guardar nombre',
    securitySection: 'SEGURIDAD',
    changePassword: 'Cambiar contraseña',
    confirmTitle: '¿Actualizar tu nombre?',
    confirmMessage:
      'Tu nombre cambiará a "{{name}}". Nuestro equipo lo usa para identificarte.',
    save: 'Guardar',
    goBack: 'Volver',
  },

  language: {
    title: 'Idioma',
    subtitle: 'Elige tu idioma preferido',
    note: 'La app cambia al idioma seleccionado de inmediato.',
  },

  support: {
    title: 'Soporte',
    subtitle: 'Estamos aquí para ayudarte',
    faqLabel: 'FAQ',
    faq1q: '¿En cuánto tiempo recibiré mi presupuesto?',
    faq1a: 'Revisamos cada solicitud y enviamos un presupuesto en un plazo de 24 horas. Recibirás una notificación en cuanto llegue.',
    faq2q: '¿Puedo cancelar una solicitud?',
    faq2a: 'Sí: abre la solicitud y pulsa "Cancelar solicitud" en cualquier momento antes del pago. Después del pago, contacta con soporte y te ayudaremos.',
    faq3q: '¿Cómo pago?',
    faq3a: 'Cuando tu presupuesto esté listo, puedes pagar en la app con tarjetas internacionales. El sistema de pago se está ultimando y estará disponible pronto.',
    faq4q: '¿Qué idiomas admiten?',
    faq4a: 'La app está disponible en seis idiomas y nuestro equipo de conserjería puede atenderte en inglés y coreano.',
    contactLabel: 'CONTACTO',
    contactNote:
      '¿No encuentras tu respuesta? Escríbenos y te responderemos en un día laborable.',
    emailSupport: 'Escribir a soporte',
    version: 'LUNOTE v{{version}}',
  },
};

export default es;
