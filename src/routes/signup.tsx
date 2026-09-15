import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { normalizeIndianPhone } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({ component: SignupScreen });

function SignupScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const phone = normalizeIndianPhone(mobile);
    if (!cleanName || !phone || loading) return;

    setLoading(true); setError("");
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
        data: { full_name: cleanName, email: cleanEmail || null },
      },
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    navigate({ to: "/phone-otp", search: { phone, mode: "signup", name: cleanName, email: cleanEmail } });
  };

  return <AppShell><main className="flex flex-1 flex-col p-6 pt-10">
    <div className="mb-8"><h1 className="text-4xl font-black">Create your account</h1><p className="mt-2 text-lg font-semibold text-muted-foreground">We'll verify your Indian mobile number with a one-time code.</p></div>
    <div className="flex flex-col gap-5">
      <FormField label="Your name" placeholder="e.g. Rajesh Sharma" value={name} onChange={setName} />
      <FormField label="Mobile number" placeholder="98765 43210" type="tel" value={mobile} onChange={setMobile} />
      <p className="text-base font-semibold text-muted-foreground">India (+91) is added automatically.</p>
      <FormField label="Email address" placeholder="e.g. rajesh@example.com" type="email" value={email} onChange={setEmail} />
      {mobile.trim() && !normalizeIndianPhone(mobile) && <p className="text-base font-bold text-destructive">Enter a valid 10-digit Indian mobile number.</p>}
      {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
      <button type="button" onClick={() => void handleSignup()} disabled={loading || !name.trim() || !normalizeIndianPhone(mobile)} className="mt-2 w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Sending OTP…" : "Send OTP"}</button>
    </div>
    <div className="mt-auto pt-8 text-center"><p className="text-lg font-semibold text-muted-foreground">Already have an account?</p><Link to="/login" className="mt-2 block rounded-3xl border-2 border-primary px-6 py-4 text-xl font-extrabold text-primary">Log In</Link></div>
  </main></AppShell>;
}
