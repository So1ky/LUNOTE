-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'AWAITING_CONFIRMATION';

-- AlterTable
ALTER TABLE "quote_requests" ADD COLUMN     "completionNoticedAt" TIMESTAMP(3),
ADD COLUMN     "confirmationDeadlineAt" TIMESTAMP(3),
ADD COLUMN     "disputeReason" VARCHAR(500),
ADD COLUMN     "disputedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "quote_requests_status_confirmationDeadlineAt_idx" ON "quote_requests"("status", "confirmationDeadlineAt");
