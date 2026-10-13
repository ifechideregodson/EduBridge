import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, requireUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireUser();
  if (!auth.user) return auth.response!;
  const exams = await prisma.exam.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, description: true, examType: true, durationMin: true, subject: { select: { name: true, slug: true } }, _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ exams });
}

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1000).default(""),
  subjectId: z.string().min(1),
  examType: z.enum(["JAMB", "WAEC"]).default("JAMB"),
  durationMin: z.number().int().min(5).max(300),
  questionIds: z.array(z.string().min(1)).min(1).max(200),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.user) return auth.response!;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid exam details.", details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const ids = [...new Set(data.questionIds)];
  if (ids.length !== data.questionIds.length) return NextResponse.json({ error: "Question IDs must be unique." }, { status: 400 });
  const questions = await prisma.question.findMany({ where: { id: { in: ids }, subjectId: data.subjectId, examType: data.examType, active: true }, select: { id: true } });
  if (questions.length !== ids.length) return NextResponse.json({ error: "Every question must be active and match the selected subject and exam type." }, { status: 400 });
  const exam = await prisma.exam.create({
    data: {
      title: data.title,
      description: data.description,
      subjectId: data.subjectId,
      examType: data.examType,
      durationMin: data.durationMin,
      status: "PUBLISHED",
      authorId: auth.user.id,
      questions: { create: ids.map((questionId, position) => ({ questionId, position })) },
    },
    select: { id: true, title: true, durationMin: true, status: true },
  });
  return NextResponse.json({ exam }, { status: 201 });
}
