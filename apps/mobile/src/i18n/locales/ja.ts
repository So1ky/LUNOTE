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
    greeting: 'こんにちは',
    greetingNamed: '{{name}}さん、こんにちは',
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
    service: 'サービス項目',
    servicePlaceholder: 'サービスを選択',
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

  services: {
    customQuote: 'カスタム見積もり',
    HOUSING_1: {
      title: '住まい探し・エリアガイド',
      desc: '韓国の街の情報、賃貸の種類、保証金・家賃、住居用語、家の探し方についてご案内します。\n\n含まれるもの: 一般的な住居情報と探し方のご案内\n含まれないもの: 不動産仲介、価格交渉',
    },
    HOUSING_2: {
      title: '不動産コミュニケーション支援',
      desc: 'お客様が選んだ不動産会社、大家、住宅提供者と連絡する際の言語・コミュニケーションを支援します。\n\n含まれるもの: 電話、メッセージ、約束の調整\n含まれないもの: 代理での仲介・交渉',
    },
    HOUSING_3: {
      title: '内見の通訳・同行',
      desc: '物件の内見に現地で同行し、サポートします。\n\n含まれるもの: 一般的な通訳とコミュニケーション支援\n含まれないもの: 不動産仲介、契約交渉、法律相談',
    },
    HOUSING_4: {
      title: '入居・公共サービス手続き支援',
      desc: '入居手続きや、公共料金・生活設備に関するやり取りをお手伝いします。\n\n例: 電気、ガス、水道、インターネット、管理事務所',
    },
    HOUSING_5: {
      title: 'その他の住まいのご依頼',
      desc: '必要な内容をお知らせいただければ、LUNOTEが検討してご連絡します。',
    },
    VISA_1: {
      title: 'ビザ情報・チェックリスト',
      desc: '公開されている出入国情報に基づいた一般的なご案内をします。\n\n例: 必要書類、出入国手続き、申請場所、全体の流れのご案内',
    },
    VISA_2: {
      title: '出入国ウェブサイト・予約支援',
      desc: '韓国の出入国関連ウェブサイトの使い方や予約手続きの理解をお手伝いします。',
    },
    VISA_3: {
      title: '書類整理・言語支援',
      desc: '出入国手続きに必要な書類の理解と整理をお手伝いします。\n\n専門資格や法的資格が必要な業務は、必要に応じて適切な専門家におつなぎします。',
    },
    VISA_4: {
      title: '出入国管理事務所への同行',
      desc: '出入国管理事務所を訪問する際、一般的な通訳とコミュニケーションを支援します。\n\n法的に認められている場合を除き、LUNOTEが出入国の代理人になることはありません。',
    },
    VISA_5: {
      title: 'その他のビザのご依頼',
      desc: 'ご状況をお聞かせいただければ、どのような支援が可能か検討します。',
    },
    HOSPITAL_1: {
      title: '韓国医療ナビゲーション',
      desc: '韓国の医療の仕組みについて、一般的なご案内をします。\n\n例: 症状に応じた診療科の目安、病院・クリニックの利用方法、通院に関する一般情報\n\n医学的な助言や診断は行いません。',
    },
    HOSPITAL_2: {
      title: '病院コミュニケーション支援',
      desc: 'すでに利用中、またはお客様が選んだ医療機関とのやり取りで言語を支援します。\n\n例: 電話のサポート、一般的な問い合わせ、日程のやり取り',
    },
    HOSPITAL_3: {
      title: '通院の通訳・同行',
      desc: '通院時に、現地での言語と一般的な事務手続きをサポートします。\n\n公認の専門通訳が必要な医療通訳ではありません。',
    },
    HOSPITAL_4: {
      title: '医療書類・通訳者の手配',
      desc: '一般的な病院の書類の理解を助け、必要に応じて適切な専門通訳者やサービス提供者を手配します。\n\n専門通訳者の費用は別途かかります。',
    },
    HOSPITAL_5: {
      title: 'その他の医療のご依頼',
      desc: '必要なサポートをお聞かせいただければ、LUNOTEが検討します。',
    },
    BANK_1: {
      title: '銀行口座開設ガイド',
      desc: '韓国で銀行口座を開設する際に一般的に必要な書類と手続きをご案内します。',
    },
    BANK_2: {
      title: '銀行アプリ・認証支援',
      desc: 'モバイルバンキング、韓国の銀行アプリ、本人認証、一般的な銀行サービスの設定手順の理解をお手伝いします。',
    },
    BANK_3: {
      title: '銀行窓口の通訳・同行',
      desc: '銀行での言語とコミュニケーションを現地でサポートします。',
    },
    BANK_4: {
      title: '海外送金手続き支援',
      desc: '海外送金の手続きの理解と、銀行とのやり取りをお手伝いします。\n\nLUNOTEは金融アドバイスや金融商品の推奨は行いません。',
    },
    BANK_5: {
      title: 'その他の銀行のご依頼',
      desc: 'どのような銀行関連のお困りごとがあるかお聞かせください。',
    },
    TELECOM_1: {
      title: 'SIM/eSIM・料金プランガイド',
      desc: '韓国のSIMカード、eSIM、携帯料金プランについてご案内します。',
    },
    TELECOM_2: {
      title: '携帯契約サポート',
      desc: '韓国の携帯サービスを契約する際のやり取りと手続きをお手伝いします。\n\nキャリアの料金やプラン費用は別途かかります。',
    },
    TELECOM_3: {
      title: '自宅インターネット開通支援',
      desc: '利用可能なインターネットサービスの理解と、設置手続きの調整をお手伝いします。',
    },
    TELECOM_4: {
      title: '通信会社カスタマーサポート支援',
      desc: '通信会社とのやり取りをお手伝いします。\n\n例: プラン変更、料金の問い合わせ、解約、技術サポートとのやり取り',
    },
    TELECOM_5: {
      title: 'その他の通信・ネットのご依頼',
      desc: 'どのようなサポートが必要かお聞かせください。',
    },
    OTHER_1: {
      title: '官公庁の利用案内',
      desc: '韓国の公共サービスを利用する際、一般的なご案内と言語支援をします。\n\n法律上、専門的な行政業務が必要な場合は、適切な専門家におつなぎします。',
    },
    OTHER_2: {
      title: '韓国語の電話・連絡支援',
      desc: '韓国語での電話を代わりにかけたり、サポートしたりする人が必要ですか?\n\n例: カスタマーサービス、予約、一般的な問い合わせ、サービス業者',
    },
    OTHER_3: {
      title: '学校・保育情報支援',
      desc: '保育園、幼稚園、学校、塾、子ども向けサービスについての調査とやり取りをサポートします。',
    },
    OTHER_4: {
      title: '韓国生活コンシェルジュ',
      desc: 'ぴったりのカテゴリーが見つかりませんか？解決したいことをLUNOTEにお知らせください。\n\n問題の調査、韓国のサービス業者とのやり取り、次のステップの調整、適切な専門家へのご紹介などをお手伝いできます。',
    },
    OTHER_5: {
      title: 'その他のご依頼',
      desc: '必要な内容をご記入ください。',
    },
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

  chooseLanguage: {
    title: '言語を選択してください',
    subtitle: 'プロフィールからいつでも変更できます。',
    continue: '続ける',
  },

  welcome: {
    title: 'LUNOTEへようこそ！🎉',
    tagline: '韓国生活のワンストップ・コンシェルジュ',
    intro1: '韓国での生活は複雑になりがちです。LUNOTEがもっと簡単にします。',
    intro2: '住まい、ビザ、病院、銀行、通信など、韓国生活に関するお手伝いが必要ですか？必要なことを教えてください。',
    howTitle: 'ご利用の流れ',
    step1Title: '1. 必要なことを教えてください',
    step1Body: 'カテゴリーと必要なサービスを選び、依頼内容をお知らせください。',
    step2Title: '2. あなたに合わせた見積もりを受け取る',
    step2Body: 'ご依頼を確認し、開始前にサービス内容と料金についてご相談します。',
    step3Title: '3. 支払ってサポートを受ける',
    step3Body: 'サービス内容と料金に合意したら、LUNOTEでお支払いください。すぐに開始します。',
    solutionTitle: 'ひとつの依頼で、最適な解決を。',
    solutionBody1: 'LUNOTEはコンシェルジュサービスです。ご依頼の内容に応じて、私たちが直接サポートするか、適切な資格を持つ専門家やサービス提供者におつなぎします。',
    solutionBody2: '誰に連絡すべきか、どこから始めるべきか悩む必要はありません。',
    solutionCta: '必要なことをLUNOTEに伝えるだけ。',
    cta: '最初の依頼を作成',
    later: 'まずはアプリを見てみる',
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
