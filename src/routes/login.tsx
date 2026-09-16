import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({ component: LoginScreen });

type Provider = "google";

const providers: Array<{ id: Provider; label: string }> = [
  { id: "google", label: "Google" },
];

function ProviderLogo({ provider }: { provider: Provider }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
        <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.7 2.91-4.2 2.91-7.41Z" />
        <path fill="#34A853" d="M12 21.8c2.64 0 4.86-.87 6.47-2.36l-3.14-2.44c-.87.58-1.98.92-3.33.92-2.56 0-4.72-1.73-5.5-4.05H3.26v2.52A9.77 9.77 0 0 0 12 21.8Z" />
        <path fill="#FBBC05" d="M6.5 13.87a5.87 5.87 0 0 1 0-3.74V7.61H3.26a9.8 9.8 0 0 0 0 8.78l3.24-2.52Z" />
        <path fill="#EA4335" d="M12 6.08c1.44 0 2.74.5 3.76 1.49l2.82-2.82C16.85 3.17 14.64 2.2 12 2.2a9.77 9.77 0 0 0-8.74 5.41l3.24 2.52C7.28 7.81 9.44 6.08 12 6.08Z" />
      </svg>
    );
  }
}

function LoginScreen() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<Provider | "">("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
      navigate({ to: "/", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  const handleSocialLogin = async (provider: Provider) => {
    if (socialLoading) return;
    setSocialLoading(provider); setError(""); setNotice("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setSocialLoading("");
    }
  };

  const handleLogin = async () => {
    const value = identifier.trim().toLowerCase();
    if (!value || loading) return;
    if (!value.includes("@")) { setError("Please use Google sign-in above, or enter an email address."); return; }
    if (!password) { setError("Enter your password."); return; }
    setLoading(true); setError(""); setNotice("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email: value, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    localStorage.setItem("old-touch-logged-in", "true");
    navigate({ to: "/" });
  };

  const handleForgotPassword = async () => {
    const value = identifier.trim().toLowerCase();
    if (!value.includes("@")) { setError("Enter the email address linked to your Old Touch account to reset its password."); return; }
    setResetting(true); setError(""); setNotice("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(value, { redirectTo: "https://old-touch.vercel.app/reset-password" });
    if (resetError) setError(resetError.message);
    else setNotice("Password reset email sent. Open it to choose a new password.");
    setResetting(false);
  };

  return (
    <AppShell>
      <main className="flex flex-1 flex-col p-6 pt-10">
        <div className="mb-8 text-center"><h1 className="text-5xl font-black tracking-tight">Welcome to Old Touch</h1><p className="mt-3 text-xl font-semibold text-muted-foreground">Stay connected. Stay safe.</p></div>
        <div className="mb-2 flex items-center justify-center gap-4" aria-label="Sign in with Google">
          {providers.map((item) => <button key={item.id} type="button" aria-label={`Continue with ${item.label}`} title={`Continue with ${item.label}`} onClick={() => void handleSocialLogin(item.id)} disabled={Boolean(socialLoading)} className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55">{socialLoading === item.id ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Loading" /> : <ProviderLogo provider={item.id} />}</button>)}
        </div>
        <div className="my-7 flex items-center gap-3 text-muted-foreground"><div className="h-px flex-1 bg-border" /><span className="text-base font-bold">OR EMAIL</span><div className="h-px flex-1 bg-border" /></div>
        <div className="flex flex-col gap-4">
          <FormField label="Email address" placeholder="you@example.com" type="email" value={identifier} onChange={setIdentifier} />
          <FormField label="Password" type="password" placeholder="Enter your password" value={password} onChange={setPassword} />
          {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
          {notice && <p className="rounded-2xl bg-primary/10 p-4 text-base font-bold text-primary">{notice}</p>}
          <button type="button" onClick={() => void handleLogin()} disabled={loading || !identifier.trim() || !password} className="w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Logging in…" : "Log In with Email"}</button>
          <button type="button" onClick={() => void handleForgotPassword()} disabled={resetting} className="py-2 text-lg font-bold text-primary disabled:opacity-50">{resetting ? "Sending…" : "Forgot password?"}</button>
        </div>
        <div className="mt-auto pt-8 text-center"><p className="text-lg font-semibold text-muted-foreground">New to Old Touch?</p><Link to="/signup" className="mt-2 block rounded-3xl border-2 border-primary px-6 py-4 text-xl font-extrabold text-primary">Create an Account</Link></div>
      </main>
    </AppShell>
  );
}
