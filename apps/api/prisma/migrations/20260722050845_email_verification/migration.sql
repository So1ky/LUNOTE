-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "verificationCodeHash" TEXT;

-- 기존 사용자는 인증된 것으로 처리 (기능 도입 이전 가입자 grandfather)
UPDATE "users" SET "emailVerifiedAt" = now() WHERE "emailVerifiedAt" IS NULL;
