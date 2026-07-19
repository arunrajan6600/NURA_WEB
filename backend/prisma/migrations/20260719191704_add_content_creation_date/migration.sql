-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "contentCreationDate" TEXT;

-- Backfill contentCreationDate from ProjectMetadata.projectCreationDate
UPDATE "Post"
SET "contentCreationDate" = "ProjectMetadata"."projectCreationDate"
FROM "ProjectMetadata"
WHERE "Post".id = "ProjectMetadata"."postId";

