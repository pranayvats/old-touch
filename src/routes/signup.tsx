import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({ component: SignupScreen });

const providers = [
  { id: "google" as const, label: "Sign up with Google" },
  { id: "facebook" as const, label: "Sign up with Facebook" },
  { id: "apple" as const, label: "Sign up with Apple" },
  { id: "twitter" as const, label: "Sign up with X" },
];

function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");

  const handleSocialSignup = async (provider: "google" | "facebook" | "apple" | "twitter") => {
    if (socialLoading) return;
    setSocialLoading(provider); setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(oauthError.message);
      setSocialLoading("");
    }
  };

  const handleEmailSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !password || loading) return;
    setLoading(true); setError("");
    const { data, error: signupError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: cleanName } },
    });
    if (signupError) { setError(signupError.message); setLoading(false); return; }
    if (data.session) window.location.href = "/";
    else setError("Check your email to confirm your account, then log in.");
    setLoading(false);
  };

  return <AppShell><main className="flex flex-1 flex-col p-6 pt-10">
    <div className="mb-8 text-center"><h1 className="text-4xl font-black">Join Old Touch</h1><p className="mt-2 text-lg font-semibold text-muted-foreground">Choose an account you already use.</p></div>
    <div className="flex flex-col gap-3">
      {providers.map((item) => <button key={item.id} type="button" onClick={() => void handleSocialSignup(item.id)} disabled={Boolean(socialLoading)} className="w-full rounded-3xl border-2 border-border bg-card px-6 py-5 text-xl font-extrabold text-foreground shadow-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60">{socialLoading === item.id ? "Opening…" : item.label}</button>)}
    </div>
    <div className="my-7 flex items-center gap-3 text-muted-foreground"><div className="h-px flex-1 bg-border" /><span className="text-base font-bold">OR EMAIL</span><div className="h-px flex-1 bg-border" /></div>
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
