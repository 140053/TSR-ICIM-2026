-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "schoolId" INTEGER;

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "schoolId" INTEGER;

-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sections_schoolId_idx" ON "sections"("schoolId");

-- CreateIndex
CREATE INDEX "student_profiles_schoolId_idx" ON "student_profiles"("schoolId");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
