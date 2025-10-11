-- Add transferPairId column to Transaction table
ALTER TABLE "Transaction" 
ADD COLUMN "transferPairId" TEXT;

-- Add index for better performance
CREATE INDEX "Transaction_transferPairId_idx" ON "Transaction"("transferPairId");
