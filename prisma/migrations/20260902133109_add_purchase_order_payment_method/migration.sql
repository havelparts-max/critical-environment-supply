-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'PURCHASE_ORDER');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'INVOICED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CARD',
ADD COLUMN     "poNumber" TEXT;
