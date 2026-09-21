/**
 * 영어 원본 카탈로그 — 모든 로케일의 단일 소스(source of truth).
 * 다른 로케일(ko/ja/zh/es/de)은 이 파일의 키 구조와 정확히 일치해야 한다
 * (i18n/index.ts의 Resources 타입이 컴파일 타임에 강제한다).
 *
 * 규칙:
 * - 보간 변수는 i18n-js 기본 문법 `{{var}}`를 쓴다.
 * - 이모지·문장부호는 번역해도 그대로 유지한다.
 * - 서버가 내려주는 문자열(견적 explanation, 알림 title/body)은 여기 대상이 아니다.
 */
const en = {
  brand: {
    tagline: 'Life in Korea, made easy',
  },

  common: {
    somethingWrong: 'Something went wrong',
    uploadFailed: 'Upload failed',
    login: 'Log in',
  },

  tabs: {
    home: 'Home',
    quote: 'Quote',
    payment: 'Payment',
    profile: 'Profile',
  },

  status: {
    reviewing: 'Reviewing',
    quoted: 'Quote ready',
    paid: 'Paid',
    inProgress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  },

  categories: {
    HOUSING: 'Housing',
    VISA: 'Visa',
    HOSPITAL: 'Hospital',
    BANK: 'Bank',
    TELECOM: 'Telecom',
    OTHER: 'Other',
  },

  contactChannels: {
    email: 'Email',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
  },

  password: {
    policy:
      'Password must be 8+ characters and include a letter, a number, and a special character',
    placeholder: '8+ chars with a number & symbol',
  },

  home: {
    greeting: 'Hello',
    greetingNamed: 'Hello, {{name}}',
    subtitle: 'How can we help you settle in Korea?',
    notifications: 'Notifications',
    requestQuote: 'Request a Quote',
    requestQuoteSub: 'Tell us what you need — we’ll handle the rest',
    categoriesLabel: 'Categories',
    recentLabel: 'Recent Requests',
    recentEmptyAuthed: 'Your requests will appear here.',
    recentEmptyGuest: 'Log in to create and track your requests.',
  },

  login: {
    emailLabel: 'Email',
    passwordLabel: 'Password',
    forgotPassword: 'Forgot password?',
    submit: 'Log in',
    orContinueWith: 'or continue with',
    continueGoogle: 'Continue with Google',
    continueApple: 'Continue with Apple',
    continueGuest: '← Continue browsing as guest',
    newToLunote: 'New to LUNOTE? ',
    createAccount: 'Create account',
  },

  signup: {
    title: 'Create account',
    subtitle: 'Start your life in Korea with LUNOTE',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    password: 'Password',
    submit: 'Create account',
    alreadyHaveAccount: 'Already have an account? ',
    logIn: 'Log in',
  },

  verifyEmail: {
    title: 'Check your email',
    subtitle: 'We sent a 6-digit code to',
    yourEmail: 'your email',
    verify: 'Verify',
    resendCode: 'Resend code',
    logOut: 'Log out',
    codeSent: 'A new code has been sent to your email.',
  },

  forgotPassword: {
    resetTitle: 'Reset password',
    requestSubtitle: 'Enter your account email and we’ll send a 6-digit code.',
    resetSubtitle: 'Enter the code sent to',
    email: 'Email',
    sendCode: 'Send reset code',
    newPassword: 'New password',
    newPasswordPlaceholder: 'At least 8 characters',
    setNewPassword: 'Set new password',
    resendCode: 'Resend code',
    backToLogin: '← Back to log in',
    codeResent: 'If the email exists, a new code has been sent.',
    doneTitle: 'Password updated',
    doneSubtitle: 'Log in with your new password.',
    doneButton: 'Back to log in',
  },

  changePassword: {
    title: 'Change password',
    current: 'Current password',
    newLabel: 'New password',
    confirm: 'Confirm new password',
    confirmPlaceholder: 'Re-enter new password',
    mismatch: 'New passwords do not match',
    submit: 'Change password',
    confirmTitle: 'Change your password?',
    confirmMessage: "You'll use the new password from your next login.",
    goBack: 'Go back',
    doneTitle: 'Password changed',
    doneSubtitle: 'Use your new password the next time you log in.',
    done: 'Done',
  },

  quoteList: {
    title: 'My Requests',
    subtitle: 'Track the status of your requests',
    emptyGuest: 'Log in to create and track your requests.',
    login: 'Log in',
    emptyNone: 'No requests yet — tell us what you need.',
    requestQuote: 'Request a Quote',
  },

  quoteRequest: {
    title: 'Request a Quote',
    category: 'Category',
    service: 'Service Type',
    servicePlaceholder: 'Choose a service',
    budget: 'Desired budget (optional, USD)',
    budgetPlaceholder: '400',
    description: 'What do you need? (at least 10 characters)',
    descriptionPlaceholder:
      'Describe your situation — the more detail, the better the quote.',
    attachments: 'Attachments (optional, up to {{max}} — photos or PDF)',
    photo: 'Photo',
    pdf: 'PDF',
    contactLabel: 'How should we contact you?',
    contactPlaceholder: 'Choose a contact method',
    contactNote:
      'Our team will reach out through this method to discuss your quote.',
    submit: 'Send a Request',
    reviewNote: 'We will review your request and send a quote within 24 hours.',
    budgetError: 'Desired budget must be a positive number',
  },

  // 카테고리별 정형 서비스 항목 (SERVICE_CATALOG의 id와 키가 일치해야 한다)
  services: {
    customQuote: 'Custom Quote',
    HOUSING_1: {
      title: 'Housing Search & Area Guide',
      desc: 'Help understanding neighborhoods, rental types, deposits, monthly rent, housing terminology and how to search for housing in Korea.\n\nIncludes: General housing information and search guidance\nDoes not include: Real-estate brokerage or price negotiation',
    },
    HOUSING_2: {
      title: 'Real Estate Communication Support',
      desc: 'Language and communication support when contacting a real-estate agency, landlord or housing provider selected by you.\n\nIncludes: Calls, messages and appointment coordination\nDoes not include: Brokerage or negotiation on your behalf',
    },
    HOUSING_3: {
      title: 'Property Viewing Interpretation & Accompaniment',
      desc: 'In-person assistance during a property viewing.\n\nIncludes: General interpretation and communication assistance\nDoes not include: Real-estate brokerage, contract negotiation or legal advice',
    },
    HOUSING_4: {
      title: 'Move-in & Utility Setup Support',
      desc: 'Help with moving-in procedures and communication regarding utilities and everyday housing setup.\n\nExamples: electricity, gas, water, internet, building management office',
    },
    HOUSING_5: {
      title: 'Other Housing Request',
      desc: 'Tell us what you need and LUNOTE will review your request.',
    },
    VISA_1: {
      title: 'Visa Information & Checklist',
      desc: 'General guidance based on publicly available immigration information.\n\nExamples: required documents, immigration procedures, where to apply, general process guidance',
    },
    VISA_2: {
      title: 'Immigration Website & Appointment Support',
      desc: 'Help navigating Korean immigration websites and understanding the reservation process.',
    },
    VISA_3: {
      title: 'Document Organization & Language Support',
      desc: 'Help understanding and organizing documents required for immigration procedures.\n\nProfessional or legally regulated work will be referred to an appropriate qualified professional when necessary.',
    },
    VISA_4: {
      title: 'Immigration Office Accompaniment',
      desc: 'General interpretation and communication support when visiting an immigration office.\n\nLUNOTE does not act as your immigration representative unless legally permitted.',
    },
    VISA_5: {
      title: 'Other Visa Request',
      desc: 'Describe your situation and we will review what type of support can be provided.',
    },
    HOSPITAL_1: {
      title: 'Korea Healthcare Navigation',
      desc: 'General help understanding how healthcare works in Korea.\n\nExamples: which medical department may handle a particular type of issue, how hospitals and clinics operate, general information about visiting a hospital\n\nThis service does not provide medical advice or diagnosis.',
    },
    HOSPITAL_2: {
      title: 'Hospital Communication Support',
      desc: 'Language assistance when communicating with a medical institution you are already using or have selected.\n\nExamples: phone call assistance, general questions, schedule communication',
    },
    HOSPITAL_3: {
      title: 'Hospital Visit Interpretation & Accompaniment',
      desc: 'In-person language and general administrative assistance during your hospital visit.\n\nThis is not medical interpretation where certified professional interpretation is required.',
    },
    HOSPITAL_4: {
      title: 'Medical Document & Interpreter Coordination',
      desc: 'Help understanding general hospital documents or arranging an appropriate professional interpreter or service provider when required.\n\nProfessional interpreter fees are separate.',
    },
    HOSPITAL_5: {
      title: 'Other Healthcare Request',
      desc: 'Describe the help you need and LUNOTE will review your request.',
    },
    BANK_1: {
      title: 'Bank Account Opening Guide',
      desc: 'General information regarding the documents and process commonly required to open a Korean bank account.',
    },
    BANK_2: {
      title: 'Banking App & Authentication Support',
      desc: 'Help understanding the setup process for mobile banking, Korean banking apps, authentication and general banking services.',
    },
    BANK_3: {
      title: 'Bank Visit Interpretation & Accompaniment',
      desc: 'In-person language and communication assistance at a bank.',
    },
    BANK_4: {
      title: 'International Transfer Process Support',
      desc: 'General assistance understanding overseas remittance procedures and communicating with your bank.\n\nLUNOTE does not provide financial advice or recommend financial products.',
    },
    BANK_5: {
      title: 'Other Banking Request',
      desc: 'Tell us what banking-related difficulty you are experiencing.',
    },
    TELECOM_1: {
      title: 'SIM / eSIM & Mobile Plan Guide',
      desc: 'Help understanding Korean SIM cards, eSIMs and mobile plans.',
    },
    TELECOM_2: {
      title: 'Mobile Service Setup Support',
      desc: 'Help with communication and procedures when setting up a Korean mobile service.\n\nCarrier fees and plan costs are separate.',
    },
    TELECOM_3: {
      title: 'Home Internet Setup Support',
      desc: 'Help understanding available internet services and coordinating installation procedures.',
    },
    TELECOM_4: {
      title: 'Telecom Customer Service Support',
      desc: 'Help communicating with telecom providers.\n\nExamples: plan changes, billing questions, cancellation, technical support communication',
    },
    TELECOM_5: {
      title: 'Other Mobile & Internet Request',
      desc: 'Tell us what you need help with.',
    },
    OTHER_1: {
      title: 'Government Office Navigation',
      desc: 'General guidance and language assistance when using Korean public services.\n\nWhere professional administrative work is legally required, LUNOTE will connect you with an appropriate qualified professional.',
    },
    OTHER_2: {
      title: 'Korean Phone Call & Communication Support',
      desc: 'Need someone to make or assist with a Korean-language call?\n\nExamples: customer service, reservations, general inquiries, service providers',
    },
    OTHER_3: {
      title: 'School & Childcare Information Support',
      desc: "General support researching and communicating with daycare centers, kindergartens, schools, academies and children's services.",
    },
    OTHER_4: {
      title: 'Korea Life Concierge',
      desc: "Can't find the right category? Tell LUNOTE what you're trying to solve.\n\nWe can help research the issue, communicate with Korean service providers, coordinate the next steps, or connect you with an appropriate professional.",
    },
    OTHER_5: {
      title: 'Other Request',
      desc: 'Describe what you need.',
    },
  },

  payment: {
    title: 'Payments',
    subtitle: 'Review quotes and complete payments',
    emptyGuest: 'Log in to review quotes and payments.',
    login: 'Log in',
    emptyNone: 'Nothing to pay yet — quotes will appear here.',
    payNow: 'Pay now',
    expired: 'Expired',
  },

  requestDetail: {
    title: 'Request #{{id}}',
    requested: 'Requested {{date}}',
    budgetSuffix: ' · Budget {{amount}}',
    contact: 'Contact: {{method}}',
    yourQuote: 'Your Quote',
    proceedPayment: 'Proceed to payment',
    validUntil: 'Valid until {{date}}',
    quoteExpired: 'This quote has expired — please submit a new request.',
    reviewing:
      'We are reviewing your request. A quote will arrive within 24 hours.',
    cancel: 'Cancel request',
    cancelTitle: 'Cancel this request?',
    cancelMessageQuoted:
      'Your quote will be discarded and this cannot be undone.',
    cancelMessagePlain:
      'This cannot be undone — you would need to submit a new request.',
    cancelConfirm: 'Yes, cancel',
    cancelKeep: 'Keep it',
  },

  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all as read ({{count}})',
    empty: 'No notifications yet.',
  },

  notificationSettings: {
    title: 'Notifications',
    subtitle: 'How we keep you updated',
    inAppTitle: 'In-app notifications',
    inAppDesc: 'Quote and request updates in your notification inbox.',
    alwaysOn: 'Always on',
    pushTitle: 'Push notifications',
    pushDesc: 'Coming soon — get updates even when the app is closed.',
  },

  profile: {
    welcomeTitle: 'Welcome to LUNOTE',
    welcomeSubtitle: 'Log in to manage your requests, quotes and payments.',
    login: 'Log in',
    createAccount: 'Create account',
    changePhoto: 'Change profile photo',
    accountDetails: 'Account details',
    language: 'Language',
    notifications: 'Notifications',
    support: 'Support',
    logOut: 'Log out',
    logoutTitle: 'Log out of LUNOTE?',
    logoutMessage: 'You can log back in anytime with your email and password.',
    logoutStay: 'Stay',
  },

  account: {
    title: 'Account details',
    profileSection: 'Profile',
    email: 'Email',
    firstName: 'First name',
    lastName: 'Last name',
    realNameNote:
      'Use your real name — it’s how our team identifies you for quotes and payments.',
    saved: 'Saved.',
    saveName: 'Save name',
    securitySection: 'Security',
    changePassword: 'Change password',
    confirmTitle: 'Update your name?',
    confirmMessage:
      'Your name will change to "{{name}}". Our team uses it to identify you.',
    save: 'Save',
    goBack: 'Go back',
  },

  language: {
    title: 'Language',
    subtitle: 'Choose your preferred language',
    note: 'The app switches to your selected language right away.',
  },

  chooseLanguage: {
    title: 'Choose your language',
    subtitle: 'You can change this anytime in your profile.',
    continue: 'Continue',
  },

  welcome: {
    title: 'Welcome to LUNOTE! 🎉',
    tagline: 'Your One-Stop Korea Life Concierge',
    intro1: 'Living in Korea can be complicated. LUNOTE is here to make it easier.',
    intro2: 'Need help with housing, visas, hospitals, banking, mobile services, or anything else related to life in Korea? Just tell us what you need.',
    howTitle: 'How it works',
    step1Title: '1. Tell us what you need',
    step1Body: 'Choose a category, select the service you need, and describe your request.',
    step2Title: '2. Get a personalized quote',
    step2Body: "We'll review your request and discuss the service and price with you before anything begins.",
    step3Title: '3. Pay & get support',
    step3Body: "Once we agree on the service and price, simply pay through LUNOTE and we'll get started.",
    solutionTitle: 'One request. The right solution.',
    solutionBody1: 'LUNOTE is a concierge service. Depending on your request, we may assist you directly or connect you with the appropriate qualified professional or service provider.',
    solutionBody2: "You don't need to figure out who to contact or where to start.",
    solutionCta: 'Just tell LUNOTE what you need.',
    cta: 'Make Your First Request',
    later: 'Explore the app first',
  },

  support: {
    title: 'Support',
    subtitle: "We're here to help",
    faqLabel: 'FAQ',
    faq1q: 'How fast will I get my quote?',
    faq1a: 'We review every request and send a quote within 24 hours. You will get a notification the moment it arrives.',
    faq2q: 'Can I cancel a request?',
    faq2a: 'Yes — open the request and tap "Cancel request" any time before payment. After payment, contact support and we will help you.',
    faq3q: 'How do I pay?',
    faq3a: 'Once your quote is ready, you can pay in the app with international cards. Payment support is being finalized and will be available soon.',
    faq4q: 'What languages do you support?',
    faq4a: 'The app is available in six languages, and our concierge team can assist you in English and Korean.',
    contactLabel: 'Contact',
    contactNote:
      'Can’t find your answer? Email us and we’ll get back to you within one business day.',
    emailSupport: 'Email support',
    version: 'LUNOTE v{{version}}',
  },
};

export default en;
