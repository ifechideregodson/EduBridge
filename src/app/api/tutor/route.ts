import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  message: z.string().trim().min(2).max(4000),
  subject: z.string().trim().max(100).optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.user) return auth.response!;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a question of up to 4,000 characters." }, { status: 400 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "The AI tutor is not configured yet. Add OPENAI_API_KEY in Vercel project settings." }, { status: 503 });

  const recent = await prisma.tutorMessage.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { role: true, content: true },
  });
  const history = recent.reverse().map((item) => ({
    role: item.role === "assistant" ? "assistant" : "user",
    content: item.content,
  }));
  const userPrompt = parsed.data.subject ? `Subject: ${parsed.data.subject}\nStudent question: ${parsed.data.message}` : parsed.data.message;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          { role: "system", content: "You are EduBridge Tutor for Nigerian students preparing for JAMB UTME and WAEC. Explain concepts step by step in clear, age-appropriate language. Encourage learning rather than simply giving unexplained answers. If a question is ambiguous, ask for clarification. Do not claim certainty when unsure." },
          ...history,
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) {
      console.error("AI provider returned status", response.status);
      return NextResponse.json({ error: response.status === 429 ? "The tutor is busy. Please try again shortly." : "The AI tutor could not answer right now." }, { status: response.status === 429 ? 429 : 502 });
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const answer = payload.choices?.[0]?.message?.content?.trim();
    if (!answer) return NextResponse.json({ error: "The tutor returned an empty answer. Please try again." }, { status: 502 });
    await prisma.tutorMessage.createMany({
      data: [
        { userId: auth.user.id, role: "user", content: userPrompt },
        { userId: auth.user.id, role: "assistant", content: answer },
      ],
    });
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Tutor request failed", error);
    return NextResponse.json({ error: "The tutor request timed out or failed. Please try again." }, { status: 502 });
  }
}
