import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({ role: z.enum(["STUDENT", "TEACHER", "ADMIN"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.user) return auth.response!;
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  if (id === auth.user.id && parsed.data.role !== "ADMIN") return NextResponse.json({ error: "You cannot remove your own administrator role." }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return NextResponse.json({ error: "At least one administrator must remain." }, { status: 409 });
  }
  const user = await prisma.user.update({ where: { id }, data: { role: parsed.data.role }, select: { id: true, name: true, email: true, role: true } });
  return NextResponse.json({ user });
}
