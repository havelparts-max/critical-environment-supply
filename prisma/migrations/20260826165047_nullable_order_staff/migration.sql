-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_staffId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "staffId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
