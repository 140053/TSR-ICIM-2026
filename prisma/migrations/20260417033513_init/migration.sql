-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('APPRENTICE', 'ADVENTURER', 'CHAMPION');

-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('MULTIPLE_CHOICE', 'RANKING', 'OPEN_ENDED', 'TABLE_INPUT', 'CHECKLIST', 'COMPUTATION', 'MULTI_PLAN', 'BUDGET_CHECK', 'SELECT_JUSTIFY', 'REFLECTION_SLIDER');

-- CreateEnum
CREATE TYPE "StagePhase" AS ENUM ('UNDERSTANDING', 'ANALYSIS', 'SOLUTION', 'REFLECTION');

-- CreateEnum
CREATE TYPE "DiagnosticLevel" AS ENUM ('PROFICIENT', 'DEVELOPING', 'STRUGGLING');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('PRE_TEST', 'POST_TEST');

-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AvatarType" AS ENUM ('WIZARD', 'ELF', 'HERO', 'CHAMPION', 'EXPLORER', 'FOX', 'DRAGON', 'LION', 'EAGLE', 'WOLF');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "avatar" "AvatarType" NOT NULL DEFAULT 'WIZARD',
    "avatarEmoji" TEXT NOT NULL DEFAULT '🧙‍♂️',
    "avatarName" TEXT NOT NULL DEFAULT 'The Wizard',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'ADVENTURER',
    "sectionId" INTEGER,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "badges" JSONB,
    "setupDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🌲',
    "gradeLevel" TEXT NOT NULL DEFAULT 'Grade 6',
    "teacherId" INTEGER,
    "schoolYear" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_contexts" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "description" VARCHAR(200),
    "icon" VARCHAR(10) NOT NULL DEFAULT '📦',
    "color" VARCHAR(20) NOT NULL DEFAULT '#64748B',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "context" VARCHAR(50) NOT NULL,
    "scenario" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📦',
    "status" "ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockAfter" INTEGER,
    "gradeLevel" TEXT NOT NULL DEFAULT 'Grade 6',
    "timeEstimate" INTEGER,
    "melcTags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_assignments" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "module_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stages" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "stageNumber" INTEGER NOT NULL,
    "phase" "StagePhase" NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "type" "StageType" NOT NULL,
    "hint" TEXT,
    "options" JSONB,
    "correctAnswer" TEXT,
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "timeLimit" INTEGER,
    "melc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_progress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "totalScore" INTEGER,
    "maxPossible" INTEGER,
    "percentScore" DOUBLE PRECISION,
    "timeSpentTotal" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_responses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "stageId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "score" INTEGER,
    "timeSpent" INTEGER,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "teacherNote" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_reports" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "understandingScore" DOUBLE PRECISION,
    "analysisScore" DOUBLE PRECISION,
    "solutionScore" DOUBLE PRECISION,
    "reflectionScore" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "understandingLevel" "DiagnosticLevel",
    "analysisLevel" "DiagnosticLevel",
    "solutionLevel" "DiagnosticLevel",
    "reflectionLevel" "DiagnosticLevel",
    "weakStages" JSONB,
    "strongStages" JSONB,
    "needsIntervention" BOOLEAN NOT NULL DEFAULT false,
    "interventionNote" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_sets" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER,
    "type" "TestType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timeLimit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" SERIAL NOT NULL,
    "testSetId" INTEGER NOT NULL,
    "questionNum" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answerType" TEXT NOT NULL DEFAULT 'number',
    "choices" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'average',
    "melc" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "testSetId" INTEGER NOT NULL,
    "type" "TestType" NOT NULL,
    "score" INTEGER NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "percentScore" DOUBLE PRECISION NOT NULL,
    "timeSpent" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_responses" (
    "id" SERIAL NOT NULL,
    "testResultId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "studentAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_invite_codes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "label" VARCHAR(120),
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedById" INTEGER,
    "usedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "teacher_invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_userId_idx" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_sectionId_idx" ON "student_profiles"("sectionId");

-- CreateIndex
CREATE INDEX "sections_teacherId_idx" ON "sections"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_contexts_key_key" ON "scenario_contexts"("key");

-- CreateIndex
CREATE INDEX "scenario_contexts_isActive_idx" ON "scenario_contexts"("isActive");

-- CreateIndex
CREATE INDEX "modules_context_idx" ON "modules"("context");

-- CreateIndex
CREATE INDEX "modules_status_idx" ON "modules"("status");

-- CreateIndex
CREATE UNIQUE INDEX "module_assignments_moduleId_sectionId_key" ON "module_assignments"("moduleId", "sectionId");

-- CreateIndex
CREATE INDEX "stages_moduleId_idx" ON "stages"("moduleId");

-- CreateIndex
CREATE INDEX "stages_phase_idx" ON "stages"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "stages_moduleId_stageNumber_key" ON "stages"("moduleId", "stageNumber");

-- CreateIndex
CREATE INDEX "module_progress_userId_idx" ON "module_progress"("userId");

-- CreateIndex
CREATE INDEX "module_progress_moduleId_idx" ON "module_progress"("moduleId");

-- CreateIndex
CREATE INDEX "module_progress_status_idx" ON "module_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "module_progress_userId_moduleId_key" ON "module_progress"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "stage_responses_userId_idx" ON "stage_responses"("userId");

-- CreateIndex
CREATE INDEX "stage_responses_stageId_idx" ON "stage_responses"("stageId");

-- CreateIndex
CREATE INDEX "stage_responses_moduleId_idx" ON "stage_responses"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "stage_responses_userId_stageId_key" ON "stage_responses"("userId", "stageId");

-- CreateIndex
CREATE INDEX "diagnostic_reports_userId_idx" ON "diagnostic_reports"("userId");

-- CreateIndex
CREATE INDEX "diagnostic_reports_moduleId_idx" ON "diagnostic_reports"("moduleId");

-- CreateIndex
CREATE INDEX "diagnostic_reports_needsIntervention_idx" ON "diagnostic_reports"("needsIntervention");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_reports_userId_moduleId_key" ON "diagnostic_reports"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "test_sets_type_idx" ON "test_sets"("type");

-- CreateIndex
CREATE INDEX "test_questions_testSetId_idx" ON "test_questions"("testSetId");

-- CreateIndex
CREATE UNIQUE INDEX "test_questions_testSetId_questionNum_key" ON "test_questions"("testSetId", "questionNum");

-- CreateIndex
CREATE INDEX "test_results_userId_idx" ON "test_results"("userId");

-- CreateIndex
CREATE INDEX "test_results_testSetId_idx" ON "test_results"("testSetId");

-- CreateIndex
CREATE INDEX "test_results_type_idx" ON "test_results"("type");

-- CreateIndex
CREATE UNIQUE INDEX "test_results_userId_testSetId_key" ON "test_results"("userId", "testSetId");

-- CreateIndex
CREATE INDEX "test_responses_testResultId_idx" ON "test_responses"("testResultId");

-- CreateIndex
CREATE INDEX "test_responses_questionId_idx" ON "test_responses"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_token_idx" ON "user_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_invite_codes_code_key" ON "teacher_invite_codes"("code");

-- CreateIndex
CREATE INDEX "teacher_invite_codes_code_idx" ON "teacher_invite_codes"("code");

-- CreateIndex
CREATE INDEX "teacher_invite_codes_isActive_idx" ON "teacher_invite_codes"("isActive");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_assignments" ADD CONSTRAINT "module_assignments_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_assignments" ADD CONSTRAINT "module_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_responses" ADD CONSTRAINT "stage_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_responses" ADD CONSTRAINT "stage_responses_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_reports" ADD CONSTRAINT "diagnostic_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_sets" ADD CONSTRAINT "test_sets_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_testSetId_fkey" FOREIGN KEY ("testSetId") REFERENCES "test_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_testSetId_fkey" FOREIGN KEY ("testSetId") REFERENCES "test_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_responses" ADD CONSTRAINT "test_responses_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "test_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_responses" ADD CONSTRAINT "test_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "test_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_invite_codes" ADD CONSTRAINT "teacher_invite_codes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_invite_codes" ADD CONSTRAINT "teacher_invite_codes_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
