import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.user) return auth.response!;
  const { id } = await context.params;
  const attempt = await prisma.attempt.findFirst({
    where: { id, userId: auth.user.id },
    include: { exam: { select: { subjectId: true, title: true } }, answers: { include: { question: { select: { correctIndex: true } } } } },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  if (attempt.status !== "IN_PROGRESS") return NextResponse.json({ error: "This attempt has already been submitted.", result: { score: attempt.score, total: attempt.total } }, { status: 409 });
  const expired = attempt.expiresAt <= new Date();
  const marked = attempt.answers.map((answer) => ({
    id: answer.id,
    selectedIndex: answer.selectedIndex,
    isCorrect: answer.selectedIndex !== null && answer.selectedIndex === answer.question.correctIndex,
  }));
  const correct = marked.filter((answer) => answer.isCorrect).length;
  const total = marked.length;
  await prisma.$transaction([
    ...marked.map((answer) => prisma.attemptAnswer.update({ where: { id: answer.id }, data: { isCorrect: answer.isCorrect } })),
    prisma.attempt.update({ where: { id: attempt.id }, data: { status: expired ? "EXPIRED" : "SUBMITTED", submittedAt: new Date(), score: correct, total } }),
    prisma.studyProgress.upsert({
      where: { userId_subjectId: { userId: auth.user.id, subjectId: attempt.exam.subjectId } },
      create: { userId: auth.user.id, subjectId: attempt.exam.subjectId, questionsSeen: total, questionsCorrect: correct },
      update: { questionsSeen: { increment: total }, questionsCorrect: { increment: correct } },
    }),
  ]);
  return NextResponse.json({ result: { attemptId: attempt.id, examTitle: attempt.exam.title, score: correct, total, percentage: total ? Math.round((correct / total) * 100) : 0, status: expired ? "EXPIRED" : "SUBMITTED" } });
}
