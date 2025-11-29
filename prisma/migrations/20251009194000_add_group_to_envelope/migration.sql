-- CreateIndex
CREATE INDEX "Envelope_userId_group_idx" ON "Envelope"("userId", "group");

-- AlterTable
ALTER TABLE "Envelope" ADD COLUMN "group" TEXT;
