import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.user) return auth.response!;
  const { id } = await context.params;
  const exam = await prisma.exam.findFirst({
    where: { id, status: "PUBLISHED" },
    include: { questions: { orderBy: { position: "asc" }, include: { question: { select: { id: true, prompt: true, options: true } } } } },
  });
  if (!exam || exam.questions.length === 0) return NextResponse.json({ error: "Exam not found or has no questions." }, { status: 404 });
  const existing = await prisma.attempt.findFirst({
    where: { userId: auth.user.id, examId: exam.id, status: "IN_PROGRESS", expiresAt: { gt: new Date() } },
    select: { id: true, expiresAt: true },
  });
  if (existing) return NextResponse.json({ attempt: existing, exam: { id: exam.id, title: exam.title, durationMin: exam.durationMin }, questions: exam.questions.map((item) => item.question) });
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + exam.durationMin * 60_000);
  const attempt = await prisma.attempt.create({
    data: {
      userId: auth.user.id, examId: exam.id, startedAt, expiresAt,
      answers: { create: exam.questions.map(({ question }) => ({ questionId: question.id })) },
    },
    select: { id: true, startedAt: true, expiresAt: true, status: true },
  });
  return NextResponse.json({ attempt, exam: { id: exam.id, title: exam.title, durationMin: exam.durationMin }, questions: exam.questions.map((item) => item.question) }, { status: 201 });
}
