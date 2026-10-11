-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarS3Key" TEXT,
ADD COLUMN     "quoteEmailEnabled" BOOLEAN NOT NULL DEFAULT true;
