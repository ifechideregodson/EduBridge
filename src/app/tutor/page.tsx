"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function TutorPage() {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("General");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setAnswer("");
    try {
      const response = await fetch("/api/tutor", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message, subject }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tutor request failed.");
      setAnswer(data.answer); setMessage("");
    } catch (e) { setError(e instanceof Error ? e.message : "Tutor request failed."); }
    finally { setBusy(false); }
  }
  return <main style={{minHeight:"100vh",background:"#f5f8f5",padding:"25px max(18px, calc((100% - 850px)/2))"}}>
    <Link href="/student" className="brand"><span className="brandmark">E</span> EduBridge</Link>
    <section style={{background:"#fff",border:"1px solid #e0e9e2",borderRadius:20,padding:24,marginTop:24}}>
      <p style={{color:"#167a55",fontWeight:800,fontSize:12}}>PERSONAL LEARNING ASSISTANT</p><h1 style={{fontSize:30,margin:"0 0 8px"}}>Ask your AI tutor</h1><p style={{color:"#68786f"}}>Ask for explanations, worked examples, or revision help for JAMB and WAEC.</p>
      <form onSubmit={submit} style={{display:"grid",gap:12,marginTop:20}}>
        <label style={{display:"grid",gap:6}}>Subject<select value={subject} onChange={e=>setSubject(e.target.value)} style={fieldStyle}>{["General","Mathematics","English Language","Biology","Chemistry","Physics","Government","Economics"].map(s=><option key={s}>{s}</option>)}</select></label>
        <label style={{display:"grid",gap:6}}>Your question<textarea required minLength={2} maxLength={4000} value={message} onChange={e=>setMessage(e.target.value)} rows={5} placeholder="Explain quadratic equations with a JAMB-style example…" style={fieldStyle}/></label>
        <button className="btn primary" disabled={busy}>{busy?"Thinking…":"Ask tutor"}</button>
      </form>
      {error&&<p role="alert" style={{marginTop:16,color:"#a12c2c",background:"#fff0f0",padding:12,borderRadius:10}}>{error}</p>}
      {answer&&<article style={{marginTop:20,background:"#edf7f0",padding:18,borderRadius:14,whiteSpace:"pre-wrap",lineHeight:1.7}}><strong>EduBridge Tutor</strong><p>{answer}</p></article>}
      <p style={{fontSize:12,color:"#68786f",marginTop:18}}>AI explanations can be wrong. Check important exam facts against your syllabus and trusted learning materials.</p>
    </section>
  </main>;
}
const fieldStyle={width:"100%",padding:12,border:"1px solid #d7e1d9",borderRadius:10,font:"inherit",background:"#fff"} as const;
