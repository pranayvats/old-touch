import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { normalizeIndianPhone } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/phone-otp")({
  validateSearch: (search: Record<string, unknown>) => ({
    phone: typeof search.phone === "string" ? search.phone : "",
    mode: search.mode === "signup" ? "signup" : "login",
    name: typeof search.name === "string" ? search.name : "",
    email: typeof search.email === "string" ? search.email : "",
  }),
  component: PhoneOtpScreen,
});

function PhoneOtpScreen() {
  const navigate = useNavigate();
  const { phone, mode, name, email } = Route.useSearch();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const normalizedPhone = normalizeIndianPhone(phone);

  const verify = async () => {
    if (!normalizedPhone || !/^\d{6}$/.test(otp) || loading) return;
    setLoading(true); setError(""); setNotice("");

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: otp,
      type: "sms",
    });

    if (verifyError || !data.session || !data.user) {
      setError(verifyError?.message || "That code could not be verified. Please try again.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const cleanName = name.trim() || "Old Touch member";
      const cleanEmail = email.trim().toLowerCase();
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: cleanName,
        phone: normalizedPhone,
      });
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (cleanEmail && !data.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: cleanEmail });
        if (emailError) {
          setNotice("Account created. You can add your email later in settings.");
        }
      }

      localStorage.setItem("old-touch-logged-in", "true");
      navigate({ to: "/setup", replace: true });
      return;
    }

    localStorage.setItem("old-touch-logged-in", "true");
    navigate({ to: "/", replace: true });
  };

  const resend = async () => {
    if (!normalizedPhone || resending) return;
    setResending(true); setError(""); setNotice("");
    const { error: resendError } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: { shouldCreateUser: mode === "signup" },
    });
    if (resendError) setError(resendError.message);
    else setNotice("A new OTP has been sent. Please wait a moment before requesting another one.");
    setResending(false);
  };

  if (!normalizedPhone) {
    return <AppShell><main className="flex flex-1 flex-col p-6 pt-12"><h1 className="text-4xl font-black">Invalid mobile number</h1><p className="mt-3 text-lg font-semibold text-muted-foreground">Please use a valid Indian mobile number.</p><button type="button" onClick={() => navigate({ to: mode === "signup" ? "/signup" : "/login" })} className="mt-8 rounded-3xl bg-primary px-6 py-5 text-xl font-extrabold text-primary-foreground">Go Back</button></main></AppShell>;
  }

  return <AppShell><main className="flex flex-1 flex-col p-6 pt-12">
    <div className="mb-10">
      <h1 className="text-4xl font-black">Enter your OTP</h1>
      <p className="mt-3 text-lg font-semibold text-muted-foreground">We sent a 6-digit code to {normalizedPhone}.</p>
    </div>
    <div className="flex flex-col gap-5">
      <FormField label="6-digit OTP" placeholder="123456" type="tel" value={otp} onChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))} />
      {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
      {notice && <p className="rounded-2xl bg-primary/10 p-4 text-base font-bold text-primary">{notice}</p>}
      <button type="button" onClick={() => void verify()} disabled={loading || otp.length !== 6} className="w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Verifying…" : "Verify OTP"}</button>
      <button type="button" onClick={() => void resend()} disabled={resending} className="py-3 text-lg font-bold text-primary disabled:opacity-50">{resending ? "Sending…" : "Resend OTP"}</button>
      <button type="button" onClick={() => navigate({ to: mode === "signup" ? "/signup" : "/login" })} className="py-3 text-lg font-bold text-muted-foreground">Use a different number</button>
    </div>
  </main></AppShell>;
}
