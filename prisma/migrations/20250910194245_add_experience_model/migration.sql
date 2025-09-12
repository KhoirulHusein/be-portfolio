-- CreateTable
CREATE TABLE "public"."Experience" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "companyLogoUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "employmentType" TEXT,
    "summary" TEXT,
    "highlights" TEXT[],
    "techStack" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Experience_startDate_idx" ON "public"."Experience"("startDate");

-- CreateIndex
CREATE INDEX "Experience_order_idx" ON "public"."Experience"("order");

-- CreateIndex
CREATE INDEX "Experience_published_idx" ON "public"."Experience"("published");
