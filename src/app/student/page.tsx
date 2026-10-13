import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Brain, ClipboardCheck, LogOut, Target } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "TEACHER") redirect("/teacher");
  const [exams, progress, attempts] = await Promise.all([
    prisma.exam.findMany({ where: { status: "PUBLISHED" }, include: { subject: { select: { name: true } }, _count: { select: { questions: true } } }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.studyProgress.findMany({ where: { userId: user.id }, include: { subject: { select: { name: true } } } }),
    prisma.attempt.findMany({ where: { userId: user.id, status: { in: ["SUBMITTED", "EXPIRED"] } }, orderBy: { submittedAt: "desc" }, take: 5, select: { id: true, score: true, total: true, submittedAt: true, exam: { select: { title: true } } } }),
  ]);
  const seen = progress.reduce((sum, p) => sum + p.questionsSeen, 0);
  const correct = progress.reduce((sum, p) => sum + p.questionsCorrect, 0);
  return <main style={{ minHeight: "100vh", background: "#f6f8f6", padding: "26px max(18px, calc((100% - 1100px)/2))" }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 30 }}>
      <Link href="/" className="brand"><span className="brandmark">E</span> EduBridge</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ color: "#53655a", fontSize: 14 }}>Hi, {user.name}</span><form action="/api/auth/logout" method="post"><button className="btn" formAction="/api/auth/logout">Sign out <LogOut size={14}/></button></form></div>
    </header>
    <section style={{ background: "#173f2c", color: "#fff", borderRadius: 22, padding: "28px 24px", marginBottom: 22 }}>
      <p style={{ opacity: .8, margin: "0 0 8px" }}>YOUR LEARNING SPACE</p><h1 style={{ fontSize: 30, margin: "0 0 10px" }}>Keep building your confidence.</h1><p style={{ opacity: .86, margin: 0 }}>Practice consistently, review your results, and improve one topic at a time.</p>
    </section>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 26 }}>
      {[{label:"Questions attempted",value:seen,icon:<BookOpen/>},{label:"Accuracy",value:seen ? Math.round(correct/seen*100)+"%" : "—",icon:<Target/>},{label:"Completed exams",value:attempts.length,icon:<ClipboardCheck/>}].map((item)=><article key={item.label} style={card}><div style={{ color:"#167a55" }}>{item.icon}</div><p style={{ color:"#68786f", margin:"12px 0 5px" }}>{item.label}</p><strong style={{ fontSize:27 }}>{item.value}</strong></article>)}
    </section>
    <section style={{ marginBottom: 28 }}><h2 style={{ fontSize:22, marginBottom:14 }}>Available CBT exams</h2>{exams.length === 0 ? <div style={card}>No published exams yet. Your teacher or administrator can publish an exam when the question bank is ready.</div> : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>{exams.map((exam)=><article key={exam.id} style={card}><p style={{ color:"#167a55", fontSize:12, fontWeight:800, marginTop:0 }}>{exam.examType} · {exam.subject.name}</p><h3 style={{ margin:"0 0 8px" }}>{exam.title}</h3><p style={{ color:"#68786f", fontSize:14 }}>{exam._count.questions} questions · {exam.durationMin} minutes</p><Link href={`/exams/${exam.id}`} className="btn primary" style={{ display:"inline-flex", marginTop:8 }}>Start exam</Link></article>)}</div>}</section>
    <section style={{ marginBottom:28 }}><h2 style={{ fontSize:22, marginBottom:14 }}>Subject progress</h2>{progress.length === 0 ? <div style={card}>Your subject progress will appear here after you complete your first exam.</div> : <div style={{ display:"grid", gap:10 }}>{progress.map((p)=><article key={p.id} style={{ ...card, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}><span>{p.subject.name}</span><strong>{p.questionsSeen ? Math.round(p.questionsCorrect/p.questionsSeen*100) : 0}% accuracy</strong></article>)}</div>}</section>
    <section><h2 style={{ fontSize:22, marginBottom:14 }}>Recent results</h2>{attempts.length === 0 ? <div style={card}>No completed exams yet.</div> : <div style={{ display:"grid", gap:10 }}>{attempts.map((a)=><article key={a.id} style={{ ...card, display:"flex", justifyContent:"space-between", gap:12, alignItems:"center" }}><div><strong>{a.exam.title}</strong><p style={{ margin:"5px 0 0", color:"#68786f", fontSize:13 }}>{a.submittedAt?.toLocaleDateString("en-NG") ?? "Recently completed"}</p></div><strong>{a.score ?? 0}/{a.total ?? 0}</strong></article>)}</div>}</section>
    <p style={{ marginTop:30 }}><Link href="/tutor" className="btn"><Brain size={16}/> Ask the AI tutor</Link></p>
  </main>;
}
const card = { background:"#fff", border:"1px solid #e3ebe5", borderRadius:16, padding:18, boxShadow:"0 3px 15px #173f2c05" } as const;
