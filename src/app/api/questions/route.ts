import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.user) return auth.response!;
  const { searchParams } = new URL(request.url);
  const subjectSlug = searchParams.get("subject");
  const examType = searchParams.get("examType") ?? "JAMB";
  const questions = await prisma.question.findMany({
    where: {
      active: true,
      examType,
      ...(subjectSlug ? { subject: { slug: subjectSlug } } : {}),
    },
    select: { id: true, prompt: true, options: true, explanation: true, difficulty: true, examType: true, subject: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ questions });
}

const createSchema = z.object({
  subjectId: z.string().min(1),
  prompt: z.string().trim().min(5).max(4000),
  options: z.array(z.string().trim().min(1).max(1000)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().trim().min(1).max(4000),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  examType: z.enum(["JAMB", "WAEC"]).default("JAMB"),
}).refine((data) => data.correctIndex < data.options.length, { message: "Correct answer must match an option.", path: ["correctIndex"] });

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.user) return auth.response!;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid question details.", details: parsed.error.flatten() }, { status: 400 });
  const subject = await prisma.subject.findUnique({ where: { id: parsed.data.subjectId }, select: { id: true } });
  if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
  const question = await prisma.question.create({ data: { ...parsed.data, authorId: auth.user.id } });
  return NextResponse.json({ question: { id: question.id, prompt: question.prompt, subjectId: question.subjectId } }, { status: 201 });
}
