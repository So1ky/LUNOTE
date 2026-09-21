import type { Resources } from '../index';

const de: Resources = {
  brand: {
    tagline: 'Leben in Korea, leicht gemacht',
  },

  common: {
    somethingWrong: 'Etwas ist schiefgelaufen',
    uploadFailed: 'Upload fehlgeschlagen',
    login: 'Anmelden',
  },

  tabs: {
    home: 'Start',
    quote: 'Angebot',
    payment: 'Zahlung',
    profile: 'Profil',
  },

  status: {
    reviewing: 'In Prüfung',
    quoted: 'Angebot bereit',
    paid: 'Bezahlt',
    inProgress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
    refunded: 'Erstattet',
  },

  categories: {
    HOUSING: 'Wohnen',
    VISA: 'Visum',
    HOSPITAL: 'Krankenhaus',
    BANK: 'Bank',
    TELECOM: 'Mobilfunk',
    OTHER: 'Sonstiges',
  },

  contactChannels: {
    email: 'E-Mail',
    phone: 'Telefon',
    whatsapp: 'WhatsApp',
  },

  password: {
    policy:
      'Das Passwort muss mindestens 8 Zeichen lang sein und einen Buchstaben, eine Zahl und ein Sonderzeichen enthalten',
    placeholder: 'Mind. 8 Zeichen mit Zahl & Sonderzeichen',
  },

  home: {
    greeting: 'Hallo',
    greetingNamed: 'Hallo, {{name}}',
    subtitle: 'Wie können wir Ihnen beim Einleben in Korea helfen?',
    notifications: 'Benachrichtigungen',
    requestQuote: 'Angebot anfragen',
    requestQuoteSub: 'Sagen Sie uns, was Sie brauchen — den Rest übernehmen wir',
    categoriesLabel: 'Kategorien',
    recentLabel: 'Letzte Anfragen',
    recentEmptyAuthed: 'Ihre Anfragen erscheinen hier.',
    recentEmptyGuest: 'Melden Sie sich an, um Anfragen zu erstellen und zu verfolgen.',
  },

  login: {
    emailLabel: 'E-Mail',
    passwordLabel: 'Passwort',
    forgotPassword: 'Passwort vergessen?',
    submit: 'Anmelden',
    orContinueWith: 'oder weiter mit',
    continueGoogle: 'Weiter mit Google',
    continueApple: 'Weiter mit Apple',
    continueGuest: '← Als Gast weiterstöbern',
    newToLunote: 'Neu bei LUNOTE? ',
    createAccount: 'Konto erstellen',
  },

  signup: {
    title: 'Konto erstellen',
    subtitle: 'Starten Sie Ihr Leben in Korea mit LUNOTE',
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail',
    password: 'Passwort',
    submit: 'Konto erstellen',
    alreadyHaveAccount: 'Sie haben bereits ein Konto? ',
    logIn: 'Anmelden',
  },

  verifyEmail: {
    title: 'Prüfen Sie Ihre E-Mails',
    subtitle: 'Wir haben einen 6-stelligen Code gesendet an',
    yourEmail: 'Ihre E-Mail-Adresse',
    verify: 'Bestätigen',
    resendCode: 'Code erneut senden',
    logOut: 'Abmelden',
    codeSent: 'Ein neuer Code wurde an Ihre E-Mail gesendet.',
  },

  forgotPassword: {
    resetTitle: 'Passwort zurücksetzen',
    requestSubtitle: 'Geben Sie Ihre Konto-E-Mail ein und wir senden einen 6-stelligen Code.',
    resetSubtitle: 'Geben Sie den Code ein, gesendet an',
    email: 'E-Mail',
    sendCode: 'Code senden',
    newPassword: 'Neues Passwort',
    newPasswordPlaceholder: 'Mindestens 8 Zeichen',
    setNewPassword: 'Neues Passwort festlegen',
    resendCode: 'Code erneut senden',
    backToLogin: '← Zurück zur Anmeldung',
    codeResent: 'Falls die E-Mail existiert, wurde ein neuer Code gesendet.',
    doneTitle: 'Passwort aktualisiert',
    doneSubtitle: 'Melden Sie sich mit Ihrem neuen Passwort an.',
    doneButton: 'Zurück zur Anmeldung',
  },

  changePassword: {
    title: 'Passwort ändern',
    current: 'Aktuelles Passwort',
    newLabel: 'Neues Passwort',
    confirm: 'Neues Passwort bestätigen',
    confirmPlaceholder: 'Neues Passwort erneut eingeben',
    mismatch: 'Die neuen Passwörter stimmen nicht überein',
    submit: 'Passwort ändern',
    confirmTitle: 'Passwort wirklich ändern?',
    confirmMessage: 'Ab der nächsten Anmeldung verwenden Sie das neue Passwort.',
    goBack: 'Zurück',
    doneTitle: 'Passwort geändert',
    doneSubtitle: 'Verwenden Sie Ihr neues Passwort bei der nächsten Anmeldung.',
    done: 'Fertig',
  },

  quoteList: {
    title: 'Meine Anfragen',
    subtitle: 'Verfolgen Sie den Status Ihrer Anfragen',
    emptyGuest: 'Melden Sie sich an, um Anfragen zu erstellen und zu verfolgen.',
    login: 'Anmelden',
    emptyNone: 'Noch keine Anfragen — sagen Sie uns, was Sie brauchen.',
    requestQuote: 'Angebot anfragen',
  },

  quoteRequest: {
    title: 'Angebot anfragen',
    category: 'Kategorie',
    service: 'Serviceart',
    servicePlaceholder: 'Service auswählen',
    budget: 'Wunschbudget (optional, USD)',
    budgetPlaceholder: '400',
    description: 'Was brauchen Sie? (mindestens 10 Zeichen)',
    descriptionPlaceholder:
      'Beschreiben Sie Ihre Situation — je mehr Details, desto besser das Angebot.',
    attachments: 'Anhänge (optional, bis zu {{max}} — Fotos oder PDF)',
    photo: 'Foto',
    pdf: 'PDF',
    contactLabel: 'Wie sollen wir Sie kontaktieren?',
    contactPlaceholder: 'Kontaktmethode wählen',
    contactNote:
      'Unser Team meldet sich auf diesem Weg, um Ihr Angebot zu besprechen.',
    submit: 'Anfrage senden',
    reviewNote: 'Wir prüfen Ihre Anfrage und senden innerhalb von 24 Stunden ein Angebot.',
    budgetError: 'Das Wunschbudget muss eine positive Zahl sein',
  },

  services: {
    customQuote: 'Individuelles Angebot',
    HOUSING_1: {
      title: 'Wohnungssuche & Viertel-Guide',
      desc: 'Hilfe beim Verstehen von Wohnvierteln, Mietarten, Kautionen, Monatsmieten, Wohnbegriffen und der Wohnungssuche in Korea.\n\nEnthalten: allgemeine Wohninformationen und Unterstützung bei der Suche\nNicht enthalten: Immobilienvermittlung oder Preisverhandlung',
    },
    HOUSING_2: {
      title: 'Kommunikationshilfe mit Maklern',
      desc: 'Sprach- und Kommunikationsunterstützung beim Kontakt mit einer von Ihnen gewählten Immobilienagentur, Vermieterin oder Wohnungsanbieter.\n\nEnthalten: Anrufe, Nachrichten und Terminkoordination\nNicht enthalten: Vermittlung oder Verhandlung in Ihrem Namen',
    },
    HOUSING_3: {
      title: 'Dolmetschen & Begleitung bei Besichtigungen',
      desc: 'Persönliche Unterstützung während einer Wohnungsbesichtigung.\n\nEnthalten: allgemeines Dolmetschen und Kommunikationshilfe\nNicht enthalten: Immobilienvermittlung, Vertragsverhandlung oder Rechtsberatung',
    },
    HOUSING_4: {
      title: 'Einzug & Anmeldung von Versorgern',
      desc: 'Hilfe bei Einzugsformalitäten und der Kommunikation rund um Versorger und die alltägliche Wohnungseinrichtung.\n\nBeispiele: Strom, Gas, Wasser, Internet, Hausverwaltung',
    },
    HOUSING_5: {
      title: 'Andere Wohnanfrage',
      desc: 'Sagen Sie uns, was Sie brauchen — LUNOTE prüft Ihre Anfrage.',
    },
    VISA_1: {
      title: 'Visa-Informationen & Checkliste',
      desc: 'Allgemeine Orientierung auf Basis öffentlich verfügbarer Einwanderungsinformationen.\n\nBeispiele: erforderliche Dokumente, Einwanderungsverfahren, Antragsstellen, allgemeine Prozessübersicht',
    },
    VISA_2: {
      title: 'Hilfe mit Einwanderungs-Websites & Terminen',
      desc: 'Hilfe beim Navigieren der koreanischen Einwanderungs-Websites und beim Verstehen des Reservierungsprozesses.',
    },
    VISA_3: {
      title: 'Dokumentenorganisation & Sprachhilfe',
      desc: 'Hilfe beim Verstehen und Ordnen der für Einwanderungsverfahren nötigen Dokumente.\n\nFachliche oder gesetzlich regulierte Aufgaben werden bei Bedarf an qualifizierte Fachleute weitergeleitet.',
    },
    VISA_4: {
      title: 'Begleitung zur Einwanderungsbehörde',
      desc: 'Allgemeines Dolmetschen und Kommunikationsunterstützung beim Besuch einer Einwanderungsbehörde.\n\nLUNOTE tritt nicht als Ihr Einwanderungsvertreter auf, sofern dies nicht gesetzlich zulässig ist.',
    },
    VISA_5: {
      title: 'Andere Visa-Anfrage',
      desc: 'Beschreiben Sie Ihre Situation — wir prüfen, welche Unterstützung möglich ist.',
    },
    HOSPITAL_1: {
      title: 'Orientierung im koreanischen Gesundheitswesen',
      desc: 'Allgemeine Hilfe, um zu verstehen, wie das Gesundheitswesen in Korea funktioniert.\n\nBeispiele: welche Fachrichtung für ein Anliegen zuständig sein kann, wie Krankenhäuser und Kliniken arbeiten, allgemeine Informationen zum Krankenhausbesuch\n\nDieser Service bietet keine medizinische Beratung oder Diagnose.',
    },
    HOSPITAL_2: {
      title: 'Kommunikationshilfe mit Krankenhäusern',
      desc: 'Sprachliche Unterstützung bei der Kommunikation mit einer medizinischen Einrichtung, die Sie bereits nutzen oder ausgewählt haben.\n\nBeispiele: Hilfe bei Anrufen, allgemeine Fragen, Terminabsprachen',
    },
    HOSPITAL_3: {
      title: 'Dolmetschen & Begleitung beim Arztbesuch',
      desc: 'Persönliche sprachliche und allgemeine administrative Unterstützung während Ihres Krankenhausbesuchs.\n\nDies ist kein medizinisches Dolmetschen, wo zertifizierte Fachdolmetscher erforderlich sind.',
    },
    HOSPITAL_4: {
      title: 'Medizinische Dokumente & Dolmetschervermittlung',
      desc: 'Hilfe beim Verstehen allgemeiner Krankenhausdokumente oder bei der Vermittlung geeigneter Fachdolmetscher oder Dienstleister, wenn nötig.\n\nHonorare für Fachdolmetscher sind separat.',
    },
    HOSPITAL_5: {
      title: 'Andere Gesundheitsanfrage',
      desc: 'Beschreiben Sie die benötigte Hilfe — LUNOTE prüft Ihre Anfrage.',
    },
    BANK_1: {
      title: 'Leitfaden zur Kontoeröffnung',
      desc: 'Allgemeine Informationen zu Dokumenten und Abläufen, die für die Eröffnung eines koreanischen Bankkontos üblicherweise nötig sind.',
    },
    BANK_2: {
      title: 'Hilfe mit Banking-Apps & Authentifizierung',
      desc: 'Hilfe beim Einrichten von Mobile Banking, koreanischen Banking-Apps, Authentifizierung und allgemeinen Bankdiensten.',
    },
    BANK_3: {
      title: 'Dolmetschen & Begleitung zur Bank',
      desc: 'Persönliche Sprach- und Kommunikationsunterstützung in der Bank.',
    },
    BANK_4: {
      title: 'Hilfe bei Auslandsüberweisungen',
      desc: 'Allgemeine Unterstützung beim Verstehen von Auslandsüberweisungen und der Kommunikation mit Ihrer Bank.\n\nLUNOTE bietet keine Finanzberatung und empfiehlt keine Finanzprodukte.',
    },
    BANK_5: {
      title: 'Andere Bankanfrage',
      desc: 'Sagen Sie uns, welche Schwierigkeiten Sie rund ums Banking haben.',
    },
    TELECOM_1: {
      title: 'SIM/eSIM & Tarif-Guide',
      desc: 'Hilfe beim Verstehen koreanischer SIM-Karten, eSIMs und Mobilfunktarife.',
    },
    TELECOM_2: {
      title: 'Hilfe bei der Mobilfunk-Einrichtung',
      desc: 'Hilfe bei Kommunikation und Abläufen bei der Einrichtung eines koreanischen Mobilfunkdienstes.\n\nAnbietergebühren und Tarifkosten sind separat.',
    },
    TELECOM_3: {
      title: 'Hilfe beim Internetanschluss zu Hause',
      desc: 'Hilfe beim Verstehen verfügbarer Internetdienste und der Koordination der Installation.',
    },
    TELECOM_4: {
      title: 'Hilfe mit dem Telekom-Kundenservice',
      desc: 'Hilfe bei der Kommunikation mit Telekommunikationsanbietern.\n\nBeispiele: Tarifwechsel, Rechnungsfragen, Kündigung, Kommunikation mit dem technischen Support',
    },
    TELECOM_5: {
      title: 'Andere Mobilfunk- & Internetanfrage',
      desc: 'Sagen Sie uns, wobei Sie Hilfe brauchen.',
    },
    OTHER_1: {
      title: 'Orientierung bei Behörden',
      desc: 'Allgemeine Orientierung und Sprachhilfe bei der Nutzung koreanischer Behörden und öffentlicher Dienste.\n\nWo gesetzlich professionelle Verwaltungsarbeit erforderlich ist, verbindet LUNOTE Sie mit qualifizierten Fachleuten.',
    },
    OTHER_2: {
      title: 'Hilfe bei Anrufen auf Koreanisch',
      desc: 'Brauchen Sie jemanden, der einen Anruf auf Koreanisch übernimmt oder dabei hilft?\n\nBeispiele: Kundenservice, Reservierungen, allgemeine Anfragen, Dienstleister',
    },
    OTHER_3: {
      title: 'Infos zu Schule & Kinderbetreuung',
      desc: 'Allgemeine Unterstützung bei Recherche und Kommunikation mit Kitas, Kindergärten, Schulen, Nachhilfeinstituten und Kinderdiensten.',
    },
    OTHER_4: {
      title: 'Korea-Alltags-Concierge',
      desc: 'Keine passende Kategorie gefunden? Sagen Sie LUNOTE, was Sie lösen möchten.\n\nWir können recherchieren, mit koreanischen Dienstleistern kommunizieren, nächste Schritte koordinieren oder Sie mit passenden Fachleuten verbinden.',
    },
    OTHER_5: {
      title: 'Andere Anfrage',
      desc: 'Beschreiben Sie, was Sie brauchen.',
    },
  },

  payment: {
    title: 'Zahlungen',
    subtitle: 'Angebote prüfen und Zahlungen abschließen',
    emptyGuest: 'Melden Sie sich an, um Angebote und Zahlungen zu prüfen.',
    login: 'Anmelden',
    emptyNone: 'Noch nichts zu bezahlen — Angebote erscheinen hier.',
    payNow: 'Jetzt bezahlen',
    expired: 'Abgelaufen',
  },

  requestDetail: {
    title: 'Anfrage #{{id}}',
    requested: 'Angefragt am {{date}}',
    budgetSuffix: ' · Budget {{amount}}',
    contact: 'Kontakt: {{method}}',
    yourQuote: 'Ihr Angebot',
    proceedPayment: 'Weiter zur Zahlung',
    validUntil: 'Gültig bis {{date}}',
    quoteExpired: 'Das Angebot ist abgelaufen – bitte neue Anfrage stellen.',
    reviewing:
      'Wir prüfen Ihre Anfrage. Ein Angebot trifft innerhalb von 24 Stunden ein.',
    cancel: 'Anfrage stornieren',
    cancelTitle: 'Diese Anfrage stornieren?',
    cancelMessageQuoted:
      'Ihr Angebot wird verworfen und dies kann nicht rückgängig gemacht werden.',
    cancelMessagePlain:
      'Dies kann nicht rückgängig gemacht werden — Sie müssten eine neue Anfrage stellen.',
    cancelConfirm: 'Ja, stornieren',
    cancelKeep: 'Behalten',
  },

  notifications: {
    title: 'Benachrichtigungen',
    markAllRead: 'Alle als gelesen markieren ({{count}})',
    empty: 'Noch keine Benachrichtigungen.',
  },

  notificationSettings: {
    title: 'Benachrichtigungen',
    subtitle: 'So halten wir Sie auf dem Laufenden',
    inAppTitle: 'In-App-Benachrichtigungen',
    inAppDesc: 'Angebots- und Anfrage-Updates in Ihrem Posteingang.',
    alwaysOn: 'Immer aktiv',
    pushTitle: 'Push-Benachrichtigungen',
    pushDesc: 'Demnächst — Updates auch bei geschlossener App.',
  },

  profile: {
    welcomeTitle: 'Willkommen bei LUNOTE',
    welcomeSubtitle: 'Melden Sie sich an, um Anfragen, Angebote und Zahlungen zu verwalten.',
    login: 'Anmelden',
    createAccount: 'Konto erstellen',
    changePhoto: 'Profilfoto ändern',
    accountDetails: 'Kontodaten',
    language: 'Sprache',
    notifications: 'Benachrichtigungen',
    support: 'Support',
    logOut: 'Abmelden',
    logoutTitle: 'Von LUNOTE abmelden?',
    logoutMessage: 'Sie können sich jederzeit wieder mit E-Mail und Passwort anmelden.',
    logoutStay: 'Bleiben',
  },

  account: {
    title: 'Kontodaten',
    profileSection: 'Profil',
    email: 'E-Mail',
    firstName: 'Vorname',
    lastName: 'Nachname',
    realNameNote:
      'Verwenden Sie Ihren echten Namen — daran erkennt Sie unser Team bei Angeboten und Zahlungen.',
    saved: 'Gespeichert.',
    saveName: 'Namen speichern',
    securitySection: 'Sicherheit',
    changePassword: 'Passwort ändern',
    confirmTitle: 'Namen aktualisieren?',
    confirmMessage:
      'Ihr Name wird zu "{{name}}" geändert. Unser Team erkennt Sie daran.',
    save: 'Speichern',
    goBack: 'Zurück',
  },

  language: {
    title: 'Sprache',
    subtitle: 'Wählen Sie Ihre bevorzugte Sprache',
    note: 'Die App wechselt sofort zur gewählten Sprache.',
  },

  chooseLanguage: {
    title: 'Wählen Sie Ihre Sprache',
    subtitle: 'Sie können dies jederzeit in Ihrem Profil ändern.',
    continue: 'Weiter',
  },

  welcome: {
    title: 'Willkommen bei LUNOTE! 🎉',
    tagline: 'Ihr Rundum-Concierge für das Leben in Korea',
    intro1: 'Das Leben in Korea kann kompliziert sein. LUNOTE macht es einfacher.',
    intro2: 'Brauchen Sie Hilfe bei Wohnen, Visa, Krankenhäusern, Banken, Mobilfunk oder anderen Themen rund um das Leben in Korea? Sagen Sie uns einfach, was Sie brauchen.',
    howTitle: 'So funktioniert es',
    step1Title: '1. Sagen Sie uns, was Sie brauchen',
    step1Body: 'Wählen Sie eine Kategorie, den passenden Service und beschreiben Sie Ihr Anliegen.',
    step2Title: '2. Erhalten Sie ein persönliches Angebot',
    step2Body: 'Wir prüfen Ihre Anfrage und besprechen Leistung und Preis mit Ihnen, bevor es losgeht.',
    step3Title: '3. Bezahlen & Unterstützung erhalten',
    step3Body: 'Sobald wir uns über Leistung und Preis einig sind, zahlen Sie einfach über LUNOTE — und wir legen los.',
    solutionTitle: 'Eine Anfrage. Die richtige Lösung.',
    solutionBody1: 'LUNOTE ist ein Concierge-Service. Je nach Anfrage unterstützen wir Sie direkt oder vermitteln Ihnen die passende qualifizierte Fachkraft oder den passenden Dienstleister.',
    solutionBody2: 'Sie müssen nicht herausfinden, wen Sie kontaktieren oder wo Sie anfangen sollen.',
    solutionCta: 'Sagen Sie LUNOTE einfach, was Sie brauchen.',
    cta: 'Erste Anfrage stellen',
    later: 'Erst die App erkunden',
  },

  support: {
    title: 'Support',
    subtitle: 'Wir helfen Ihnen gerne',
    faqLabel: 'FAQ',
    faq1q: 'Wie schnell erhalte ich mein Angebot?',
    faq1a: 'Wir prüfen jede Anfrage und senden innerhalb von 24 Stunden ein Angebot. Sie werden benachrichtigt, sobald es eintrifft.',
    faq2q: 'Kann ich eine Anfrage stornieren?',
    faq2a: 'Ja — öffnen Sie die Anfrage und tippen Sie jederzeit vor der Zahlung auf "Anfrage stornieren". Nach der Zahlung wenden Sie sich an den Support und wir helfen Ihnen.',
    faq3q: 'Wie bezahle ich?',
    faq3a: 'Sobald Ihr Angebot bereit ist, können Sie in der App mit internationalen Karten bezahlen. Die Zahlungsfunktion wird gerade fertiggestellt und ist bald verfügbar.',
    faq4q: 'Welche Sprachen unterstützen Sie?',
    faq4a: 'Die App ist in sechs Sprachen verfügbar, und unser Concierge-Team unterstützt Sie auf Englisch und Koreanisch.',
    contactLabel: 'Kontakt',
    contactNote:
      'Keine Antwort gefunden? Schreiben Sie uns eine E-Mail und wir melden uns innerhalb eines Werktags.',
    emailSupport: 'Support kontaktieren',
    version: 'LUNOTE v{{version}}',
  },
};

export default de;
