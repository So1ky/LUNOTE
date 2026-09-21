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
    greeting: '안녕하세요',
    greetingNamed: '{{name}}님 안녕하세요',
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
    service: '서비스 항목',
    servicePlaceholder: '서비스를 선택하세요',
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

  services: {
    customQuote: '맞춤 견적',
    HOUSING_1: {
      title: '주거 탐색·지역 가이드',
      desc: '한국의 동네 정보, 임대 유형, 보증금·월세, 주거 용어, 집 구하는 방법을 이해하도록 도와드려요.\n\n포함: 일반적인 주거 정보와 탐색 안내\n불포함: 부동산 중개, 가격 협상',
    },
    HOUSING_2: {
      title: '부동산 커뮤니케이션 지원',
      desc: '직접 선택하신 부동산, 임대인, 주거 제공자와 연락할 때 언어·소통을 지원해요.\n\n포함: 전화, 메시지, 약속 조율\n불포함: 대리 중개·협상',
    },
    HOUSING_3: {
      title: '집 보기 통역·동행',
      desc: '집을 보러 갈 때 현장에서 도와드려요.\n\n포함: 일반 통역과 소통 지원\n불포함: 부동산 중개, 계약 협상, 법률 자문',
    },
    HOUSING_4: {
      title: '입주·공과금 설정 지원',
      desc: '입주 절차와 공과금·생활 설비 관련 소통을 도와드려요.\n\n예시: 전기, 가스, 수도, 인터넷, 관리사무소',
    },
    HOUSING_5: {
      title: '기타 주거 요청',
      desc: '필요한 내용을 알려주시면 LUNOTE가 검토해 드려요.',
    },
    VISA_1: {
      title: '비자 정보·체크리스트',
      desc: '공개된 출입국 정보를 바탕으로 일반적인 안내를 드려요.\n\n예시: 필요 서류, 출입국 절차, 신청 장소, 전반적인 진행 안내',
    },
    VISA_2: {
      title: '출입국 웹사이트·예약 지원',
      desc: '한국 출입국 관련 웹사이트 이용과 예약 절차 이해를 도와드려요.',
    },
    VISA_3: {
      title: '서류 정리·언어 지원',
      desc: '출입국 절차에 필요한 서류를 이해하고 정리하도록 도와드려요.\n\n전문 자격이나 법적 자격이 필요한 업무는 필요 시 적합한 전문가에게 연결해 드려요.',
    },
    VISA_4: {
      title: '출입국사무소 동행',
      desc: '출입국사무소 방문 시 일반 통역과 소통을 지원해요.\n\n법적으로 허용된 경우가 아니면 LUNOTE가 출입국 대리인 역할을 하지 않아요.',
    },
    VISA_5: {
      title: '기타 비자 요청',
      desc: '상황을 설명해 주시면 어떤 지원이 가능한지 검토해 드려요.',
    },
    HOSPITAL_1: {
      title: '한국 의료 이용 안내',
      desc: '한국 의료 시스템이 어떻게 운영되는지 이해하도록 도와드려요.\n\n예시: 증상별로 어느 진료과에 가야 하는지, 병원·의원 이용 방식, 병원 방문에 대한 일반 정보\n\n의학적 조언이나 진단은 제공하지 않아요.',
    },
    HOSPITAL_2: {
      title: '병원 커뮤니케이션 지원',
      desc: '이미 이용 중이거나 직접 선택하신 의료기관과 소통할 때 언어를 지원해요.\n\n예시: 전화 지원, 일반 문의, 일정 조율',
    },
    HOSPITAL_3: {
      title: '병원 방문 통역·동행',
      desc: '병원 방문 시 현장에서 언어와 일반 행정 업무를 도와드려요.\n\n공인 전문 통역이 필요한 의료 통역은 아니에요.',
    },
    HOSPITAL_4: {
      title: '의료 서류·통역사 연결',
      desc: '일반적인 병원 서류를 이해하도록 돕거나, 필요 시 적합한 전문 통역사·서비스 제공자를 연결해 드려요.\n\n전문 통역사 비용은 별도예요.',
    },
    HOSPITAL_5: {
      title: '기타 의료 요청',
      desc: '필요한 도움을 설명해 주시면 LUNOTE가 검토해 드려요.',
    },
    BANK_1: {
      title: '은행 계좌 개설 가이드',
      desc: '한국 은행 계좌를 열 때 일반적으로 필요한 서류와 절차를 안내해 드려요.',
    },
    BANK_2: {
      title: '뱅킹 앱·인증 지원',
      desc: '모바일 뱅킹, 한국 은행 앱, 본인 인증, 일반 은행 서비스의 설정 과정을 이해하도록 도와드려요.',
    },
    BANK_3: {
      title: '은행 방문 통역·동행',
      desc: '은행에서 현장 언어·소통을 지원해요.',
    },
    BANK_4: {
      title: '해외 송금 절차 지원',
      desc: '해외 송금 절차를 이해하고 은행과 소통하는 것을 도와드려요.\n\nLUNOTE는 금융 자문이나 금융 상품 추천을 하지 않아요.',
    },
    BANK_5: {
      title: '기타 은행 요청',
      desc: '어떤 은행 관련 어려움을 겪고 계신지 알려주세요.',
    },
    TELECOM_1: {
      title: 'SIM/eSIM·요금제 가이드',
      desc: '한국의 SIM 카드, eSIM, 휴대폰 요금제를 이해하도록 도와드려요.',
    },
    TELECOM_2: {
      title: '휴대폰 개통 지원',
      desc: '한국 휴대폰 서비스를 개통할 때 필요한 소통과 절차를 도와드려요.\n\n통신사 요금과 요금제 비용은 별도예요.',
    },
    TELECOM_3: {
      title: '집 인터넷 설치 지원',
      desc: '이용 가능한 인터넷 서비스를 이해하고 설치 절차를 조율하는 것을 도와드려요.',
    },
    TELECOM_4: {
      title: '통신사 고객센터 지원',
      desc: '통신사와의 소통을 도와드려요.\n\n예시: 요금제 변경, 요금 문의, 해지, 기술 지원 소통',
    },
    TELECOM_5: {
      title: '기타 통신·인터넷 요청',
      desc: '어떤 도움이 필요한지 알려주세요.',
    },
    OTHER_1: {
      title: '관공서 이용 안내',
      desc: '한국 공공 서비스를 이용할 때 일반 안내와 언어를 지원해요.\n\n법적으로 전문 행정 업무가 필요한 경우 적합한 전문가에게 연결해 드려요.',
    },
    OTHER_2: {
      title: '한국어 전화·소통 지원',
      desc: '한국어 전화를 대신 걸거나 도와드릴 사람이 필요하신가요?\n\n예시: 고객센터, 예약, 일반 문의, 서비스 업체',
    },
    OTHER_3: {
      title: '학교·보육 정보 지원',
      desc: '어린이집, 유치원, 학교, 학원, 아동 관련 서비스에 대한 조사와 소통을 도와드려요.',
    },
    OTHER_4: {
      title: '한국 생활 컨시어지',
      desc: '맞는 카테고리를 못 찾으셨나요? 해결하려는 문제를 LUNOTE에 알려주세요.\n\n문제 조사, 한국 서비스 업체와의 소통, 다음 단계 조율, 적합한 전문가 연결을 도와드릴 수 있어요.',
    },
    OTHER_5: {
      title: '기타 요청',
      desc: '필요한 내용을 설명해 주세요.',
    },
  },

  payment: {
    title: '결제',
    subtitle: '견적을 확인하고 결제를 완료하세요',
    emptyGuest: '로그인하면 견적과 결제를 확인할 수 있어요.',
    login: '로그인',
    emptyNone: '아직 결제할 항목이 없어요 — 견적이 여기에 표시돼요.',
    payNow: '지금 결제',
    expired: '만료됨',
  },

  requestDetail: {
    title: '문의 #{{id}}',
    requested: '{{date}} 요청',
    budgetSuffix: ' · 예산 {{amount}}',
    contact: '연락 수단: {{method}}',
    yourQuote: '견적',
    proceedPayment: '결제 진행하기',
    validUntil: '{{date}}까지 유효',
    quoteExpired: '견적 유효기간이 지났어요 — 새 문의를 등록해 주세요.',
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

  chooseLanguage: {
    title: '언어를 선택하세요',
    subtitle: '프로필에서 언제든지 바꿀 수 있어요.',
    continue: '계속',
  },

  welcome: {
    title: 'LUNOTE에 오신 것을 환영해요! 🎉',
    tagline: '한국 생활을 위한 올인원 컨시어지',
    intro1: '한국 생활은 복잡할 수 있어요. LUNOTE가 더 쉽게 만들어 드릴게요.',
    intro2: '주거, 비자, 병원, 은행, 통신 등 한국 생활에 관한 도움이 필요하신가요? 필요한 것만 알려주세요.',
    howTitle: '이용 방법',
    step1Title: '1. 필요한 것을 알려주세요',
    step1Body: '카테고리를 고르고, 필요한 서비스를 선택하고, 요청 내용을 적어주세요.',
    step2Title: '2. 맞춤 견적을 받아보세요',
    step2Body: '요청을 검토한 뒤, 진행 전에 서비스와 가격을 함께 상의해요.',
    step3Title: '3. 결제하고 지원받으세요',
    step3Body: '서비스와 가격에 합의하면 LUNOTE에서 결제만 하세요. 바로 시작할게요.',
    solutionTitle: '요청 하나면, 맞는 해결책으로.',
    solutionBody1: 'LUNOTE는 컨시어지 서비스예요. 요청에 따라 저희가 직접 도와드리거나, 검증된 전문가나 서비스 제공자를 연결해 드려요.',
    solutionBody2: '누구에게 연락해야 할지, 어디서 시작해야 할지 고민하지 않아도 돼요.',
    solutionCta: '필요한 것만 LUNOTE에 알려주세요.',
    cta: '첫 요청 만들기',
    later: '앱 먼저 둘러보기',
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
