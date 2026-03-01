/*
  Warnings:

  - You are about to drop the column `approvedById` on the `translation_requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "translation_requests" DROP CONSTRAINT "translation_requests_approvedById_fkey";

-- AlterTable
ALTER TABLE "translation_requests" DROP COLUMN "approvedById",
ADD COLUMN     "reviewedById" UUID;

-- AddForeignKey
ALTER TABLE "translation_requests" ADD CONSTRAINT "translation_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user_profile"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
