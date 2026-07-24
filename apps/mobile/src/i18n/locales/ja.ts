import type { Resources } from '../index';

const ja: Resources = {
  brand: {
    tagline: '韓国での暮らしを、もっと簡単に',
  },

  common: {
    somethingWrong: '問題が発生しました',
    uploadFailed: 'アップロードに失敗しました',
    login: 'ログイン',
  },

  tabs: {
    home: 'ホーム',
    quote: '見積もり',
    payment: '支払い',
    profile: 'プロフィール',
  },

  status: {
    reviewing: '確認中',
    quoted: '見積もり完了',
    paid: '支払い済み',
    inProgress: '対応中',
    completed: '完了',
    cancelled: 'キャンセル',
    refunded: '返金済み',
  },

  categories: {
    HOUSING: '住まい',
    VISA: 'ビザ',
    HOSPITAL: '病院',
    BANK: '銀行',
    TELECOM: '通信',
    OTHER: 'その他',
  },

  contactChannels: {
    email: 'メール',
    phone: '電話',
    whatsapp: 'WhatsApp',
  },

  password: {
    policy:
      'パスワードは8文字以上で、英字・数字・記号をそれぞれ含めてください',
    placeholder: '8文字以上・数字と記号を含む',
  },

  home: {
    greeting: 'こんにちは 👋',
    greetingNamed: '{{name}}さん、こんにちは 👋',
    subtitle: '韓国での生活、どんなことをお手伝いしましょうか？',
    notifications: 'お知らせ',
    requestQuote: '見積もりを依頼',
    requestQuoteSub: 'ご要望をお聞かせください。あとはお任せください',
    categoriesLabel: 'カテゴリー',
    recentLabel: '最近の依頼',
    recentEmptyAuthed: 'ご依頼はここに表示されます。',
    recentEmptyGuest: 'ログインすると依頼の作成と管理ができます。',
  },

  login: {
    emailLabel: 'メール',
    passwordLabel: 'パスワード',
    forgotPassword: 'パスワードをお忘れですか？',
    submit: 'ログイン',
    orContinueWith: 'または以下の方法で続ける',
    continueGoogle: 'Googleで続ける',
    continueApple: 'Appleで続ける',
    continueGuest: '← ゲストのまま閲覧を続ける',
    newToLunote: 'LUNOTEは初めてですか？ ',
    createAccount: 'アカウント作成',
  },

  signup: {
    title: 'アカウント作成',
    subtitle: 'LUNOTEで韓国での生活を始めましょう',
    firstName: '名',
    lastName: '姓',
    email: 'メール',
    password: 'パスワード',
    submit: 'アカウント作成',
    alreadyHaveAccount: 'すでにアカウントをお持ちですか？ ',
    logIn: 'ログイン',
  },

  verifyEmail: {
    title: 'メールをご確認ください',
    subtitle: '6桁のコードを送信しました',
    yourEmail: 'ご登録のメール',
    verify: '認証する',
    resendCode: 'コードを再送信',
    logOut: 'ログアウト',
    codeSent: '新しいコードをメールに送信しました。',
  },

  forgotPassword: {
    resetTitle: 'パスワードの再設定',
    requestSubtitle: 'アカウントのメールを入力すると、6桁のコードをお送りします。',
    resetSubtitle: '以下宛てにコードを送信しました',
    email: 'メール',
    sendCode: '再設定コードを送信',
    newPassword: '新しいパスワード',
    newPasswordPlaceholder: '8文字以上',
    setNewPassword: '新しいパスワードを設定',
    resendCode: 'コードを再送信',
    backToLogin: '← ログインに戻る',
    codeResent: 'メールが存在する場合、新しいコードを送信しました。',
    doneTitle: 'パスワードを更新しました',
    doneSubtitle: '新しいパスワードでログインしてください。',
    doneButton: 'ログインに戻る',
  },

  changePassword: {
    title: 'パスワードの変更',
    current: '現在のパスワード',
    newLabel: '新しいパスワード',
    confirm: '新しいパスワードの確認',
    confirmPlaceholder: '新しいパスワードを再入力',
    mismatch: '新しいパスワードが一致しません',
    submit: 'パスワードを変更',
    confirmTitle: 'パスワードを変更しますか？',
    confirmMessage: '次回のログインから新しいパスワードをご利用いただけます。',
    goBack: '戻る',
    doneTitle: 'パスワードを変更しました',
    doneSubtitle: '次回のログイン時に新しいパスワードをご利用ください。',
    done: '完了',
  },

  quoteList: {
    title: '依頼一覧',
    subtitle: 'ご依頼の状況を確認できます',
    emptyGuest: 'ログインすると依頼の作成と管理ができます。',
    login: 'ログイン',
    emptyNone: 'まだ依頼がありません。ご要望をお聞かせください。',
    requestQuote: '見積もりを依頼',
  },

  quoteRequest: {
    title: '見積もりを依頼',
    category: 'カテゴリー',
    budget: 'ご希望の予算（任意・USD）',
    budgetPlaceholder: '400',
    description: 'ご要望をお聞かせください（10文字以上）',
    descriptionPlaceholder:
      'ご状況をご記入ください。詳しいほど正確な見積もりが可能です。',
    attachments: '添付ファイル（任意・最大{{max}}件・写真またはPDF）',
    photo: '写真',
    pdf: 'PDF',
    contactLabel: 'ご連絡方法を選んでください',
    contactPlaceholder: '連絡方法を選択',
    contactNote:
      'いただいた連絡方法で、見積もりについてチームよりご連絡します。',
    submit: '依頼を送信',
    reviewNote: 'ご依頼を確認し、24時間以内に見積もりをお送りします。',
    budgetError: 'ご希望の予算は正の数で入力してください',
  },

  payment: {
    title: '支払い',
    subtitle: '見積もりの確認とお支払いができます',
    emptyGuest: 'ログインすると見積もりと支払いを確認できます。',
    login: 'ログイン',
    emptyNone: 'まだお支払いはありません。見積もりはここに表示されます。',
    payNow: '今すぐ支払う',
    expired: '期限切れ',
  },

  requestDetail: {
    title: '依頼 #{{id}}',
    requested: '依頼日 {{date}}',
    budgetSuffix: ' · 予算 {{amount}}',
    contact: '連絡方法：{{method}}',
    yourQuote: '見積もり',
    proceedPayment: '支払いに進む',
    validUntil: '{{date}}まで有効',
    quoteExpired: 'お見積もりの有効期限が切れました。新しい依頼を作成してください。',
    reviewing:
      'ご依頼を確認中です。24時間以内に見積もりが届きます。',
    cancel: '依頼をキャンセル',
    cancelTitle: 'この依頼をキャンセルしますか？',
    cancelMessageQuoted:
      '見積もりは破棄され、この操作は取り消せません。',
    cancelMessagePlain:
      'この操作は取り消せません。改めて依頼を作成する必要があります。',
    cancelConfirm: 'はい、キャンセルします',
    cancelKeep: 'そのままにする',
  },

  notifications: {
    title: 'お知らせ',
    markAllRead: 'すべて既読にする（{{count}}）',
    empty: 'まだお知らせはありません。',
  },

  notificationSettings: {
    title: 'お知らせ',
    subtitle: '最新情報のお届け方法',
    inAppTitle: 'アプリ内通知',
    inAppDesc: '見積もりや依頼の更新をお知らせボックスでお届けします。',
    alwaysOn: '常にオン',
    pushTitle: 'プッシュ通知',
    pushDesc: '近日公開。アプリを閉じていても更新をお届けします。',
  },

  profile: {
    welcomeTitle: 'LUNOTEへようこそ',
    welcomeSubtitle: 'ログインして依頼・見積もり・支払いを管理しましょう。',
    login: 'ログイン',
    createAccount: 'アカウント作成',
    changePhoto: 'プロフィール写真を変更',
    accountDetails: 'アカウント情報',
    language: '言語',
    notifications: 'お知らせ',
    support: 'サポート',
    logOut: 'ログアウト',
    logoutTitle: 'LUNOTEからログアウトしますか？',
    logoutMessage: 'メールとパスワードでいつでも再ログインできます。',
    logoutStay: 'そのままにする',
  },

  account: {
    title: 'アカウント情報',
    profileSection: 'プロフィール',
    email: 'メール',
    firstName: '名',
    lastName: '姓',
    realNameNote:
      '本名をご入力ください。見積もりや支払いの際にチームが本人確認に使用します。',
    saved: '保存しました。',
    saveName: '名前を保存',
    securitySection: 'セキュリティ',
    changePassword: 'パスワードの変更',
    confirmTitle: '名前を更新しますか？',
    confirmMessage:
      '名前を「{{name}}」に変更します。チームが本人確認に使用します。',
    save: '保存',
    goBack: '戻る',
  },

  language: {
    title: '言語',
    subtitle: 'ご希望の言語を選択してください',
    note: '選択するとすぐにアプリの表示言語が切り替わります。',
  },

  support: {
    title: 'サポート',
    subtitle: 'お手伝いします',
    faqLabel: 'FAQ',
    faq1q: '見積もりはどのくらいで届きますか？',
    faq1a: 'すべてのご依頼を確認し、24時間以内に見積もりをお送りします。届いた際には通知でお知らせします。',
    faq2q: '依頼をキャンセルできますか？',
    faq2a: 'はい。お支払い前であればいつでも依頼を開いて「依頼をキャンセル」をタップできます。お支払い後はサポートまでご連絡ください。対応いたします。',
    faq3q: 'どのように支払いますか？',
    faq3a: '見積もりの準備ができたら、国際カードでアプリ内からお支払いいただけます。支払い機能は最終調整中で、まもなくご利用いただけます。',
    faq4q: '対応している言語は？',
    faq4a: 'アプリは6言語に対応しており、コンシェルジュチームは英語と韓国語でサポートいたします。',
    contactLabel: 'お問い合わせ',
    contactNote:
      '答えが見つかりませんか？メールでお問い合わせください。1営業日以内にご返信します。',
    emailSupport: 'メールで問い合わせる',
    version: 'LUNOTE v{{version}}',
  },
};

export default ja;
