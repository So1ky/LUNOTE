import type { Resources } from '../index';

const zh: Resources = {
  brand: {
    tagline: '在韩生活，轻松无忧',
  },

  common: {
    somethingWrong: '出了点问题',
    uploadFailed: '上传失败',
    login: '登录',
  },

  tabs: {
    home: '首页',
    quote: '报价',
    payment: '支付',
    profile: '我的',
  },

  status: {
    reviewing: '审核中',
    quoted: '报价已出',
    paid: '已支付',
    inProgress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  },

  categories: {
    HOUSING: '住房',
    VISA: '签证',
    HOSPITAL: '医院',
    BANK: '银行',
    TELECOM: '通信',
    OTHER: '其他',
  },

  contactChannels: {
    email: '邮箱',
    phone: '电话',
    whatsapp: 'WhatsApp',
  },

  password: {
    policy:
      '密码需至少 8 位，且包含字母、数字和特殊字符',
    placeholder: '至少 8 位，含数字和符号',
  },

  home: {
    greeting: '你好 👋',
    greetingNamed: '你好 {{name}} 👋',
    subtitle: '我们能如何帮您在韩国安顿下来？',
    notifications: '通知',
    requestQuote: '申请报价',
    requestQuoteSub: '告诉我们您的需求，剩下的交给我们',
    categoriesLabel: '分类',
    recentLabel: '近期申请',
    recentEmptyAuthed: '您的申请将显示在这里。',
    recentEmptyGuest: '登录后即可创建并跟踪您的申请。',
  },

  login: {
    emailLabel: '邮箱',
    passwordLabel: '密码',
    forgotPassword: '忘记密码？',
    submit: '登录',
    orContinueWith: '或使用以下方式',
    continueGoogle: '使用 Google 继续',
    continueApple: '使用 Apple 继续',
    continueGuest: '← 以访客身份继续浏览',
    newToLunote: '第一次使用 LUNOTE？ ',
    createAccount: '注册账号',
  },

  signup: {
    title: '注册账号',
    subtitle: '与 LUNOTE 一起开启您的韩国生活',
    firstName: '名',
    lastName: '姓',
    email: '邮箱',
    password: '密码',
    submit: '注册账号',
    alreadyHaveAccount: '已有账号？ ',
    logIn: '登录',
  },

  verifyEmail: {
    title: '请查收邮件',
    subtitle: '我们已将 6 位验证码发送至',
    yourEmail: '您的邮箱',
    verify: '验证',
    resendCode: '重新发送验证码',
    logOut: '退出登录',
    codeSent: '新验证码已发送至您的邮箱。',
  },

  forgotPassword: {
    resetTitle: '重置密码',
    requestSubtitle: '输入您的账号邮箱，我们将发送 6 位验证码。',
    resetSubtitle: '请输入发送至以下邮箱的验证码',
    email: '邮箱',
    sendCode: '发送重置验证码',
    newPassword: '新密码',
    newPasswordPlaceholder: '至少 8 位',
    setNewPassword: '设置新密码',
    resendCode: '重新发送验证码',
    backToLogin: '← 返回登录',
    codeResent: '如果该邮箱存在，新验证码已发送。',
    doneTitle: '密码已更新',
    doneSubtitle: '请使用新密码登录。',
    doneButton: '返回登录',
  },

  changePassword: {
    title: '修改密码',
    current: '当前密码',
    newLabel: '新密码',
    confirm: '确认新密码',
    confirmPlaceholder: '再次输入新密码',
    mismatch: '两次输入的新密码不一致',
    submit: '修改密码',
    confirmTitle: '确认修改密码？',
    confirmMessage: '新密码将从您下次登录时开始生效。',
    goBack: '返回',
    doneTitle: '密码已修改',
    doneSubtitle: '下次登录时请使用新密码。',
    done: '完成',
  },

  quoteList: {
    title: '我的申请',
    subtitle: '跟踪您的申请状态',
    emptyGuest: '登录后即可创建并跟踪您的申请。',
    login: '登录',
    emptyNone: '还没有申请，告诉我们您的需求吧。',
    requestQuote: '申请报价',
  },

  quoteRequest: {
    title: '申请报价',
    category: '分类',
    budget: '期望预算（选填，USD）',
    budgetPlaceholder: '400',
    description: '您需要什么帮助？（至少 10 个字符）',
    descriptionPlaceholder:
      '描述您的情况，信息越详细，报价越准确。',
    attachments: '附件（选填，最多 {{max}} 个，照片或 PDF）',
    photo: '照片',
    pdf: 'PDF',
    contactLabel: '我们该如何联系您？',
    contactPlaceholder: '选择联系方式',
    contactNote:
      '我们的团队将通过此方式与您联系，商讨您的报价。',
    submit: '提交申请',
    reviewNote: '我们将审核您的申请，并在 24 小时内发送报价。',
    budgetError: '期望预算必须为正数',
  },

  payment: {
    title: '支付',
    subtitle: '查看报价并完成支付',
    emptyGuest: '登录后即可查看报价和支付。',
    login: '登录',
    emptyNone: '暂无待支付项目，报价将显示在这里。',
    payNow: '立即支付',
    expired: '已过期',
  },

  requestDetail: {
    title: '申请 #{{id}}',
    requested: '申请于 {{date}}',
    budgetSuffix: ' · 预算 {{amount}}',
    contact: '联系方式：{{method}}',
    yourQuote: '您的报价',
    proceedPayment: '前往支付',
    validUntil: '有效期至 {{date}}',
    quoteExpired: '报价已过期——请提交新的请求。',
    reviewing:
      '我们正在审核您的申请，报价将在 24 小时内送达。',
    cancel: '取消申请',
    cancelTitle: '取消此申请？',
    cancelMessageQuoted:
      '您的报价将被作废，此操作无法撤销。',
    cancelMessagePlain:
      '此操作无法撤销，您需要重新提交申请。',
    cancelConfirm: '确认取消',
    cancelKeep: '保留',
  },

  notifications: {
    title: '通知',
    markAllRead: '全部标为已读（{{count}}）',
    empty: '暂无通知。',
  },

  notificationSettings: {
    title: '通知',
    subtitle: '我们如何为您推送更新',
    inAppTitle: '应用内通知',
    inAppDesc: '在通知收件箱中查看报价和申请更新。',
    alwaysOn: '始终开启',
    pushTitle: '推送通知',
    pushDesc: '即将推出，应用关闭时也能收到更新。',
  },

  profile: {
    welcomeTitle: '欢迎使用 LUNOTE',
    welcomeSubtitle: '登录以管理您的申请、报价和支付。',
    login: '登录',
    createAccount: '注册账号',
    changePhoto: '更换头像',
    accountDetails: '账号信息',
    language: '语言',
    notifications: '通知',
    support: '帮助与支持',
    logOut: '退出登录',
    logoutTitle: '退出 LUNOTE？',
    logoutMessage: '您随时可以用邮箱和密码重新登录。',
    logoutStay: '留在此页',
  },

  account: {
    title: '账号信息',
    profileSection: '个人资料',
    email: '邮箱',
    firstName: '名',
    lastName: '姓',
    realNameNote:
      '请填写真实姓名，方便我们的团队在报价和支付时确认您的身份。',
    saved: '已保存。',
    saveName: '保存姓名',
    securitySection: '安全',
    changePassword: '修改密码',
    confirmTitle: '更新您的姓名？',
    confirmMessage:
      '您的姓名将更改为“{{name}}”。我们的团队将凭此识别您的身份。',
    save: '保存',
    goBack: '返回',
  },

  language: {
    title: '语言',
    subtitle: '选择您偏好的语言',
    note: '应用将立即切换为您所选的语言。',
  },

  support: {
    title: '帮助与支持',
    subtitle: '我们随时为您服务',
    faqLabel: 'FAQ',
    faq1q: '多久能收到报价？',
    faq1a: '我们会审核每一份申请，并在 24 小时内发送报价。报价送达时您会立即收到通知。',
    faq2q: '可以取消申请吗？',
    faq2a: '可以，在支付前随时打开申请并点击“取消申请”即可。支付后请联系客服，我们会为您处理。',
    faq3q: '如何支付？',
    faq3a: '报价出好后，您可在应用内使用国际银行卡支付。支付功能正在完善中，即将上线。',
    faq4q: '你们支持哪些语言？',
    faq4a: '本应用提供六种语言，我们的礼宾团队可用英语和韩语为您提供协助。',
    contactLabel: '联系我们',
    contactNote:
      '没找到答案？给我们发邮件，我们将在一个工作日内回复您。',
    emailSupport: '邮件客服',
    version: 'LUNOTE v{{version}}',
  },
};

export default zh;
