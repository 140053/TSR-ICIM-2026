-- CreateTable
CREATE TABLE "module_quiz_questions" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "questionNum" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'open_ended',
    "options" JSONB,
    "correctAnswer" TEXT,
    "hint" TEXT,
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_quiz_responses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "score" INTEGER,
    "isCorrect" BOOLEAN,
    "gradedAt" TIMESTAMP(3),
    "teacherNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_quiz_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_quiz_questions_moduleId_questionNum_key" ON "module_quiz_questions"("moduleId", "questionNum");

-- CreateIndex
CREATE UNIQUE INDEX "module_quiz_responses_userId_questionId_key" ON "module_quiz_responses"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "module_quiz_questions" ADD CONSTRAINT "module_quiz_questions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_quiz_responses" ADD CONSTRAINT "module_quiz_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_quiz_responses" ADD CONSTRAINT "module_quiz_responses_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_quiz_responses" ADD CONSTRAINT "module_quiz_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "module_quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
