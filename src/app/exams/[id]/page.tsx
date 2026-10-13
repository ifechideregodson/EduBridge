"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Question = { id: string; prompt: string; options: string[] };
type AttemptData = { id: string; expiresAt: string; status?: string };
export default function ExamPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [exam, setExam] = useState<{ title: string; durationMin: number } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ score: number; total: number; percentage: number } | null>(null);

  const start = useCallback(async () => {
    try {
      const response = await fetch(`/api/exams/${params.id}/start`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start exam.");
      setAttempt(data.attempt);
      setExam(data.exam);
      setQuestions(data.questions);
      const remaining = Math.max(0, Math.floor((new Date(data.attempt.expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(remaining);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start exam.");
    } finally { setBusy(false); }
  }, [params.id]);

  useEffect(() => { void start(); }, [start]);
  const submit = useCallback(async () => {
    if (!attempt || result) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/attempts/${attempt.id}/submit`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit exam.");
      setResult(data.result);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to submit exam."); }
    finally { setBusy(false); }
  }, [attempt, result]);

  useEffect(() => {
    if (!attempt || result) return;
    const timer = window.setInterval(() => setSeconds((current) => {
      if (current <= 1) { window.clearInterval(timer); void submit(); return 0; }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [attempt, result, submit]);

  async function choose(question: Question, optionIndex: number) {
    setAnswers((old) => ({ ...old, [question.id]: optionIndex }));
    setError("");
    if (!attempt) return;
    const response = await fetch(`/api/attempts/${attempt.id}/answers`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, selectedIndex: optionIndex }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Could not save answer. Check your connection.");
    }
  }

  if (busy && !attempt && !result) return <main style={pageStyle}>Loading exam…</main>;
  if (error && !attempt && !result) return <main style={pageStyle}><p role="alert">{error}</p><Link href="/student" className="btn">Back to dashboard</Link></main>;
  if (result) return <main style={pageStyle}><section style={panelStyle}><p style={{color:"#167a55",fontWeight:800}}>EXAM SUBMITTED</p><h1 style={{fontSize:32}}>Your result</h1><strong style={{fontSize:52}}>{result.percentage}%</strong><p>{result.score} correct out of {result.total} questions.</p><Link href="/student" className="btn primary">Return to dashboard</Link></section></main>;
  const question = questions[index];
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return <main style={pageStyle}>
    <header style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:22}}><Link href="/student" className="brand"><span className="brandmark">E</span> EduBridge</Link><strong>{exam?.title}</strong><span style={{color:seconds < 60 ? "#b42318" : "#167a55",fontWeight:800}}>Time left: {minutes}:{secs}</span></header>
    {error && <p role="alert" style={{color:"#a12c2c"}}>{error}</p>}
    {question && <section style={panelStyle}><p style={{color:"#167a55",fontWeight:700}}>QUESTION {index+1} OF {questions.length}</p><h1 style={{fontSize:23,lineHeight:1.5}}>{question.prompt}</h1><div style={{display:"grid",gap:10,margin:"24px 0"}}>{question.options.map((option,i)=><button key={i} onClick={()=>void choose(question,i)} style={{textAlign:"left",padding:15,borderRadius:12,border:answers[question.id]===i?"2px solid #167a55":"1px solid #dce5de",background:answers[question.id]===i?"#edf7f0":"#fff",fontSize:16,cursor:"pointer"}}><strong style={{marginRight:12}}>{String.fromCharCode(65+i)}.</strong>{option}</button>)}</div><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><button className="btn" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Previous</button><button className="btn" disabled={index===questions.length-1} onClick={()=>setIndex(i=>i+1)}>Next</button><button className="btn primary" disabled={busy} onClick={()=>{if(confirm("Submit your exam now?")) void submit();}}>{busy?"Submitting…":"Submit exam"}</button></div></section>}
    <p style={{color:"#68786f",fontSize:13}}>Answers are saved to the server when you select an option. Keep your internet connection active during the exam.</p>
  </main>;
}
const pageStyle = { minHeight:"100vh", background:"#f5f8f5", padding:"24px max(18px, calc((100% - 850px)/2))" } as const;
const panelStyle = { background:"#fff", border:"1px solid #e0e9e2", borderRadius:20, padding:24, boxShadow:"0 8px 30px #173f2c08" } as const;
