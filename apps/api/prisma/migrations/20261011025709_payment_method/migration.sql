-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYPAL', 'BANK_TRANSFER');

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'BANK_TRANSFER';

-- AlterTable
ALTER TABLE "quote_requests" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYPAL';
