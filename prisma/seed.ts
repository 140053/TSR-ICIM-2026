// prisma/seed.ts
// Run: npx prisma db seed
// Or:  npx tsx prisma/seed.ts

import { PrismaClient } from "../src/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// ─── Prisma client (same setup as lib/prisma.ts) ──────────────
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log("Seeding TSR database...\n");

  // ── 0. Scenario Contexts ───────────────────────────────────
  const defaultContexts = [
    { key: "FEEDING_PROGRAM", label: "Barangay Feeding Program", description: "Money & Operations",     icon: "🍱", color: "#4A9B7F", sortOrder: 1 },
    { key: "SARI_SARI_STORE", label: "Sari-Sari Store Manager",  description: "Decimals & Profit",      icon: "🏪", color: "#3B82C4", sortOrder: 2 },
    { key: "SCHOOL_GARDEN",   label: "School Garden Planner",    description: "Measurement & Geometry", icon: "📐", color: "#8B5CF6", sortOrder: 3 },
    { key: "TRAVEL_PLANNER",  label: "Travel & Distance",        description: "Time & Distance",        icon: "🚌", color: "#F59E0B", sortOrder: 4 },
    { key: "SCHOOL_BUDGET",   label: "School Budget Planner",    description: "Budgeting",              icon: "💰", color: "#E05C5C", sortOrder: 5 },
  ];
  for (const ctx of defaultContexts) {
    await prisma.scenarioContext.upsert({
      where:  { key: ctx.key },
      update: { label: ctx.label, description: ctx.description, icon: ctx.icon, color: ctx.color, sortOrder: ctx.sortOrder },
      create: ctx,
    });
  }
  console.log(`  + Contexts: ${defaultContexts.length} scenario contexts seeded`);

  const adminPw   = await bcrypt.hash("Admin1234!",   12);
  const teacherPw = await bcrypt.hash("Teacher1234!", 12);
  const studentPw = await bcrypt.hash("Student1234!", 12);

  // ── 1. Admin ───────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where:  { email: "admin@tsr.edu" },
    update: {},
    create: { name: "System Admin", email: "admin@tsr.edu", password: adminPw, role: "ADMIN" },
  });
  console.log(`  + Admin:   ${admin.email}`);

  // ── 1a. School ─────────────────────────────────────────────
  let school = await prisma.school.findFirst({
    where: { name: "San Isidro Elementary School" },
  });
  if (!school) {
    school = await prisma.school.create({
      data: {
        name:     "San Isidro Elementary School",
        address:  "Barangay San Isidro, City of San Jose",
        isActive: true,
      },
    });
  }
  console.log(`  + School:  ${school.name} (id=${school.id})`);

  // ── 2. Teacher ─────────────────────────────────────────────
  const teacher = await prisma.user.upsert({
    where:  { email: "teacher@tsr.edu" },
    update: {},
    create: { name: "Ma. Clara Santos", email: "teacher@tsr.edu", password: teacherPw, role: "TEACHER" },
  });
  console.log(`  + Teacher: ${teacher.email}`);

  // ── 3. Sections ────────────────────────────────────────────
  let section = await prisma.section.findFirst({
    where: { name: "Narra", teacherId: teacher.id },
  });
  if (!section) {
    section = await prisma.section.create({
      data: {
        name:       "Narra",
        emoji:      "🌲",
        gradeLevel: "Grade 6",
        teacherId:  teacher.id,
        schoolId:   school.id,
        schoolYear: "2025-2026",
        isActive:   true,
      },
    });
  } else if (!section.schoolId) {
    section = await prisma.section.update({
      where: { id: section.id },
      data:  { schoolId: school.id },
    });
  }
  console.log(`  + Section: ${section.name} (id=${section.id})`);

  let section2 = await prisma.section.findFirst({
    where: { name: "Molave", teacherId: teacher.id },
  });
  if (!section2) {
    section2 = await prisma.section.create({
      data: {
        name:       "Molave",
        emoji:      "🌿",
        gradeLevel: "Grade 6",
        teacherId:  teacher.id,
        schoolId:   school.id,
        schoolYear: "2025-2026",
        isActive:   true,
      },
    });
  } else if (!section2.schoolId) {
    section2 = await prisma.section.update({
      where: { id: section2.id },
      data:  { schoolId: school.id },
    });
  }
  console.log(`  + Section: ${section2.name} (id=${section2.id})`);

  // ── 4. Students ────────────────────────────────────────────
  const studentData = [
    // Narra section
    { name: "Juan Dela Cruz",    email: "student1@tsr.edu", avatar: "WIZARD"   as const, avatarEmoji: "🧙‍♂️", avatarName: "The Wizard",   difficulty: "ADVENTURER" as const, sectionId: section.id  },
    { name: "Maria Reyes",       email: "student2@tsr.edu", avatar: "ELF"      as const, avatarEmoji: "🧝",   avatarName: "The Elf",      difficulty: "APPRENTICE" as const, sectionId: section.id  },
    { name: "Carlo Bautista",    email: "student3@tsr.edu", avatar: "HERO"     as const, avatarEmoji: "🦸",   avatarName: "The Hero",     difficulty: "CHAMPION"  as const,  sectionId: section.id  },
    { name: "Ana Gonzales",      email: "student4@tsr.edu", avatar: "EXPLORER" as const, avatarEmoji: "🧭",   avatarName: "The Explorer", difficulty: "ADVENTURER" as const, sectionId: section.id  },
    { name: "Miguel Villanueva", email: "student5@tsr.edu", avatar: "FOX"      as const, avatarEmoji: "🦊",   avatarName: "The Fox",      difficulty: "APPRENTICE" as const, sectionId: section.id  },
    // Molave section
    { name: "Sofia Mendoza",     email: "student6@tsr.edu", avatar: "DRAGON"   as const, avatarEmoji: "🐉",   avatarName: "The Dragon",   difficulty: "CHAMPION"  as const,  sectionId: section2.id },
    { name: "Luis Ramos",        email: "student7@tsr.edu", avatar: "LION"     as const, avatarEmoji: "🦁",   avatarName: "The Lion",     difficulty: "ADVENTURER" as const, sectionId: section2.id },
    { name: "Grace Aquino",      email: "student8@tsr.edu", avatar: "EAGLE"    as const, avatarEmoji: "🦅",   avatarName: "The Eagle",    difficulty: "APPRENTICE" as const, sectionId: section2.id },
  ];

  for (const s of studentData) {
    const user = await prisma.user.upsert({
      where:  { email: s.email },
      update: {},
      create: { name: s.name, email: s.email, password: studentPw, role: "STUDENT" },
    });
    await prisma.studentProfile.upsert({
      where:  { userId: user.id },
      update: {},
      create: {
        userId:      user.id,
        avatar:      s.avatar,
        avatarEmoji: s.avatarEmoji,
        avatarName:  s.avatarName,
        difficulty:  s.difficulty,
        sectionId:   s.sectionId,
        schoolId:    school.id,
        setupDone:   true,
        xp:          0,
        level:       1,
      },
    });
    console.log(`  + Student: ${s.email}  [${s.difficulty}]`);
  }

  // ── 5. Module ──────────────────────────────────────────────
  let module = await prisma.module.findFirst({
    where: { title: "Barangay Feeding Program" },
  });
  if (!module) {
    module = await prisma.module.create({
      data: {
        title:        "Barangay Feeding Program",
        subtitle:     "Planning a Nutritious Meal Program on a Budget",
        context:      "FEEDING_PROGRAM",
        scenario:     "The barangay captain of San Isidro has identified 50 malnourished children aged 6–12 in their community. The barangay council has allocated ₱6,000 to run a feeding program for one week (5 school days). As a Grade 6 student and junior community planner, you are tasked to design a cost-effective, nutritious daily meal plan that feeds all 50 children within the given budget. You must analyze the problem, identify constraints, develop meal plans, and reflect on your solution.",
        icon:         "🍱",
        status:       "ACTIVE",
        gradeLevel:   "Grade 6",
        timeEstimate: 90,
        melcTags:     ["M6NS-Ia-1", "M6NS-IIa-128", "M6ME-IIIa-1"],
      },
    });
  }
  console.log(`  + Module:  ${module.title} (id=${module.id})`);

  // Assign module to both sections
  await prisma.moduleAssignment.upsert({
    where:  { moduleId_sectionId: { moduleId: module.id, sectionId: section.id } },
    update: {},
    create: { moduleId: module.id, sectionId: section.id },
  });
  await prisma.moduleAssignment.upsert({
    where:  { moduleId_sectionId: { moduleId: module.id, sectionId: section2.id } },
    update: {},
    create: { moduleId: module.id, sectionId: section2.id },
  });

  // ── 6. Stages ──────────────────────────────────────────────
  const stages = [
    // ─────── UNDERSTANDING (Stages 1–3) ───────────────────────
    {
      stageNumber:   1,
      phase:         "UNDERSTANDING" as const,
      title:         "Identify & Categorize",
      type:          "MULTIPLE_CHOICE" as const,
      instruction:   "Read the scenario carefully. The barangay is organizing a feeding program for 50 malnourished children for 5 days with a budget of ₱6,000. What type of mathematical problem is being described?",
      hint:          "Think about what the main challenge is — the barangay has a limited amount of money and needs to divide it to meet everyone's needs.",
      maxScore:      10,
      options: {
        choices: [
          { icon: "📊", title: "Data Analysis",     desc: "A problem about collecting and interpreting numerical data from surveys or observations" },
          { icon: "🗺️", title: "Route Planning",    desc: "A problem about finding the best path, distance, or travel schedule between locations" },
          { icon: "💰", title: "Budget Allocation",  desc: "A problem about distributing limited funds to meet specific needs within constraints" },
          { icon: "📐", title: "Measurement",        desc: "A problem about finding dimensions such as length, area, or perimeter of shapes" },
        ],
        correctChoiceIndex: 2,
      },
      correctAnswer: "2",
    },
    {
      stageNumber:   2,
      phase:         "UNDERSTANDING" as const,
      title:         "Select & Prioritize",
      type:          "RANKING" as const,
      instruction:   "Rank the following considerations from MOST IMPORTANT (top) to LEAST IMPORTANT (bottom) when planning the barangay feeding program. Drag and drop each item into your preferred order.",
      hint:          "Start with what the children need most — nutrition should always come first in a health program. Then consider the budget, since without money nothing can be done.",
      maxScore:      10,
      options: {
        rankItems: [
          { emoji: "🥗", text: "Nutritional value of meals",       sub: "Meeting children's daily dietary requirements" },
          { emoji: "💰", text: "Total cost per serving",           sub: "Staying within the ₱6,000 budget" },
          { emoji: "👨‍🍳", text: "Ease of preparation",             sub: "Can be cooked with available equipment and volunteers" },
          { emoji: "🛒", text: "Availability of ingredients",      sub: "Items easily sourced from the local public market" },
          { emoji: "😋", text: "Taste and appeal to children",     sub: "Meals that children will actually eat and enjoy" },
        ],
      },
      correctAnswer: JSON.stringify([
        "Nutritional value of meals",
        "Total cost per serving",
        "Ease of preparation",
        "Availability of ingredients",
        "Taste and appeal to children",
      ]),
    },
    {
      stageNumber:   3,
      phase:         "UNDERSTANDING" as const,
      title:         "Define the Problem",
      type:          "OPEN_ENDED" as const,
      instruction:   "Write a clear and complete problem statement for the Barangay Feeding Program. Use the sentence starters below to help you. Include who is involved, what the challenge is, what the goal is, and what constraints you must consider.",
      hint:          "A good problem statement answers: WHO has the problem? WHAT is the challenge? WHAT is the goal? WHAT are the limits? Try to mention the 50 children, the ₱6,000 budget, and the 5-day duration.",
      maxScore:      10,
      options: {
        starterChips: [
          { label: "Who:",         text: "The barangay captain of San Isidro needs to..." },
          { label: "Challenge:",   text: "The main challenge is to..." },
          { label: "Goal:",        text: "The goal of the feeding program is to..." },
          { label: "Constraints:", text: "The program is limited by..." },
          { label: "Why:",         text: "This problem is important because..." },
        ],
        minChars: 80,
      },
      correctAnswer: null,
    },

    // ─────── ANALYSIS (Stages 4–7) ────────────────────────────
    {
      stageNumber:   4,
      phase:         "ANALYSIS" as const,
      title:         "Analyze Information",
      type:          "TABLE_INPUT" as const,
      instruction:   "Fill in the table to organize what you know about the feeding program. For each item, decide if it is GIVEN (stated in the problem), MISSING (needed but not stated), or ASSUMED (a reasonable guess you must make).",
      hint:          "The scenario directly states: 50 children, ₱6,000 budget, 5 days. What information would you NEED to plan meals that is NOT stated? Think about daily budget, cost per meal per child, and nutritional needs.",
      maxScore:      10,
      options: {
        tableRows: [
          { label: "Number of children",        given: "50",                    missing: "",  assumed: "",                     givenEditable: false, missingEditable: true,  assumedEditable: true  },
          { label: "Total budget",              given: "₱6,000",               missing: "",  assumed: "",                     givenEditable: false, missingEditable: true,  assumedEditable: true  },
          { label: "Number of days",            given: "5 days",               missing: "",  assumed: "",                     givenEditable: false, missingEditable: true,  assumedEditable: true  },
          { label: "Daily budget",              given: "",                     missing: "",  assumed: "₱1,200 (₱6,000 ÷ 5)", givenEditable: true,  missingEditable: true,  assumedEditable: false },
          { label: "Cost per meal per child",   given: "",                     missing: "✓", assumed: "",                     givenEditable: true,  missingEditable: false, assumedEditable: true  },
          { label: "Nutritional requirements",  given: "",                     missing: "✓", assumed: "",                     givenEditable: true,  missingEditable: false, assumedEditable: true  },
          { label: "Number of meals per day",   given: "",                     missing: "",  assumed: "1 (lunch only)",       givenEditable: true,  missingEditable: true,  assumedEditable: false },
        ],
      },
      correctAnswer: null,
    },
    {
      stageNumber:   5,
      phase:         "ANALYSIS" as const,
      title:         "Identify Constraints",
      type:          "CHECKLIST" as const,
      instruction:   "Check (✓) all the statements that are TRUE constraints of the Barangay Feeding Program. A constraint is a rule, limit, or condition that your solution MUST follow.",
      hint:          "A constraint is something you CANNOT change. The budget is a constraint because you cannot spend more than ₱6,000. Think carefully: is each item a hard rule or just a nice-to-have?",
      maxScore:      10,
      options: {
        checkItems: [
          { text: "Must not exceed ₱6,000 total budget",              desc: "The financial limit set by the barangay council" },
          { text: "Must serve all 50 children every day",             desc: "All identified malnourished children must be fed" },
          { text: "Program must run for exactly 5 days",              desc: "One full school week" },
          { text: "Meals must meet basic nutritional requirements",    desc: "Must include proteins, carbohydrates, and vitamins" },
          { text: "Ingredients must be available in the local market", desc: "No imported or specialty items not available locally" },
          { text: "Must use only one type of viand per day",          desc: "Limit variety strictly to reduce preparation cost" },
          { text: "Must hire a licensed nutritionist",                desc: "Professional dietary oversight is legally required" },
        ],
      },
      correctAnswer: JSON.stringify({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: false, 6: false }),
    },
    {
      stageNumber:   6,
      phase:         "ANALYSIS" as const,
      title:         "Determine Root Causes",
      type:          "OPEN_ENDED" as const,
      instruction:   "Analyze the root causes of the malnutrition problem in the barangay. Answer each question with a thoughtful and complete response.",
      hint:          "Root causes are the deep reasons behind a problem, not just the surface symptoms. Think about poverty, lack of access to food, poor nutrition knowledge, or community conditions. Connect your answers to the feeding program solution.",
      maxScore:      10,
      options: {
        prompts: [
          "Why do you think 50 children in Barangay San Isidro are malnourished? What are the likely root causes?",
          "What factors make it difficult for families in this barangay to provide nutritious meals every day?",
          "How does the barangay feeding program help address these root causes? What are its limitations?",
        ],
      },
      correctAnswer: null,
    },
    {
      stageNumber:   7,
      phase:         "ANALYSIS" as const,
      title:         "Data Analysis",
      type:          "COMPUTATION" as const,
      instruction:   "Use the ingredient list below to plan ONE DAY of meals for 50 children. Set the quantity for each ingredient. Your total cost must not exceed the daily budget of ₱1,200.",
      hint:          "Daily budget = ₱6,000 ÷ 5 days = ₱1,200. For 50 children you need about 5–6 kg of rice. Choose one protein source. Add vegetables for nutrition. Tip: ₱1,200 ÷ 50 children = ₱24 per child per meal.",
      maxScore:      10,
      options: {
        calcItems: [
          { icon: "🍚", label: "Rice (1 kg)",                   price: 55,  unit: "kg"     },
          { icon: "🐔", label: "Chicken (1 kg)",                price: 180, unit: "kg"     },
          { icon: "🥚", label: "Eggs (1 tray / 30 pcs)",        price: 180, unit: "tray"   },
          { icon: "🥬", label: "Vegetables, assorted (1 kg)",   price: 60,  unit: "kg"     },
          { icon: "🫘", label: "Monggo beans (1 kg)",           price: 90,  unit: "kg"     },
          { icon: "🐟", label: "Sardines canned (24-can box)",  price: 480, unit: "box"    },
          { icon: "🧂", label: "Cooking oil (1 L)",             price: 90,  unit: "L"      },
          { icon: "🧅", label: "Onion & garlic (bundle)",       price: 40,  unit: "bundle" },
          { icon: "🍞", label: "Pandesal (50 pcs)",             price: 100, unit: "pack"   },
          { icon: "🥛", label: "Powdered milk (200 g)",         price: 120, unit: "pack"   },
        ],
        budget: 1200,
      },
      correctAnswer: null,
    },

    // ─────── SOLUTION (Stages 8–10) ───────────────────────────
    {
      stageNumber:   8,
      phase:         "SOLUTION" as const,
      title:         "Develop Solutions",
      type:          "MULTI_PLAN" as const,
      instruction:   "Create TWO different meal plan solutions for the 5-day feeding program. Plan A and Plan B should be different approaches. Fill in all the details for each plan.",
      hint:          "Plan A could be a simple affordable plan (e.g., lugaw / arroz caldo). Plan B could be more nutritious but slightly more expensive (e.g., chicken adobo with rice). Make sure BOTH plans stay within ₱6,000 total.",
      maxScore:      10,
      options: {
        planLabels: ["Plan A", "Plan B"] as [string, string],
        planFields: [
          { label: "Daily menu (describe the meals)",  key: "menu",      type: "text"   as const, placeholder: "e.g., Arroz caldo with boiled egg and banana" },
          { label: "Estimated daily cost (₱)",        key: "dailyCost", type: "number" as const, placeholder: "e.g., 1100" },
          { label: "Total 5-day cost (₱)",            key: "totalCost", type: "number" as const, placeholder: "e.g., 5500" },
          { label: "Main nutritional benefit",        key: "nutrition", type: "text"   as const, placeholder: "e.g., High in carbohydrates and protein" },
          { label: "Possible challenge or drawback",  key: "challenge", type: "text"   as const, placeholder: "e.g., Children may grow tired of the same menu" },
        ],
        planBudget: 6000,
      },
      correctAnswer: null,
    },
    {
      stageNumber:   9,
      phase:         "SOLUTION" as const,
      title:         "Anticipate Problems",
      type:          "CHECKLIST" as const,
      instruction:   "Check all the RISKS that could affect your feeding program. Then write a contingency plan — what will you do if these problems happen?",
      hint:          "Think about what could go wrong before and during the program. Natural events, market conditions, and human factors can all create problems. A good planner always has a backup plan.",
      maxScore:      10,
      options: {
        riskItems: [
          { emoji: "🌧️", title: "Bad weather",         sub: "Rain or typhoon disrupts outdoor cooking and food delivery" },
          { emoji: "📈", title: "Price increase",       sub: "Market prices rise above your budget calculations" },
          { emoji: "🤒", title: "Volunteer illness",    sub: "Key cooks or volunteers become sick and cannot help" },
          { emoji: "🛒", title: "Ingredient shortage",  sub: "Specific items are not available in the local market" },
          { emoji: "😷", title: "Food contamination",   sub: "Improper storage or handling causes food to spoil or become unsafe" },
          { emoji: "📋", title: "Low attendance",       sub: "Children do not show up for meals, causing significant food waste" },
          { emoji: "✅", title: "Budget surplus",       sub: "The program spends significantly less than planned" },
        ],
        hasContingency: true,
      },
      correctAnswer: JSON.stringify({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: false, 6: false }),
    },
    {
      stageNumber:   10,
      phase:         "SOLUTION" as const,
      title:         "Trial Implementation",
      type:          "BUDGET_CHECK" as const,
      instruction:   "Plan your COMPLETE ingredient shopping list for the entire 5-day feeding program for 50 children. Adjust the quantity for each item. Your total must NOT exceed ₱6,000.",
      hint:          "Plan for ALL 5 days now, not just one. If you need 5 kg of rice per day, you need 25 kg total for 5 days. Total budget is ₱6,000. Try to keep a ₱200–₱300 buffer for unexpected costs.",
      maxScore:      10,
      options: {
        trialItems: [
          { icon: "🍚", name: "Rice (1 kg)",                  price: 55,  unit: "kg",     id: "rice"      },
          { icon: "🐔", name: "Chicken (1 kg)",               price: 180, unit: "kg",     id: "chicken"   },
          { icon: "🥚", name: "Eggs (1 tray / 30 pcs)",       price: 180, unit: "tray",   id: "eggs"      },
          { icon: "🥬", name: "Vegetables, assorted (1 kg)",  price: 60,  unit: "kg",     id: "veggies"   },
          { icon: "🫘", name: "Monggo beans (1 kg)",          price: 90,  unit: "kg",     id: "monggo"    },
          { icon: "🐟", name: "Sardines canned (24-can box)", price: 480, unit: "box",    id: "sardines"  },
          { icon: "🧂", name: "Cooking oil (1 L)",            price: 90,  unit: "L",      id: "oil"       },
          { icon: "🧅", name: "Onion & garlic (bundle)",      price: 40,  unit: "bundle", id: "aromatics" },
          { icon: "🍞", name: "Pandesal (50 pcs)",            price: 100, unit: "pack",   id: "pandesal"  },
          { icon: "🥛", name: "Powdered milk (200 g)",        price: 120, unit: "pack",   id: "milk"      },
        ],
        trialBudget: 6000,
      },
      correctAnswer: null,
    },

    // ─────── REFLECTION (Stages 11–12) ────────────────────────
    {
      stageNumber:   11,
      phase:         "REFLECTION" as const,
      title:         "Choose Best Solution",
      type:          "SELECT_JUSTIFY" as const,
      instruction:   "Look back at your two meal plans from Stage 8. Which plan do you think is the BETTER solution for the Barangay Feeding Program? Select your choice and write a detailed justification.",
      hint:          "The best solution should: (1) stay within ₱6,000, (2) be nutritious for growing children, (3) be practical and easy to prepare, and (4) have low risk of problems. Compare your two plans on these criteria.",
      maxScore:      10,
      options: {
        justifyLabel: "Explain why your chosen plan is better. Consider: nutritional value, total cost, ease of preparation, and community impact. Use specific numbers from your plans to support your answer.",
      },
      correctAnswer: "A",
    },
    {
      stageNumber:   12,
      phase:         "REFLECTION" as const,
      title:         "Reflect & Review",
      type:          "REFLECTION_SLIDER" as const,
      instruction:   "You have completed the Barangay Feeding Program module! Reflect on your learning journey. Rate yourself honestly on each dimension, then answer the reflection questions.",
      hint:          "There are no right or wrong answers here — this is about your honest self-assessment. Think about what you learned, what was difficult, and how you grew as a problem-solver.",
      maxScore:      10,
      options: {
        sliderQuestions: [
          { question: "How well did you understand the feeding program problem?",    loLabel: "I was confused",     hiLabel: "I understood clearly", key: "understanding" },
          { question: "How confident are you in analyzing budget data?",             loLabel: "Not confident",      hiLabel: "Very confident",       key: "analysis"      },
          { question: "How effective do you think your meal plan solution is?",      loLabel: "Not effective",      hiLabel: "Very effective",       key: "solution"      },
          { question: "How much did you grow as a problem-solver?",                  loLabel: "Very little growth", hiLabel: "I grew a lot",         key: "growth"        },
        ],
        openReflections: [
          { question: "What was the most challenging part of planning the feeding program, and how did you work through it?", key: "challenge"  },
          { question: "What mathematics skills did you use in this activity? How will you apply them in real life?",          key: "mathSkills" },
        ],
      },
      correctAnswer: null,
    },
  ];

  for (const s of stages) {
    const { correctAnswer, options, ...rest } = s;
    await prisma.stage.upsert({
      where:  { moduleId_stageNumber: { moduleId: module.id, stageNumber: s.stageNumber } },
      update: {},
      create: {
        moduleId:      module.id,
        ...rest,
        options:       options as object,
        correctAnswer: correctAnswer ?? undefined,
      },
    });
    console.log(`  + Stage ${String(s.stageNumber).padStart(2, " ")}: ${s.title}`);
  }

  // ── 7. Pre-Test ────────────────────────────────────────────
  let preTest = await prisma.testSet.findFirst({
    where: { moduleId: module.id, type: "PRE_TEST" },
  });
  if (!preTest) {
    preTest = await prisma.testSet.create({
      data: {
        moduleId:    module.id,
        type:        "PRE_TEST",
        title:       "Pre-Test: Mathematics Problem Solving",
        description: "Answer all 20 questions to the best of your ability. This test will help your teacher understand your current math skills before the module.",
        timeLimit:   2400,
        isActive:    true,
      },
    });
  }

  const preTestQs = [
    { n:  1, ctx: "Arithmetic",      text: "What is 2,450 ÷ 5?",                                                                                                                          answer: "490",   type: "number", diff: "easy"     },
    { n:  2, ctx: "Division",        text: "A vendor sells 3 kg of rice for ₱165. How much does 1 kg cost?",                                                                               answer: "55",    type: "number", diff: "easy"     },
    { n:  3, ctx: "Percentage",      text: "What is 15% of 800?",                                                                                                                         answer: "120",   type: "number", diff: "average"  },
    { n:  4, ctx: "Multiplication",  text: "If 50 children each need 250 grams of rice, how many kilograms is that in total?",                                                             answer: "12.5",  type: "number", diff: "average"  },
    { n:  5, ctx: "Division",        text: "A budget of ₱6,000 is divided equally over 5 days. How much is available each day?",                                                          answer: "1200",  type: "number", diff: "easy"     },
    { n:  6, ctx: "Rounding",        text: "Round 4,567 to the nearest hundred.",                                                                                                         answer: "4600",  type: "number", diff: "easy"     },
    { n:  7, ctx: "LCM",             text: "What is the Least Common Multiple (LCM) of 4 and 6?",                                                                                         answer: "12",    type: "number", diff: "average"  },
    { n:  8, ctx: "Multiplication",  text: "A bundle of onions costs ₱40. If you need 3 bundles, how much will you spend?",                                                               answer: "120",   type: "number", diff: "easy"     },
    { n:  9, ctx: "Fractions",       text: "What is 3/4 + 1/2? Express your answer as a decimal.",                                                                                       answer: "1.25",  type: "number", diff: "average"  },
    { n: 10, ctx: "Decimals",        text: "If 1 kg of chicken costs ₱180 and you need 2.5 kg, what is the total cost?",                                                                 answer: "450",   type: "number", diff: "average"  },
    { n: 11, ctx: "Percentage",      text: "What is 25% of 2,400?",                                                                                                                      answer: "600",   type: "number", diff: "average"  },
    { n: 12, ctx: "Fractions",       text: "Express 0.75 as a fraction in lowest terms. Write your answer as a fraction (e.g., 3/4).",                                                   answer: "3/4",   type: "text",   diff: "average"  },
    { n: 13, ctx: "Measurement",     text: "A recipe needs 250 milliliters of cooking oil. How many liters is that?",                                                                    answer: "0.25",  type: "number", diff: "average"  },
    { n: 14, ctx: "Division",        text: "What is 48 ÷ 0.8?",                                                                                                                          answer: "60",    type: "number", diff: "difficult" },
    { n: 15, ctx: "Problem Solving", text: "Feeding 50 children costs ₱1,200 per day. What is the cost per child per day?",                                                              answer: "24",    type: "number", diff: "easy"     },
    { n: 16, ctx: "GCF",             text: "What is the Greatest Common Factor (GCF) of 24 and 36?",                                                                                     answer: "12",    type: "number", diff: "average"  },
    { n: 17, ctx: "Decimals",        text: "What is 3.5 × 4?",                                                                                                                           answer: "14",    type: "number", diff: "easy"     },
    { n: 18, ctx: "Problem Solving", text: "A volunteer works 2.5 hours each day for 5 days. How many total hours did the volunteer work?",                                               answer: "12.5",  type: "number", diff: "average"  },
    { n: 19, ctx: "Percentage",      text: "What is 120% of 500?",                                                                                                                       answer: "600",   type: "number", diff: "difficult" },
    { n: 20, ctx: "Problem Solving", text: "A child needs 2,000 calories per day. If lunch provides 40% of daily calories, how many calories come from lunch?",                          answer: "800",   type: "number", diff: "average"  },
  ];

  for (const q of preTestQs) {
    await prisma.testQuestion.upsert({
      where:  { testSetId_questionNum: { testSetId: preTest.id, questionNum: q.n } },
      update: {},
      create: { testSetId: preTest.id, questionNum: q.n, context: q.ctx, questionText: q.text, answer: q.answer, answerType: q.type, difficulty: q.diff, points: 1 },
    });
  }
  console.log(`  + Pre-test:  ${preTestQs.length} questions`);

  // ── 8. Post-Test ───────────────────────────────────────────
  let postTest = await prisma.testSet.findFirst({
    where: { moduleId: module.id, type: "POST_TEST" },
  });
  if (!postTest) {
    postTest = await prisma.testSet.create({
      data: {
        moduleId:    module.id,
        type:        "POST_TEST",
        title:       "Post-Test: Mathematics Problem Solving",
        description: "Answer all 20 questions. This test will show how much you have learned through the Barangay Feeding Program module.",
        timeLimit:   2400,
        isActive:    true,
      },
    });
  }

  const postTestQs = [
    { n:  1, ctx: "Arithmetic",      text: "What is 3,600 ÷ 6?",                                                                                                                                        answer: "600",   type: "number", diff: "easy"     },
    { n:  2, ctx: "Division",        text: "A vendor sells 5 kg of vegetables for ₱300. How much does 1 kg cost?",                                                                                      answer: "60",    type: "number", diff: "easy"     },
    { n:  3, ctx: "Percentage",      text: "What is 20% of 750?",                                                                                                                                       answer: "150",   type: "number", diff: "average"  },
    { n:  4, ctx: "Multiplication",  text: "If 30 children each need 200 grams of monggo beans, how many grams is that in total?",                                                                       answer: "6000",  type: "number", diff: "average"  },
    { n:  5, ctx: "Division",        text: "A budget of ₱5,250 is divided equally over 7 days. How much is available each day?",                                                                        answer: "750",   type: "number", diff: "easy"     },
    { n:  6, ctx: "Rounding",        text: "Round 7,384 to the nearest hundred.",                                                                                                                       answer: "7400",  type: "number", diff: "easy"     },
    { n:  7, ctx: "LCM",             text: "What is the Least Common Multiple (LCM) of 3 and 5?",                                                                                                       answer: "15",    type: "number", diff: "average"  },
    { n:  8, ctx: "Multiplication",  text: "One tray of eggs costs ₱180. If you need 2 trays, how much will you spend?",                                                                                answer: "360",   type: "number", diff: "easy"     },
    { n:  9, ctx: "Fractions",       text: "What is 1/2 + 1/4? Express your answer as a decimal.",                                                                                                     answer: "0.75",  type: "number", diff: "average"  },
    { n: 10, ctx: "Decimals",        text: "If 1 kg of fish costs ₱120 and you need 4 kg, what is the total cost?",                                                                                    answer: "480",   type: "number", diff: "easy"     },
    { n: 11, ctx: "Percentage",      text: "What is 30% of 1,500?",                                                                                                                                    answer: "450",   type: "number", diff: "average"  },
    { n: 12, ctx: "Fractions",       text: "Express 0.6 as a fraction in lowest terms. Write your answer as a fraction (e.g., 3/5).",                                                                  answer: "3/5",   type: "text",   diff: "average"  },
    { n: 13, ctx: "Measurement",     text: "A recipe needs 500 milliliters of water. How many liters is that?",                                                                                        answer: "0.5",   type: "number", diff: "average"  },
    { n: 14, ctx: "Division",        text: "What is 36 ÷ 0.9?",                                                                                                                                        answer: "40",    type: "number", diff: "difficult" },
    { n: 15, ctx: "Problem Solving", text: "Feeding 30 children costs ₱900 per day. What is the cost per child per day?",                                                                              answer: "30",    type: "number", diff: "easy"     },
    { n: 16, ctx: "GCF",             text: "What is the Greatest Common Factor (GCF) of 18 and 24?",                                                                                                   answer: "6",     type: "number", diff: "average"  },
    { n: 17, ctx: "Decimals",        text: "What is 4.5 × 6?",                                                                                                                                         answer: "27",    type: "number", diff: "easy"     },
    { n: 18, ctx: "Problem Solving", text: "A cook prepares meals for 1.5 hours each day over 6 days. How many total hours did the cook work?",                                                        answer: "9",     type: "number", diff: "average"  },
    { n: 19, ctx: "Percentage",      text: "What is 150% of 400?",                                                                                                                                     answer: "600",   type: "number", diff: "difficult" },
    { n: 20, ctx: "Problem Solving", text: "A child needs 1,800 calories per day. If breakfast provides 25% of daily calories, how many calories come from breakfast?",                                answer: "450",   type: "number", diff: "average"  },
  ];

  for (const q of postTestQs) {
    await prisma.testQuestion.upsert({
      where:  { testSetId_questionNum: { testSetId: postTest.id, questionNum: q.n } },
      update: {},
      create: { testSetId: postTest.id, questionNum: q.n, context: q.ctx, questionText: q.text, answer: q.answer, answerType: q.type, difficulty: q.diff, points: 1 },
    });
  }
  console.log(`  + Post-test: ${postTestQs.length} questions`);

  console.log("\nSeeding complete!\n");
  console.log("  Credentials:");
  console.log("    admin@tsr.edu      Admin1234!");
  console.log("    teacher@tsr.edu    Teacher1234!");
  console.log("    student1@tsr.edu   Student1234!  (students 1–8 use same password)");
  console.log("    students 1–5 → Narra section");
  console.log("    students 6–8 → Molave section\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
