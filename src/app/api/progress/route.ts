import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireUser();
  if (!auth.user) return auth.response!;
  const [progress, attempts] = await Promise.all([
    prisma.studyProgress.findMany({
      where: { userId: auth.user.id },
      include: { subject: { select: { id: true, name: true, slug: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.attempt.findMany({
      where: { userId: auth.user.id, status: { in: ["SUBMITTED", "EXPIRED"] } },
      select: { id: true, score: true, total: true, submittedAt: true, exam: { select: { title: true, subject: { select: { name: true } } } } },
      orderBy: { submittedAt: "desc" },
      take: 20,
    }),
  ]);
  const questionsSeen = progress.reduce((sum, item) => sum + item.questionsSeen, 0);
  const questionsCorrect = progress.reduce((sum, item) => sum + item.questionsCorrect, 0);
  return NextResponse.json({
    summary: { questionsSeen, questionsCorrect, accuracy: questionsSeen ? Math.round(questionsCorrect / questionsSeen * 100) : 0, completedExams: attempts.length },
    subjects: progress.map(({ subject, questionsSeen, questionsCorrect, studySeconds, updatedAt }) => ({ subject, questionsSeen, questionsCorrect, accuracy: questionsSeen ? Math.round(questionsCorrect / questionsSeen * 100) : 0, studySeconds, updatedAt })),
    recentAttempts: attempts,
  });
}
