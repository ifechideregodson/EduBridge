import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserRoleControl from "./user-role-control";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/student");
  const [users,subjects,questions,exams,attempts] = await Promise.all([
    prisma.user.findMany({select:{id:true,name:true,email:true,role:true,createdAt:true},orderBy:{createdAt:"desc"},take:100}),
    prisma.subject.count(),prisma.question.count(),prisma.exam.count(),prisma.attempt.count(),
  ]);
  return <main style={{minHeight:"100vh",background:"#f5f8f5",padding:"26px max(18px, calc((100% - 1050px)/2))"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><Link href="/" className="brand"><span className="brandmark">E</span> EduBridge</Link><strong>Administrator · {user.name}</strong></header>
    <h1 style={{fontSize:30,marginTop:30}}>Platform administration</h1><p style={{color:"#68786f"}}>Review platform data and manage staff roles. Role changes are restricted to administrators.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,margin:"22px 0"}}>{[{label:"Users",value:users.length},{label:"Subjects",value:subjects},{label:"Questions",value:questions},{label:"Exams",value:exams},{label:"Attempts",value:attempts}].map(x=><article key={x.label} style={card}><p style={{color:"#68786f",marginTop:0}}>{x.label}</p><strong style={{fontSize:28}}>{x.value}</strong></article>)}</div>
    <section style={card}><h2 style={{marginTop:0}}>User accounts and roles</h2><div style={{display:"grid",gap:12}}>{users.map(u=><article key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",padding:"12px 0",borderBottom:"1px solid #edf1ed"}}><div><strong>{u.name}</strong><p style={{margin:"4px 0",fontSize:13,color:"#68786f"}}>{u.email} · Joined {u.createdAt.toLocaleDateString("en-NG")}</p></div><UserRoleControl userId={u.id} currentRole={u.role} disabled={u.id===user.id}/></article>)}</div></section>
    <p style={{marginTop:20}}><Link href="/teacher" className="btn">Open teacher workspace</Link></p>
  </main>;
}
const card={background:"#fff",border:"1px solid #e0e9e2",borderRadius:16,padding:18} as const;
