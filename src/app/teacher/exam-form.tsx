"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";

type Subject={id:string;name:string;slug:string};
type Question={id:string;prompt:string;examType:string;subject:{name:string;slug:string}};
export default function ExamForm({subjects}:{subjects:Subject[]}){
 const [questions,setQuestions]=useState<Question[]>([]);
 const [subjectId,setSubjectId]=useState(subjects[0]?.id??"");
 const [examType,setExamType]=useState("JAMB");
 const [title,setTitle]=useState("");
 const [durationMin,setDurationMin]=useState(30);
 const [selected,setSelected]=useState<string[]>([]);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{void loadQuestions();},[]);
 async function loadQuestions(){
  try{const response=await fetch("/api/questions");const data=await response.json();if(response.ok)setQuestions(data.questions??[]);}
  catch{setMessage("Could not load question bank. Check your connection.");}
 }
 const selectedSubject=subjects.find(s=>s.id===subjectId);
 const available=useMemo(()=>questions.filter(q=>q.subject.slug===selectedSubject?.slug&&q.examType===examType),[questions,selectedSubject,examType]);
 function changeType(value:string){setExamType(value);setSelected([]);}
 function toggle(id:string){setSelected(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);}
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/exams",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,subjectId,examType,durationMin,questionIds:selected})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to publish exam.");
   setMessage(`Published “${data.exam.title}” with ${selected.length} questions.`);setTitle("");setSelected([]);
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to publish exam.");}
  finally{setBusy(false);}
 }
 return <section style={card}><h2 style={{marginTop:0}}>Build and publish a CBT exam</h2><p style={{color:"#68786f"}}>Only questions that match the chosen subject and exam type can be included.</p>{subjects.length===0?<p>No subjects found.</p>:<form onSubmit={submit} style={{display:"grid",gap:12}}>
 <label style={label}>Exam title<input required minLength={3} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} style={field}/></label>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}>
 <label style={label}>Subject<select value={subjectId} onChange={e=>{setSubjectId(e.target.value);setSelected([]);}} style={field}>{subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
 <label style={label}>Exam type<select value={examType} onChange={e=>changeType(e.target.value)} style={field}><option>JAMB</option><option>WAEC</option></select></label>
 <label style={label}>Duration (minutes)<input type="number" min={5} max={300} value={durationMin} onChange={e=>setDurationMin(Number(e.target.value))} style={field}/></label>
 </div>
 <div><strong>Choose questions ({selected.length} selected)</strong>{available.length===0?<p style={{color:"#68786f"}}>No matching questions yet. Add questions above first.</p>:<div style={{display:"grid",gap:8,marginTop:10}}>{available.map((q,i)=><label key={q.id} style={{display:"flex",gap:10,alignItems:"start",border:"1px solid #e0e9e2",padding:11,borderRadius:10}}><input type="checkbox" checked={selected.includes(q.id)} onChange={()=>toggle(q.id)} style={{marginTop:4}}/><span><strong style={{fontSize:12,color:"#167a55"}}>Q{i+1}</strong><br/>{q.prompt}</span></label>)}</div>}</div>
 <button className="btn primary" disabled={busy||selected.length===0||!subjectId}>{busy?"Publishing…":"Publish CBT exam"}</button>
 {message&&<p role="status" style={{color:message.startsWith("Published")?"#167a55":"#a12c2c"}}>{message}</p>}
 </form>}</section>;
}
const card={background:"#fff",border:"1px solid #e0e9e2",borderRadius:16,padding:20} as const;
const label={display:"grid",gap:6,fontSize:14} as const;
const field={width:"100%",padding:11,border:"1px solid #d7e1d9",borderRadius:9,font:"inherit",background:"#fff"} as const;
