-- AlterTable
ALTER TABLE "caregivers" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "middle_name" TEXT,
ADD COLUMN     "ssn_last4" TEXT;
