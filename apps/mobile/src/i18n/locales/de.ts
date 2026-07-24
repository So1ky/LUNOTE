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
    greeting: 'Hallo 👋',
    greetingNamed: 'Hallo {{name}} 👋',
    subtitle: 'Wie können wir Ihnen beim Einleben in Korea helfen?',
    notifications: 'Benachrichtigungen',
    requestQuote: 'Angebot anfragen',
    requestQuoteSub: 'Sagen Sie uns, was Sie brauchen — den Rest übernehmen wir',
    categoriesLabel: 'KATEGORIEN',
    recentLabel: 'LETZTE ANFRAGEN',
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
    budget: 'Wunschbudget (optional, USD)',
    budgetPlaceholder: '400',
    description: 'Was brauchen Sie? (mindestens 10 Zeichen)',
    descriptionPlaceholder:
      'Beschreiben Sie Ihre Situation — je mehr Details, desto besser das Angebot.',
    attachments: 'Anhänge (optional, bis zu {{max}} — Fotos oder PDF)',
    photo: 'FOTO',
    pdf: 'PDF',
    contactLabel: 'Wie sollen wir Sie kontaktieren?',
    contactPlaceholder: 'Kontaktmethode wählen',
    contactNote:
      'Unser Team meldet sich auf diesem Weg, um Ihr Angebot zu besprechen.',
    submit: 'Anfrage senden',
    reviewNote: 'Wir prüfen Ihre Anfrage und senden innerhalb von 24 Stunden ein Angebot.',
    budgetError: 'Das Wunschbudget muss eine positive Zahl sein',
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
    yourQuote: 'IHR ANGEBOT',
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
    profileSection: 'PROFIL',
    email: 'E-Mail',
    firstName: 'Vorname',
    lastName: 'Nachname',
    realNameNote:
      'Verwenden Sie Ihren echten Namen — daran erkennt Sie unser Team bei Angeboten und Zahlungen.',
    saved: 'Gespeichert.',
    saveName: 'Namen speichern',
    securitySection: 'SICHERHEIT',
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
    contactLabel: 'KONTAKT',
    contactNote:
      'Keine Antwort gefunden? Schreiben Sie uns eine E-Mail und wir melden uns innerhalb eines Werktags.',
    emailSupport: 'Support kontaktieren',
    version: 'LUNOTE v{{version}}',
  },
};

export default de;
