import type { Resources } from '../index';

const ko: Resources = {
  brand: {
    tagline: '한국 생활, 쉽고 편하게',
  },

  common: {
    somethingWrong: '문제가 발생했어요',
    uploadFailed: '업로드에 실패했어요',
    login: '로그인',
  },

  tabs: {
    home: '홈',
    quote: '견적',
    payment: '결제',
    profile: '프로필',
  },

  status: {
    reviewing: '검토 중',
    quoted: '견적 도착',
    paid: '결제 완료',
    inProgress: '진행 중',
    completed: '완료',
    cancelled: '취소됨',
    refunded: '환불됨',
  },

  categories: {
    HOUSING: '주거',
    VISA: '비자',
    HOSPITAL: '병원',
    BANK: '은행',
    TELECOM: '통신',
    OTHER: '기타',
  },

  contactChannels: {
    email: '이메일',
    phone: '전화',
    whatsapp: 'WhatsApp',
  },

  password: {
    policy:
      '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 모두 포함해야 해요',
    placeholder: '8자 이상, 숫자와 특수문자 포함',
  },

  home: {
    greeting: '안녕하세요 👋',
    greetingNamed: '{{name}}님 안녕하세요 👋',
    subtitle: '한국 정착, 무엇을 도와드릴까요?',
    notifications: '알림',
    requestQuote: '견적 요청하기',
    requestQuoteSub: '필요한 것만 알려주세요 — 나머지는 저희가 처리할게요',
    categoriesLabel: '카테고리',
    recentLabel: '최근 문의',
    recentEmptyAuthed: '문의 내역이 여기에 표시돼요.',
    recentEmptyGuest: '로그인하면 문의를 남기고 진행 상황을 확인할 수 있어요.',
  },

  login: {
    emailLabel: '이메일',
    passwordLabel: '비밀번호',
    forgotPassword: '비밀번호를 잊으셨나요?',
    submit: '로그인',
    orContinueWith: '또는 다음으로 계속하기',
    continueGoogle: 'Google로 계속하기',
    continueApple: 'Apple로 계속하기',
    continueGuest: '← 게스트로 둘러보기',
    newToLunote: 'LUNOTE가 처음이신가요? ',
    createAccount: '회원가입',
  },

  signup: {
    title: '회원가입',
    subtitle: 'LUNOTE와 함께 한국 생활을 시작하세요',
    firstName: '이름',
    lastName: '성',
    email: '이메일',
    password: '비밀번호',
    submit: '회원가입',
    alreadyHaveAccount: '이미 계정이 있으신가요? ',
    logIn: '로그인',
  },

  verifyEmail: {
    title: '이메일을 확인하세요',
    subtitle: '6자리 인증 코드를 보냈어요',
    yourEmail: '이메일',
    verify: '인증하기',
    resendCode: '코드 다시 보내기',
    logOut: '로그아웃',
    codeSent: '새 인증 코드를 이메일로 보냈어요.',
  },

  forgotPassword: {
    resetTitle: '비밀번호 재설정',
    requestSubtitle: '계정 이메일을 입력하면 6자리 코드를 보내드려요.',
    resetSubtitle: '인증 코드를 보낸 곳',
    email: '이메일',
    sendCode: '재설정 코드 보내기',
    newPassword: '새 비밀번호',
    newPasswordPlaceholder: '8자 이상',
    setNewPassword: '새 비밀번호 설정',
    resendCode: '코드 다시 보내기',
    backToLogin: '← 로그인으로 돌아가기',
    codeResent: '가입된 이메일이라면 새 코드를 보내드렸어요.',
    doneTitle: '비밀번호가 변경됐어요',
    doneSubtitle: '새 비밀번호로 로그인하세요.',
    doneButton: '로그인으로 돌아가기',
  },

  changePassword: {
    title: '비밀번호 변경',
    current: '현재 비밀번호',
    newLabel: '새 비밀번호',
    confirm: '새 비밀번호 확인',
    confirmPlaceholder: '새 비밀번호를 다시 입력하세요',
    mismatch: '새 비밀번호가 일치하지 않아요',
    submit: '비밀번호 변경',
    confirmTitle: '비밀번호를 변경할까요?',
    confirmMessage: '다음 로그인부터 새 비밀번호를 사용하게 돼요.',
    goBack: '돌아가기',
    doneTitle: '비밀번호가 변경됐어요',
    doneSubtitle: '다음 로그인부터 새 비밀번호를 사용하세요.',
    done: '완료',
  },

  quoteList: {
    title: '내 문의',
    subtitle: '문의 진행 상황을 확인하세요',
    emptyGuest: '로그인하면 문의를 남기고 진행 상황을 확인할 수 있어요.',
    login: '로그인',
    emptyNone: '아직 문의가 없어요 — 필요한 것을 알려주세요.',
    requestQuote: '견적 요청하기',
  },

  quoteRequest: {
    title: '견적 요청하기',
    category: '카테고리',
    budget: '희망 예산 (선택, USD)',
    budgetPlaceholder: '400',
    description: '무엇이 필요하신가요? (10자 이상)',
    descriptionPlaceholder:
      '상황을 설명해 주세요 — 자세할수록 정확한 견적을 드릴 수 있어요.',
    attachments: '첨부파일 (선택, 최대 {{max}}개 — 사진 또는 PDF)',
    photo: '사진',
    pdf: 'PDF',
    contactLabel: '어떻게 연락드리면 될까요?',
    contactPlaceholder: '연락 수단을 선택하세요',
    contactNote:
      '컨시어지 팀이 이 방법으로 연락해 견적을 안내해 드려요.',
    submit: '요청 보내기',
    reviewNote: '요청을 검토한 뒤 24시간 이내에 견적을 보내드려요.',
    budgetError: '희망 예산은 0보다 큰 숫자여야 해요',
  },

  payment: {
    title: '결제',
    subtitle: '견적을 확인하고 결제를 완료하세요',
    emptyGuest: '로그인하면 견적과 결제를 확인할 수 있어요.',
    login: '로그인',
    emptyNone: '아직 결제할 항목이 없어요 — 견적이 여기에 표시돼요.',
    payNow: '지금 결제',
  },

  requestDetail: {
    title: '문의 #{{id}}',
    requested: '{{date}} 요청',
    budgetSuffix: ' · 예산 {{amount}}',
    contact: '연락 수단: {{method}}',
    yourQuote: '견적',
    proceedPayment: '결제 진행하기',
    reviewing:
      '요청을 검토하고 있어요. 24시간 이내에 견적을 보내드려요.',
    cancel: '문의 취소',
    cancelTitle: '이 문의를 취소할까요?',
    cancelMessageQuoted:
      '받으신 견적이 사라지며 취소는 되돌릴 수 없어요.',
    cancelMessagePlain:
      '취소는 되돌릴 수 없어요 — 새로 문의를 다시 남겨야 해요.',
    cancelConfirm: '네, 취소할게요',
    cancelKeep: '유지하기',
  },

  notifications: {
    title: '알림',
    markAllRead: '모두 읽음 처리 ({{count}})',
    empty: '아직 알림이 없어요.',
  },

  notificationSettings: {
    title: '알림',
    subtitle: '소식을 전해드리는 방법',
    inAppTitle: '앱 내 알림',
    inAppDesc: '견적과 문의 업데이트를 알림함에서 확인하세요.',
    alwaysOn: '항상 켜짐',
    pushTitle: '푸시 알림',
    pushDesc: '곧 제공돼요 — 앱을 닫아도 소식을 받아보세요.',
  },

  profile: {
    welcomeTitle: 'LUNOTE에 오신 것을 환영해요',
    welcomeSubtitle: '로그인하면 문의, 견적, 결제를 관리할 수 있어요.',
    login: '로그인',
    createAccount: '회원가입',
    changePhoto: '프로필 사진 변경',
    accountDetails: '계정 정보',
    language: '언어',
    notifications: '알림',
    support: '고객지원',
    logOut: '로그아웃',
    logoutTitle: 'LUNOTE에서 로그아웃할까요?',
    logoutMessage: '이메일과 비밀번호로 언제든 다시 로그인할 수 있어요.',
    logoutStay: '머무르기',
  },

  account: {
    title: '계정 정보',
    profileSection: '프로필',
    email: '이메일',
    firstName: '이름',
    lastName: '성',
    realNameNote:
      '실명을 사용하세요 — 컨시어지 팀이 견적과 결제 시 본인을 확인하는 기준이에요.',
    saved: '저장했어요.',
    saveName: '이름 저장',
    securitySection: '보안',
    changePassword: '비밀번호 변경',
    confirmTitle: '이름을 변경할까요?',
    confirmMessage:
      '이름이 "{{name}}"(으)로 변경돼요. 컨시어지 팀이 본인 확인에 사용해요.',
    save: '저장',
    goBack: '돌아가기',
  },

  language: {
    title: '언어',
    subtitle: '사용할 언어를 선택하세요',
    note: '선택한 언어로 앱이 바로 전환돼요.',
  },

  support: {
    title: '고객지원',
    subtitle: '언제든 도와드릴게요',
    faqLabel: 'FAQ',
    faq1q: '견적은 얼마나 빨리 받을 수 있나요?',
    faq1a: '모든 요청을 검토해 24시간 이내에 견적을 보내드려요. 견적이 도착하는 즉시 알림을 받게 돼요.',
    faq2q: '문의를 취소할 수 있나요?',
    faq2a: '네 — 결제 전이라면 언제든 문의를 열어 "문의 취소"를 누르면 돼요. 결제 후에는 고객지원에 연락 주시면 도와드려요.',
    faq3q: '결제는 어떻게 하나요?',
    faq3a: '견적이 준비되면 앱에서 해외 카드로 결제할 수 있어요. 결제 기능은 마무리 중이며 곧 제공될 예정이에요.',
    faq4q: '어떤 언어를 지원하나요?',
    faq4a: '앱은 6개 언어로 제공되며, 컨시어지 팀은 영어와 한국어로 도와드릴 수 있어요.',
    contactLabel: '문의',
    contactNote:
      '원하는 답을 찾지 못하셨나요? 이메일을 보내주시면 영업일 기준 1일 이내에 답변드려요.',
    emailSupport: '이메일 문의',
    version: 'LUNOTE v{{version}}',
  },
};

export default ko;
