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
