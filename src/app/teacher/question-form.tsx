"use client";

import { FormEvent, useState } from "react";

type Subject = { id: string; name: string };
export default function QuestionForm({ subjects }: { subjects: Subject[] }) {
  const [subjectId,setSubjectId]=useState(subjects[0]?.id ?? "");
  const [examType,setExamType]=useState("JAMB");
  const [prompt,setPrompt]=useState("");
  const [options,setOptions]=useState(["","","",""]);
  const [correctIndex,setCorrectIndex]=useState("0");
  const [explanation,setExplanation]=useState("");
  const [difficulty,setDifficulty]=useState("MEDIUM");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/questions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subjectId,examType,prompt,options,correctIndex:Number(correctIndex),explanation,difficulty})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Unable to save question.");
      setMessage("Question saved to the database.");setPrompt("");setOptions(["","","",""]);setExplanation("");
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to save question.");}
    finally{setBusy(false);}
  }
  return <section style={card}><h2 style={{marginTop:0}}>Add a question</h2>{subjects.length===0?<p>Create subjects in the database first.</p>:<form onSubmit={submit} style={{display:"grid",gap:12}}>
    <label style={label}>Subject<select value={subjectId} onChange={e=>setSubjectId(e.target.value)} style={field}>{subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
    <label style={label}>Exam type<select value={examType} onChange={e=>setExamType(e.target.value)} style={field}><option>JAMB</option><option>WAEC</option></select></label>
    <label style={label}>Question<textarea required minLength={5} maxLength={4000} value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} style={field}/></label>
    <div style={{display:"grid",gap:9}}><strong>Answer options</strong>{options.map((option,i)=><label key={i} style={label}><span>Option {String.fromCharCode(65+i)}</span><input required maxLength={1000} value={option} onChange={e=>setOptions(old=>old.map((v,j)=>i===j?e.target.value:v))} style={field}/></label>)}</div>
    <label style={label}>Correct answer<select value={correctIndex} onChange={e=>setCorrectIndex(e.target.value)} style={field}>{options.map((_,i)=><option key={i} value={i}>Option {String.fromCharCode(65+i)}</option>)}</select></label>
    <label style={label}>Explanation<textarea required minLength={1} maxLength={4000} value={explanation} onChange={e=>setExplanation(e.target.value)} rows={3} style={field}/></label>
    <label style={label}>Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)} style={field}><option>MEDIUM</option><option>EASY</option><option>HARD</option></select></label>
    <button className="btn primary" disabled={busy||!subjectId}>{busy?"Saving…":"Save question"}</button>
    {message&&<p role="status" style={{color:message.includes("saved")?"#167a55":"#a12c2c"}}>{message}</p>}
  </form>}</section>;
}
const card={background:"#fff",border:"1px solid #e0e9e2",borderRadius:16,padding:20} as const;
const label={display:"grid",gap:6,fontSize:14} as const;
const field={width:"100%",padding:11,border:"1px solid #d7e1d9",borderRadius:9,font:"inherit",background:"#fff"} as const;
