"use client";

import { useState } from "react";
type Role="STUDENT"|"TEACHER"|"ADMIN";
export default function UserRoleControl({userId,currentRole,disabled=false}:{userId:string;currentRole:Role;disabled?:boolean}){
  const [role,setRole]=useState<Role>(currentRole);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function save(){
    setBusy(true);setMessage("");
    try{
      const response=await fetch(`/api/admin/users/${userId}/role`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({role})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Role update failed.");
      setMessage("Saved");
    }catch(e){setMessage(e instanceof Error?e.message:"Role update failed.");setRole(currentRole);}
    finally{setBusy(false);}
  }
  return <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}><select aria-label="User role" disabled={disabled||busy} value={role} onChange={e=>setRole(e.target.value as Role)} style={{padding:8,border:"1px solid #d7e1d9",borderRadius:8,background:"#fff"}}>{(["STUDENT","TEACHER","ADMIN"] as Role[]).map(r=><option key={r}>{r}</option>)}</select><button className="btn" disabled={disabled||busy||role===currentRole} onClick={()=>void save()}>{busy?"Saving…":"Save role"}</button>{message&&<small role="status">{message}</small>}</div>;
}
