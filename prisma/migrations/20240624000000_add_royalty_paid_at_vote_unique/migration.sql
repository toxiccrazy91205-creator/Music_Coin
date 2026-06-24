-- AlterTable: Add paidAt column to Royalty
ALTER TABLE "Royalty" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateUniqueIndex: Enforce one vote per fan per artist
CREATE UNIQUE INDEX "Vote_fanId_artistId_key" ON "Vote"("fanId", "artistId");
