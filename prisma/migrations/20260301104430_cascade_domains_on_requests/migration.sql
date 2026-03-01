-- DropForeignKey
ALTER TABLE "domains_on_requests" DROP CONSTRAINT "domains_on_requests_requestId_fkey";

-- AddForeignKey
ALTER TABLE "domains_on_requests" ADD CONSTRAINT "domains_on_requests_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "translation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
