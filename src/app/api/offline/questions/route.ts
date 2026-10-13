import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireUser();
  if (!auth.user) return auth.response!;
  const questions = await prisma.question.findMany({
    where: { active: true },
    select: { id: true, prompt: true, options: true, correctIndex: true, explanation: true, difficulty: true, examType: true, subject: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return NextResponse.json({ downloadedAt: new Date().toISOString(), questions }, { headers: { "Cache-Control": "no-store" } });
}
