-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "type" TEXT NOT NULL DEFAULT 'blog',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "excerpt" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailAlt" TEXT,
    "authorId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchMetadata" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "publicationYear" TEXT,
    "authors" TEXT,
    "venue" TEXT,
    "abstract" TEXT,
    "keywords" TEXT[],
    "externalLinks" JSONB,
    "pdfAttachment" TEXT,
    "researchCategory" TEXT,

    CONSTRAINT "ResearchMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMetadata" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "year" TEXT,
    "duration" TEXT,
    "medium" TEXT,
    "collaborators" TEXT,
    "tools" TEXT[],
    "technologies" TEXT[],
    "institution" TEXT,
    "exhibition" TEXT,
    "publication" TEXT,
    "researchArea" TEXT,
    "credits" JSONB,
    "references" JSONB,

    CONSTRAINT "ProjectMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_status_createdAt_idx" ON "Post"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_slug_idx" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_type_status_idx" ON "Post"("type", "status");

-- CreateIndex
CREATE INDEX "Post_featured_status_idx" ON "Post"("featured", "status");

-- CreateIndex
CREATE INDEX "Cell_postId_orderIndex_idx" ON "Cell"("postId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchMetadata_postId_key" ON "ResearchMetadata"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMetadata_postId_key" ON "ProjectMetadata"("postId");

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchMetadata" ADD CONSTRAINT "ResearchMetadata_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMetadata" ADD CONSTRAINT "ProjectMetadata_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
