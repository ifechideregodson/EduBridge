import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({ questionId: z.string().min(1), selectedIndex: z.number().int().min(0).max(5).nullable() });

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.user) return auth.response!;
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answer." }, { status: 400 });
  const attempt = await prisma.attempt.findFirst({ where: { id, userId: auth.user.id }, select: { id: true, examId: true, status: true, expiresAt: true } });
  if (!attempt) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  if (attempt.status !== "IN_PROGRESS" || attempt.expiresAt <= new Date()) return NextResponse.json({ error: "This exam has ended. Submit it to see your result." }, { status: 409 });
  const item = await prisma.examQuestion.findFirst({ where: { examId: attempt.examId, questionId: parsed.data.questionId }, include: { question: { select: { options: true } } } });
  if (!item) return NextResponse.json({ error: "Question does not belong to this exam." }, { status: 400 });
  if (parsed.data.selectedIndex !== null && parsed.data.selectedIndex >= item.question.options.length) return NextResponse.json({ error: "Selected option does not exist." }, { status: 400 });
  await prisma.attemptAnswer.update({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId: parsed.data.questionId } },
    data: { selectedIndex: parsed.data.selectedIndex },
  });
  return NextResponse.json({ saved: true });
}
