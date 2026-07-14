-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ProjectMetadata" ADD COLUMN     "category" TEXT,
ADD COLUMN     "client" TEXT,
ADD COLUMN     "demoLink" TEXT,
ADD COLUMN     "docLink" TEXT,
ADD COLUMN     "repoLink" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "sections" JSONB,
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "teamMembers" TEXT;

-- CreateIndex
CREATE INDEX "Post_tags_idx" ON "Post"("tags");
