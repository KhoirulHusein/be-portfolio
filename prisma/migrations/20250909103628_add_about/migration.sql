-- CreateTable
CREATE TABLE "public"."About" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subheadline" TEXT,
    "bio" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "location" TEXT,
    "emailPublic" TEXT,
    "phonePublic" TEXT,
    "links" JSONB,
    "skills" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "About_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "About_published_idx" ON "public"."About"("published");

-- CreateIndex
CREATE INDEX "About_updatedAt_idx" ON "public"."About"("updatedAt");
