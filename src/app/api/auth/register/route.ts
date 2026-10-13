import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid name, email, and password (at least 10 characters)." }, { status: 400 });
    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const passwordHash = await hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "STUDENT" },
      select: { id: true, name: true, email: true, role: true },
    });
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("AUTH_SECRET")) {
      return NextResponse.json({ error: "Authentication is not configured yet. Please try again later." }, { status: 503 });
    }
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
