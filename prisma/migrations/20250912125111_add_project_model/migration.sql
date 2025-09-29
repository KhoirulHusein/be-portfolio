-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('ONGOING', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "galleryUrls" TEXT[],
    "repoUrl" TEXT,
    "liveUrl" TEXT,
    "videoUrl" TEXT,
    "links" JSONB,
    "techStack" TEXT[],
    "tags" TEXT[],
    "status" "public"."ProjectStatus" NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "public"."Project"("slug");

-- CreateIndex
CREATE INDEX "Project_published_idx" ON "public"."Project"("published");

-- CreateIndex
CREATE INDEX "Project_featured_idx" ON "public"."Project"("featured");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "public"."Project"("status");

-- CreateIndex
CREATE INDEX "Project_updatedAt_idx" ON "public"."Project"("updatedAt");
