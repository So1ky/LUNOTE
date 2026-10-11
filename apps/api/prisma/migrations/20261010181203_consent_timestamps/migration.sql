-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "withdrawalConsentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);
