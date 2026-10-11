-- 자동 알림을 인앱(+추후 푸시)으로 일원화 — 견적 이메일 설정 제거
ALTER TABLE "users" DROP COLUMN "quoteEmailEnabled";
