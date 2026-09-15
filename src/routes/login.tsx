import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({ component: LoginScreen });

const providers = [
  { id: "google" as const, label: "Continue with Google" },
  { id: "facebook" as const, label: "Continue with Facebook" },
  { id: "apple" as const, label: "Continue with Apple" },
  { id: "twitter" as const, label: "Continue with X" },
];

function LoginScreen() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
      navigate({ to: "/", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  const handleSocialLogin = async (provider: "google" | "facebook" | "apple" | "twitter") => {
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

  const handleLogin = async () => {
    const value = identifier.trim().toLowerCase();
    if (!value || loading) return;
    if (!value.includes("@")) {
      setError("Please use one of the sign-in options above, or enter an email address.");
      return;
    }
    if (!password) { setError("Enter your password."); return; }
    setLoading(true); setError(""); setNotice("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email: value, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    localStorage.setItem("old-touch-logged-in", "true");
    navigate({ to: "/" });
  };

  const handleForgotPassword = async () => {
    const value = identifier.trim().toLowerCase();
    if (!value.includes("@")) {
      setError("Enter the email address linked to your Old Touch account to reset its password.");
      return;
    }
    setResetting(true); setError(""); setNotice("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(value, {
      redirectTo: "https://old-touch.vercel.app/reset-password",
    });
    if (resetError) setError(resetError.message);
    else setNotice("Password reset email sent. Open it to choose a new password.");
    setResetting(false);
  };

  return (
    <AppShell>
      <main className="flex flex-1 flex-col p-6 pt-10">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black tracking-tight">Welcome to Old Touch</h1>
          <p className="mt-3 text-xl font-semibold text-muted-foreground">Stay connected. Stay safe.</p>
        </div>

        <div className="flex flex-col gap-3">
          {providers.map((item) => (
            <button key={item.id} type="button" onClick={() => void handleSocialLogin(item.id)} disabled={Boolean(socialLoading)} className="w-full rounded-3xl border-2 border-border bg-card px-6 py-5 text-xl font-extrabold text-foreground shadow-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60">
              {socialLoading === item.id ? "Opening…" : item.label}
            </button>
          ))}
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
