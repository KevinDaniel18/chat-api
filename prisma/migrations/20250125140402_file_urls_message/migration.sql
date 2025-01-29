-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
