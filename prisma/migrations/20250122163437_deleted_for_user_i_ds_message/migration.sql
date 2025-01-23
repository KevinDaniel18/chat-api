-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedForUserIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
