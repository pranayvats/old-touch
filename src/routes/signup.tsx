import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({ component: SignupScreen });

type Provider = "google" | "facebook" | "twitter";

const providers: Array<{ id: Provider; label: string }> = [
  { id: "google", label: "Google" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "X" },
];

function ProviderLogo({ provider }: { provider: Provider }) {
  if (provider === "google") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6"><path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.7 2.91-4.2 2.91-7.41Z"/><path fill="#34A853" d="M12 21.8c2.64 0 4.86-.87 6.47-2.36l-3.14-2.44c-.87.58-1.98.92-3.33.92-2.56 0-4.72-1.73-5.5-4.05H3.26v2.52A9.77 9.77 0 0 0 12 21.8Z"/><path fill="#FBBC05" d="M6.5 13.87a5.87 5.87 0 0 1 0-3.74V7.61H3.26a9.8 9.8 0 0 0 0 8.78l3.24-2.52Z"/><path fill="#EA4335" d="M12 6.08c1.44 0 2.74.5 3.76 1.49l2.82-2.82C16.85 3.17 14.64 2.2 12 2.2a9.77 9.77 0 0 0-8.74 5.41l3.24 2.52C7.28 7.81 9.44 6.08 12 6.08Z"/></svg>;
  }
  if (provider === "facebook") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6"><circle cx="12" cy="12" r="10" fill="#1877F2"/><path fill="#fff" d="M13.25 19v-6h2.02l.31-2.34h-2.33V9.17c0-.68.19-1.14 1.17-1.14h1.25V5.94c-.22-.03-.97-.09-1.84-.09-1.82 0-3.07 1.11-3.07 3.15v1.66H8.7V13h2.06v6h2.49Z"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current"><path d="M18.9 2h3.68l-8.04 9.19L24 22h-7.41l-5.8-7.59L4.15 22H.47l8.6-9.84L0 2h7.6l5.24 6.92L18.9 2Zm-1.3 17.69h2.04L6.48 4.19H4.29L17.6 19.69Z"/></svg>;
}

function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<Provider | "">("");

  const handleSocialSignup = async (provider: Provider) => {
    if (socialLoading) return;
    setSocialLoading(provider); setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/login` } });
    if (oauthError) { setError(oauthError.message); setSocialLoading(""); }
  };

  const handleEmailSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !password || loading) return;
    setLoading(true); setError("");
    const { data, error: signupError } = await supabase.auth.signUp({ email: cleanEmail, password, options: { data: { full_name: cleanName } } });
    if (signupError) { setError(signupError.message); setLoading(false); return; }
    if (data.session) window.location.href = "/";
    else setError("Check your email to confirm your account, then log in.");
    setLoading(false);
  };

  return <AppShell><main className="flex flex-1 flex-col p-6 pt-10">
    <div className="mb-8 text-center"><h1 className="text-4xl font-black">Join Old Touch</h1><p className="mt-2 text-lg font-semibold text-muted-foreground">Use an account you already have.</p></div>
    <div className="mb-2 flex items-center justify-center gap-4" aria-label="Sign up with a social account">
      {providers.map((item) => <button key={item.id} type="button" aria-label={`Sign up with ${item.label}`} title={`Sign up with ${item.label}`} onClick={() => void handleSocialSignup(item.id)} disabled={Boolean(socialLoading)} className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55">{socialLoading === item.id ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Loading"/> : <ProviderLogo provider={item.id}/>}</button>)}
    </div>
    <div className="my-7 flex items-center gap-3 text-muted-foreground"><div className="h-px flex-1 bg-border"/><span className="text-base font-bold">OR EMAIL</span><div className="h-px flex-1 bg-border"/></div>
    <div className="flex flex-col gap-4">
      <FormField label="Your name" placeholder="e.g. Rajesh Sharma" value={name} onChange={setName} />
      <FormField label="Email address" placeholder="you@example.com" type="email" value={email} onChange={setEmail} />
      <FormField label="Password" placeholder="Create a password" type="password" value={password} onChange={setPassword} />
      {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
      <button type="button" onClick={() => void handleEmailSignup()} disabled={loading || !name.trim() || !email.trim() || !password} className="w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Creating…" : "Create with Email"}</button>
    </div>
    <div className="mt-auto pt-8 text-center"><p className="text-lg font-semibold text-muted-foreground">Already have an account?</p><Link to="/login" className="mt-2 block rounded-3xl border-2 border-primary px-6 py-4 text-xl font-extrabold text-primary">Log In</Link></div>
  </main></AppShell>;
}
