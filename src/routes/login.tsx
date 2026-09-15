import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({ component: LoginScreen });

function LoginScreen() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
      navigate({ to: "/", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  const handleLogin = async () => {
    const value = identifier.trim();
    if (!value || !password) return;
    setLoading(true); setError(""); setNotice("");

    const credentials = value.includes("@")
      ? { email: value.toLowerCase(), password }
      : { phone: value.replace(/\s+/g, ""), password };

    const { error: authError } = await supabase.auth.signInWithPassword(credentials);
    if (authError) {
      const message = authError.message.toLowerCase().includes("phone")
        ? "Mobile-number login is not enabled yet. Please use the email address you registered with."
        : authError.message;
      setError(message);
      setLoading(false);
      return;
    }

    localStorage.setItem("old-touch-logged-in", "true");
    navigate({ to: "/" });
  };

  const handleForgotPassword = async () => {
    const value = identifier.trim().toLowerCase();
    if (!value.includes("@")) {
      setError("Enter the email address linked to your Old Touch account.");
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
      <main className="flex flex-1 flex-col p-6 pt-12">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black tracking-tight">Old Touch</h1>
          <p className="mt-3 text-xl font-semibold text-muted-foreground">Stay connected. Stay safe.</p>
        </div>
        <div className="flex flex-col gap-5">
          <FormField label="Email address or mobile number" placeholder="Enter your email or mobile number" value={identifier} onChange={setIdentifier} />
          <FormField label="Password" type="password" placeholder="Enter your password" value={password} onChange={setPassword} />
          {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
          {notice && <p className="rounded-2xl bg-primary/10 p-4 text-base font-bold text-primary">{notice}</p>}
          <button type="button" onClick={handleLogin} disabled={loading || !identifier.trim() || !password} className="mt-3 w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Logging in…" : "Log In"}</button>
          <button type="button" onClick={() => void handleForgotPassword()} disabled={resetting} className="py-3 text-lg font-bold text-primary disabled:opacity-50">{resetting ? "Sending…" : "Forgot password?"}</button>
        </div>
        <div className="mt-auto pt-8 text-center">
          <p className="text-lg font-semibold text-muted-foreground">New to Old Touch?</p>
          <Link to="/signup" className="mt-2 block rounded-3xl border-2 border-primary px-6 py-4 text-xl font-extrabold text-primary">Create an Account</Link>
        </div>
      </main>
    </AppShell>
  );
}
