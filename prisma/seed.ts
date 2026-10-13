import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const subjects = [
    { name: "Mathematics", slug: "mathematics" },
    { name: "English Language", slug: "english-language" },
    { name: "Biology", slug: "biology" },
    { name: "Chemistry", slug: "chemistry" },
    { name: "Physics", slug: "physics" },
    { name: "Government", slug: "government" },
    { name: "Economics", slug: "economics" },
    { name: "Literature in English", slug: "literature-in-english" },
  ];
  for (const subject of subjects) {
    await prisma.subject.upsert({ where: { slug: subject.slug }, update: { name: subject.name }, create: subject });
  }

  const practiceItems = [
    { subjectSlug: "mathematics", prompt: "Solve 3x + 5 = 20.", options: ["x = 3", "x = 5", "x = 8", "x = 15"], correctIndex: 1, explanation: "Subtract 5 from both sides: 3x = 15. Divide by 3 to get x = 5.", examType: "JAMB" },
    { subjectSlug: "mathematics", prompt: "What is 15% of 200?", options: ["15", "20", "30", "45"], correctIndex: 2, explanation: "15% of 200 is (15/100) × 200 = 30.", examType: "JAMB" },
    { subjectSlug: "mathematics", prompt: "If x² = 49 and x is positive, what is x?", options: ["6", "7", "14", "24.5"], correctIndex: 1, explanation: "The positive square root of 49 is 7.", examType: "JAMB" },
    { subjectSlug: "english-language", prompt: "Choose the word nearest in meaning to “diligent”.", options: ["Careless", "Hardworking", "Impatient", "Uncertain"], correctIndex: 1, explanation: "Diligent means showing care and steady effort in one's work.", examType: "JAMB" },
    { subjectSlug: "biology", prompt: "Which organelle is the main site of aerobic respiration in eukaryotic cells?", options: ["Ribosome", "Nucleus", "Mitochondrion", "Vacuole"], correctIndex: 2, explanation: "Mitochondria generate much of the ATP used by eukaryotic cells during aerobic respiration.", examType: "JAMB" },
  ];
  const mathIds: string[] = [];
  for (const item of practiceItems) {
    const subject = await prisma.subject.findUniqueOrThrow({ where: { slug: item.subjectSlug } });
    const existing = await prisma.question.findFirst({ where: { subjectId: subject.id, prompt: item.prompt, examType: item.examType }, select: { id: true } });
    const question = existing ?? await prisma.question.create({
      data: { subjectId: subject.id, prompt: item.prompt, options: item.options, correctIndex: item.correctIndex, explanation: item.explanation, examType: item.examType, difficulty: "EASY" },
      select: { id: true },
    });
    if (item.subjectSlug === "mathematics") mathIds.push(question.id);
  }
  const starterExam = await prisma.exam.findFirst({ where: { title: "Starter Mathematics Practice" }, select: { id: true } });
  if (!starterExam && mathIds.length > 0) {
    await prisma.exam.create({
      data: {
        title: "Starter Mathematics Practice",
        description: "Original starter practice questions for platform setup; these are not official JAMB past questions.",
        subjectId: (await prisma.subject.findUniqueOrThrow({ where: { slug: "mathematics" } })).id,
        examType: "JAMB",
        durationMin: 10,
        status: "PUBLISHED",
        questions: { create: mathIds.map((questionId, position) => ({ questionId, position })) },
      },
    });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    const passwordHash = await hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN", passwordHash },
      create: { name: "EduBridge Administrator", email, passwordHash, role: "ADMIN" },
    });
    console.log(`Admin account configured for ${email}`);
  } else {
    console.log("ADMIN_EMAIL/ADMIN_PASSWORD not set; no admin account was created or changed.");
  }
  console.log("EduBridge subjects seeded.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
