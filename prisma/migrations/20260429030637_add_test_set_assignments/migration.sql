-- CreateTable
CREATE TABLE "test_set_assignments" (
    "id" SERIAL NOT NULL,
    "testSetId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_set_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_set_assignments_testSetId_idx" ON "test_set_assignments"("testSetId");

-- CreateIndex
CREATE INDEX "test_set_assignments_sectionId_idx" ON "test_set_assignments"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "test_set_assignments_testSetId_sectionId_key" ON "test_set_assignments"("testSetId", "sectionId");

-- AddForeignKey
ALTER TABLE "test_set_assignments" ADD CONSTRAINT "test_set_assignments_testSetId_fkey" FOREIGN KEY ("testSetId") REFERENCES "test_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_set_assignments" ADD CONSTRAINT "test_set_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
