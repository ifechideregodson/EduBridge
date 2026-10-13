"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to continue.");
      router.push("/student");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return <main style={{ minHeight: "100vh", background: "#f5f8f5", display: "grid", placeItems: "center", padding: 20 }}>
    <section style={{ width: "100%", maxWidth: 440, background: "#fff", padding: 28, borderRadius: 22, boxShadow: "0 12px 45px #153d2110" }}>
      <Link href="/" className="brand"><span className="brandmark">E</span> EduBridge</Link>
      <h1 style={{ fontSize: 30, margin: "28px 0 8px", color: "#173b2b" }}>{mode === "login" ? "Welcome back" : "Create your learner account"}</h1>
      <p style={{ color: "#68786f", marginBottom: 22 }}>Prepare for JAMB and WAEC with practice and progress tracking.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        {mode === "register" && <label style={{ display: "grid", gap: 6, fontSize: 14 }}>Full name<input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} /></label>}
        <label style={{ display: "grid", gap: 6, fontSize: 14 }}>Email address<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={fieldStyle} /></label>
        <label style={{ display: "grid", gap: 6, fontSize: 14 }}>Password<input required type="password" minLength={mode === "register" ? 10 : 1} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} style={fieldStyle} /></label>
        {error && <p role="alert" style={{ color: "#a12c2c", background: "#fff0f0", padding: 10, borderRadius: 9, margin: 0 }}>{error}</p>}
        <button className="btn primary" disabled={busy} style={{ justifyContent: "center", padding: 13, marginTop: 4 }}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <p style={{ marginTop: 20, fontSize: 14, color: "#68786f" }}>{mode === "login" ? "New to EduBridge?" : "Already have an account?"}{" "}
        <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} style={{ border: 0, background: "none", color: "#167a55", fontWeight: 700, cursor: "pointer" }}>{mode === "login" ? "Create an account" : "Sign in"}</button>
      </p>
    </section>
  </main>;
}

const fieldStyle = { width: "100%", border: "1px solid #d7e1d9", borderRadius: 10, padding: "12px 13px", font: "inherit", outlineColor: "#167a55" };
