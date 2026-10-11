-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYPAL');

-- DropIndex
DROP INDEX "payments_quoteId_idx";

-- AlterTable
-- provider는 NOT NULL — 기존 행이 있어도 깨지지 않게 기본값으로 채운 뒤 기본값을 제거한다
-- (이후 생성되는 행은 코드가 반드시 provider를 지정해야 한다)
ALTER TABLE "payments" ADD COLUMN     "failReason" TEXT,
ADD COLUMN     "portoneTxId" TEXT,
ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'PAYPAL';
ALTER TABLE "payments" ALTER COLUMN "provider" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "payments_quoteId_status_idx" ON "payments"("quoteId", "status");

-- 같은 견적에 PAID 결제가 2건 이상 존재할 수 없다 (이중 결제 방어의 최종선 — 앱/서비스 로직과 무관하게 DB가 보장).
-- Prisma 스키마는 부분 유니크 인덱스를 표현하지 못하므로 SQL로 직접 둔다.
CREATE UNIQUE INDEX "payments_one_paid_per_quote" ON "payments"("quoteId") WHERE "status" = 'PAID';
