import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireUser();
  if (!auth.user) return auth.response!;
  const subjects = await prisma.subject.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ subjects });
}
