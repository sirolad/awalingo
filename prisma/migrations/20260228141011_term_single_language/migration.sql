/*
  Warnings:

  - You are about to drop the column `sourceLanguageId` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `targetLanguageId` on the `terms` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[text,languageId,meaning]` on the table `terms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `languageId` to the `terms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `meaning` to the `terms` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "terms" DROP CONSTRAINT "terms_sourceLanguageId_fkey";

-- DropForeignKey
ALTER TABLE "terms" DROP CONSTRAINT "terms_targetLanguageId_fkey";

-- AlterTable
ALTER TABLE "terms" DROP COLUMN "sourceLanguageId",
DROP COLUMN "targetLanguageId",
ADD COLUMN     "languageId" INTEGER NOT NULL,
ADD COLUMN     "meaning" TEXT NOT NULL,
ADD COLUMN     "phonics" TEXT;

-- CreateTable
CREATE TABLE "domains_on_terms" (
    "termId" INTEGER NOT NULL,
    "domainId" INTEGER NOT NULL,

    CONSTRAINT "domains_on_terms_pkey" PRIMARY KEY ("termId","domainId")
);

-- CreateIndex
CREATE UNIQUE INDEX "terms_text_languageId_meaning_key" ON "terms"("text", "languageId", "meaning");

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domains_on_terms" ADD CONSTRAINT "domains_on_terms_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domains_on_terms" ADD CONSTRAINT "domains_on_terms_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
