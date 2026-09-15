import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({ component: SignupScreen });

function SignupScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim().replace(/\s+/g, "");
    if (!cleanName || !cleanEmail || !password || password !== confirmPassword) return;
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    setLoading(true); setError(""); setNotice("");

    const { data, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: cleanName, phone: cleanMobile || null },
        emailRedirectTo: "https://old-touch.vercel.app/",
      },
    });

    if (authError) { setError(authError.message); setLoading(false); return; }

    if (data.user && data.session) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: cleanName,
        phone: cleanMobile || null,
      });
      if (profileError) { setError(profileError.message); setLoading(false); return; }
      localStorage.setItem("old-touch-logged-in", "true");
      navigate({ to: "/setup" });
      return;
    }

    setNotice("Account created. Check your email and tap the verification link before logging in.");
    setLoading(false);
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  return <AppShell><main className="flex flex-1 flex-col p-6 pt-10">
    <div className="mb-8"><h1 className="text-4xl font-black">Create your account</h1><p className="mt-2 text-lg font-semibold text-muted-foreground">Let's get Old Touch ready for you.</p></div>
    <div className="flex flex-col gap-5">
      <FormField label="Your name" placeholder="e.g. Rajesh Sharma" value={name} onChange={setName} />
      <FormField label="Email address" placeholder="e.g. rajesh@example.com" type="email" value={email} onChange={setEmail} />
      <FormField label="Mobile number (optional)" placeholder="e.g. 98765 43210" type="tel" value={mobile} onChange={setMobile} />
      <FormField label="Password" placeholder="Create a password" type="password" value={password} onChange={setPassword} />
      <FormField label="Confirm password" placeholder="Enter your password again" type="password" value={confirmPassword} onChange={setConfirmPassword} />
      {password.length > 0 && password.length < 8 && <p className="text-base font-bold text-destructive">Password must be at least 8 characters.</p>}
      {!passwordsMatch && <p className="text-base font-bold text-destructive">Passwords do not match.</p>}
      {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
      {notice && <p className="rounded-2xl bg-primary/10 p-4 text-base font-bold text-primary">{notice}</p>}
      <button type="button" onClick={() => void handleSignup()} disabled={loading || !name.trim() || !email.trim() || password.length < 8 || password !== confirmPassword} className="mt-2 w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Creating…" : "Create Account"}</button>
    </div>
    <div className="mt-auto pt-8 text-center"><p className="text-lg font-semibold text-muted-foreground">Already have an account?</p><Link to="/login" className="mt-2 block rounded-3xl border-2 border-primary px-6 py-4 text-xl font-extrabold text-primary">Log In</Link></div>
  </main></AppShell>;
}
