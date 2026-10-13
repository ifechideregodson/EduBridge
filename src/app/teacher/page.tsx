import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QuestionForm from "./question-form";
import ExamForm from "./exam-form";

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "TEACHER" && user.role !== "ADMIN") redirect("/student");
  const [subjects, questionCount, examCount] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, name: true, slug: true } , orderBy: { name: "asc" } }),
    prisma.question.count({ where: { authorId: user.id } }),
    prisma.exam.count({ where: { authorId: user.id } }),
  ]);
  return <main style={{minHeight:"100vh",background:"#f5f8f5",padding:"26px max(18px, calc((100% - 1000px)/2))"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:28}}><Link href="/" className="brand"><span className="brandmark">E</span> EduBridge</Link><span style={{color:"#68786f"}}>Teacher workspace · {user.name}</span></header>
    <h1 style={{fontSize:30}}>Question and exam management</h1><p style={{color:"#68786f"}}>Create syllabus-aligned questions, then assemble them into published CBT exams.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,margin:"22px 0"}}>{[{label:"Questions authored",value:questionCount},{label:"Exams authored",value:examCount},{label:"Subjects",value:subjects.length}].map(x=><article key={x.label} style={card}><p style={{color:"#68786f",marginTop:0}}>{x.label}</p><strong style={{fontSize:28}}>{x.value}</strong></article>)}</div>
    <QuestionForm subjects={subjects}/>
    <div style={{ marginTop: 18 }}><ExamForm subjects={subjects}/></div>
    <section style={{...card,marginTop:18}}><h2>Next: assemble an exam</h2><p style={{color:"#68786f"}}>Questions created here are stored in PostgreSQL. Exam publishing uses the API at <code>/api/exams</code> and requires question IDs, a subject, duration and title.</p><Link href="/student" className="btn">View learner experience</Link></section>
  </main>;
}
const card={background:"#fff",border:"1px solid #e0e9e2",borderRadius:16,padding:20} as const;
