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
    greeting: 'Hola',
    greetingNamed: 'Hola, {{name}}',
    subtitle: '¿Cómo podemos ayudarte a instalarte en Corea?',
    notifications: 'Notificaciones',
    requestQuote: 'Solicitar presupuesto',
    requestQuoteSub: 'Cuéntanos qué necesitas: del resto nos encargamos nosotros',
    categoriesLabel: 'Categorías',
    recentLabel: 'Solicitudes recientes',
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
    service: 'Tipo de servicio',
    servicePlaceholder: 'Elige un servicio',
    budget: 'Presupuesto deseado (opcional, USD)',
    budgetPlaceholder: '400',
    description: '¿Qué necesitas? (al menos 10 caracteres)',
    descriptionPlaceholder:
      'Describe tu situación: cuanto más detalle, mejor será el presupuesto.',
    attachments: 'Adjuntos (opcional, hasta {{max}}: fotos o PDF)',
    photo: 'Foto',
    pdf: 'PDF',
    contactLabel: '¿Cómo debemos contactarte?',
    contactPlaceholder: 'Elige un método de contacto',
    contactNote:
      'Nuestro equipo se pondrá en contacto por este medio para hablar de tu presupuesto.',
    submit: 'Enviar solicitud',
    reviewNote: 'Revisaremos tu solicitud y te enviaremos un presupuesto en un plazo de 24 horas.',
    budgetError: 'El presupuesto deseado debe ser un número positivo',
  },

  services: {
    customQuote: 'Presupuesto a medida',
    HOUSING_1: {
      title: 'Búsqueda de vivienda y guía de zonas',
      desc: 'Ayuda para entender los barrios, los tipos de alquiler, los depósitos, la renta mensual, la terminología de vivienda y cómo buscar casa en Corea.\n\nIncluye: información general de vivienda y orientación en la búsqueda\nNo incluye: intermediación inmobiliaria ni negociación de precios',
    },
    HOUSING_2: {
      title: 'Apoyo de comunicación inmobiliaria',
      desc: 'Apoyo lingüístico y de comunicación al contactar con una agencia inmobiliaria, un propietario o un proveedor de vivienda elegido por ti.\n\nIncluye: llamadas, mensajes y coordinación de citas\nNo incluye: intermediación o negociación en tu nombre',
    },
    HOUSING_3: {
      title: 'Interpretación y acompañamiento en visitas',
      desc: 'Asistencia presencial durante la visita a una vivienda.\n\nIncluye: interpretación general y ayuda con la comunicación\nNo incluye: intermediación inmobiliaria, negociación de contratos ni asesoría legal',
    },
    HOUSING_4: {
      title: 'Apoyo de mudanza y altas de suministros',
      desc: 'Ayuda con los trámites de mudanza y la comunicación sobre suministros y servicios básicos de la vivienda.\n\nEjemplos: electricidad, gas, agua, internet, oficina de administración del edificio',
    },
    HOUSING_5: {
      title: 'Otra solicitud de vivienda',
      desc: 'Cuéntanos qué necesitas y LUNOTE revisará tu solicitud.',
    },
    VISA_1: {
      title: 'Información de visado y lista de requisitos',
      desc: 'Orientación general basada en información migratoria disponible públicamente.\n\nEjemplos: documentos necesarios, trámites migratorios, dónde solicitar, guía general del proceso',
    },
    VISA_2: {
      title: 'Apoyo con webs de inmigración y citas',
      desc: 'Ayuda para navegar por los sitios web de inmigración de Corea y entender el proceso de reserva de citas.',
    },
    VISA_3: {
      title: 'Organización de documentos y apoyo lingüístico',
      desc: 'Ayuda para entender y organizar los documentos necesarios para los trámites migratorios.\n\nLos trabajos profesionales o regulados legalmente se derivarán a un profesional cualificado cuando sea necesario.',
    },
    VISA_4: {
      title: 'Acompañamiento a la oficina de inmigración',
      desc: 'Interpretación general y apoyo de comunicación al visitar una oficina de inmigración.\n\nLUNOTE no actúa como tu representante migratorio salvo que la ley lo permita.',
    },
    VISA_5: {
      title: 'Otra solicitud de visado',
      desc: 'Describe tu situación y evaluaremos qué tipo de apoyo podemos ofrecerte.',
    },
    HOSPITAL_1: {
      title: 'Orientación sanitaria en Corea',
      desc: 'Ayuda general para entender cómo funciona la sanidad en Corea.\n\nEjemplos: qué especialidad médica puede atender cada tipo de problema, cómo funcionan hospitales y clínicas, información general sobre acudir al hospital\n\nEste servicio no ofrece consejo médico ni diagnóstico.',
    },
    HOSPITAL_2: {
      title: 'Apoyo de comunicación con hospitales',
      desc: 'Asistencia lingüística al comunicarte con un centro médico que ya usas o que has elegido.\n\nEjemplos: ayuda con llamadas, consultas generales, comunicación de citas',
    },
    HOSPITAL_3: {
      title: 'Interpretación y acompañamiento en el hospital',
      desc: 'Asistencia presencial lingüística y administrativa general durante tu visita al hospital.\n\nNo es interpretación médica en los casos que requieren interpretación profesional certificada.',
    },
    HOSPITAL_4: {
      title: 'Documentos médicos y coordinación de intérpretes',
      desc: 'Ayuda para entender documentos hospitalarios generales o para conseguir un intérprete profesional o proveedor adecuado cuando haga falta.\n\nLos honorarios del intérprete profesional se pagan aparte.',
    },
    HOSPITAL_5: {
      title: 'Otra solicitud de salud',
      desc: 'Describe la ayuda que necesitas y LUNOTE revisará tu solicitud.',
    },
    BANK_1: {
      title: 'Guía para abrir una cuenta bancaria',
      desc: 'Información general sobre los documentos y el proceso que se suelen requerir para abrir una cuenta bancaria en Corea.',
    },
    BANK_2: {
      title: 'Apoyo con apps bancarias y autenticación',
      desc: 'Ayuda para entender la configuración de la banca móvil, las apps bancarias coreanas, la autenticación y los servicios bancarios generales.',
    },
    BANK_3: {
      title: 'Interpretación y acompañamiento en el banco',
      desc: 'Asistencia presencial lingüística y de comunicación en el banco.',
    },
    BANK_4: {
      title: 'Apoyo con transferencias internacionales',
      desc: 'Asistencia general para entender los procedimientos de envío de dinero al extranjero y comunicarte con tu banco.\n\nLUNOTE no ofrece asesoría financiera ni recomienda productos financieros.',
    },
    BANK_5: {
      title: 'Otra solicitud bancaria',
      desc: 'Cuéntanos qué dificultad bancaria estás teniendo.',
    },
    TELECOM_1: {
      title: 'Guía de SIM/eSIM y planes móviles',
      desc: 'Ayuda para entender las tarjetas SIM, las eSIM y los planes móviles de Corea.',
    },
    TELECOM_2: {
      title: 'Apoyo para contratar servicio móvil',
      desc: 'Ayuda con la comunicación y los trámites al dar de alta un servicio móvil coreano.\n\nLas tarifas del operador y el coste del plan se pagan aparte.',
    },
    TELECOM_3: {
      title: 'Apoyo para instalar internet en casa',
      desc: 'Ayuda para conocer los servicios de internet disponibles y coordinar los trámites de instalación.',
    },
    TELECOM_4: {
      title: 'Apoyo con atención al cliente de telecos',
      desc: 'Ayuda para comunicarte con los operadores de telecomunicaciones.\n\nEjemplos: cambios de plan, dudas de facturación, cancelación, comunicación con soporte técnico',
    },
    TELECOM_5: {
      title: 'Otra solicitud de móvil e internet',
      desc: 'Cuéntanos con qué necesitas ayuda.',
    },
    OTHER_1: {
      title: 'Orientación en oficinas públicas',
      desc: 'Orientación general y asistencia lingüística al usar los servicios públicos coreanos.\n\nCuando la ley exija trabajo administrativo profesional, LUNOTE te conectará con un profesional cualificado.',
    },
    OTHER_2: {
      title: 'Apoyo con llamadas en coreano',
      desc: '¿Necesitas que alguien haga o te ayude con una llamada en coreano?\n\nEjemplos: atención al cliente, reservas, consultas generales, proveedores de servicios',
    },
    OTHER_3: {
      title: 'Información escolar y de cuidado infantil',
      desc: 'Apoyo general para investigar y comunicarte con guarderías, jardines de infancia, escuelas, academias y servicios infantiles.',
    },
    OTHER_4: {
      title: 'Conserjería de vida en Corea',
      desc: '¿No encuentras la categoría adecuada? Cuéntale a LUNOTE qué intentas resolver.\n\nPodemos investigar el asunto, comunicarnos con proveedores coreanos, coordinar los siguientes pasos o conectarte con un profesional adecuado.',
    },
    OTHER_5: {
      title: 'Otra solicitud',
      desc: 'Describe lo que necesitas.',
    },
  },

  payment: {
    title: 'Pagos',
    subtitle: 'Revisa presupuestos y completa pagos',
    emptyGuest: 'Inicia sesión para revisar presupuestos y pagos.',
    login: 'Iniciar sesión',
    emptyNone: 'Nada por pagar aún: los presupuestos aparecerán aquí.',
    payNow: 'Pagar ahora',
    expired: 'Expirado',
  },

  requestDetail: {
    title: 'Solicitud n.º {{id}}',
    requested: 'Solicitado el {{date}}',
    budgetSuffix: ' · Presupuesto {{amount}}',
    contact: 'Contacto: {{method}}',
    yourQuote: 'Tu presupuesto',
    proceedPayment: 'Continuar al pago',
    validUntil: 'Válido hasta {{date}}',
    quoteExpired: 'El presupuesto ha expirado; envía una nueva solicitud.',
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
    profileSection: 'Perfil',
    email: 'Correo',
    firstName: 'Nombre',
    lastName: 'Apellido',
    realNameNote:
      'Usa tu nombre real: así te identifica nuestro equipo para presupuestos y pagos.',
    saved: 'Guardado.',
    saveName: 'Guardar nombre',
    securitySection: 'Seguridad',
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

  chooseLanguage: {
    title: 'Elige tu idioma',
    subtitle: 'Puedes cambiarlo en cualquier momento desde tu perfil.',
    continue: 'Continuar',
  },

  welcome: {
    title: '¡Te damos la bienvenida a LUNOTE! 🎉',
    tagline: 'Tu conserjería integral para la vida en Corea',
    intro1: 'Vivir en Corea puede ser complicado. LUNOTE está aquí para hacerlo más fácil.',
    intro2: '¿Necesitas ayuda con vivienda, visados, hospitales, bancos, telefonía o cualquier otro asunto de la vida en Corea? Solo dinos qué necesitas.',
    howTitle: 'Cómo funciona',
    step1Title: '1. Dinos qué necesitas',
    step1Body: 'Elige una categoría, selecciona el servicio que necesitas y describe tu solicitud.',
    step2Title: '2. Recibe un presupuesto personalizado',
    step2Body: 'Revisaremos tu solicitud y hablaremos contigo del servicio y el precio antes de empezar.',
    step3Title: '3. Paga y recibe apoyo',
    step3Body: 'Cuando acordemos el servicio y el precio, paga a través de LUNOTE y nos pondremos en marcha.',
    solutionTitle: 'Una solicitud. La solución adecuada.',
    solutionBody1: 'LUNOTE es un servicio de conserjería. Según tu solicitud, te ayudamos directamente o te conectamos con el profesional o proveedor cualificado adecuado.',
    solutionBody2: 'No necesitas averiguar a quién contactar ni por dónde empezar.',
    solutionCta: 'Solo dile a LUNOTE qué necesitas.',
    cta: 'Crea tu primera solicitud',
    later: 'Explorar la app primero',
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
    faq4q: '¿En qué idiomas ofrecen soporte?',
    faq4a: 'La app está disponible en seis idiomas y nuestro equipo de conserjería puede atenderte en inglés y coreano.',
    contactLabel: 'Contacto',
    contactNote:
      '¿No encuentras tu respuesta? Escríbenos y te responderemos en un día laborable.',
    emailSupport: 'Escribir a soporte',
    version: 'LUNOTE v{{version}}',
  },
};

export default es;
