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
    greeting: 'Hello 👋',
    greetingNamed: 'Hello {{name}} 👋',
    subtitle: 'How can we help you settle in Korea?',
    notifications: 'Notifications',
    requestQuote: 'Request a Quote',
    requestQuoteSub: 'Tell us what you need — we’ll handle the rest',
    categoriesLabel: 'CATEGORIES',
    recentLabel: 'RECENT REQUESTS',
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
    budget: 'Desired budget (optional, USD)',
    budgetPlaceholder: '400',
    description: 'What do you need? (at least 10 characters)',
    descriptionPlaceholder:
      'Describe your situation — the more detail, the better the quote.',
    attachments: 'Attachments (optional, up to {{max}} — photos or PDF)',
    photo: 'PHOTO',
    pdf: 'PDF',
    contactLabel: 'How should we contact you?',
    contactPlaceholder: 'Choose a contact method',
    contactNote:
      'Our team will reach out through this method to discuss your quote.',
    submit: 'Send a Request',
    reviewNote: 'We will review your request and send a quote within 24 hours.',
    budgetError: 'Desired budget must be a positive number',
  },

  payment: {
    title: 'Payments',
    subtitle: 'Review quotes and complete payments',
    emptyGuest: 'Log in to review quotes and payments.',
    login: 'Log in',
    emptyNone: 'Nothing to pay yet — quotes will appear here.',
    payNow: 'Pay now',
  },

  requestDetail: {
    title: 'Request #{{id}}',
    requested: 'Requested {{date}}',
    budgetSuffix: ' · Budget {{amount}}',
    contact: 'Contact: {{method}}',
    yourQuote: 'YOUR QUOTE',
    proceedPayment: 'Proceed to payment',
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
    profileSection: 'PROFILE',
    email: 'Email',
    firstName: 'First name',
    lastName: 'Last name',
    realNameNote:
      'Use your real name — it’s how our team identifies you for quotes and payments.',
    saved: 'Saved.',
    saveName: 'Save name',
    securitySection: 'SECURITY',
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
    contactLabel: 'CONTACT',
    contactNote:
      'Can’t find your answer? Email us and we’ll get back to you within one business day.',
    emailSupport: 'Email support',
    version: 'LUNOTE v{{version}}',
  },
};

export default en;
