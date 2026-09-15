import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordScreen });

function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) setError("This password-reset link is missing or has expired. Please request a new one.");
      setChecking(false);
    });
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (newPassword.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true); setError(""); setSuccess("");
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    setSuccess("Your password has been changed. You can now log in with the new password.");
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/login", replace: true }), 1200);
  };

  return (
    <AppShell>
      <main className="flex flex-1 flex-col p-6 pt-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black">Choose a new password</h1>
          <p className="mt-2 text-lg font-semibold text-muted-foreground">Make it something you can remember but others cannot guess.</p>
        </div>
        {checking ? (
          <p className="text-xl font-bold">Checking your reset link…</p>
        ) : (
          <div className="flex flex-col gap-5">
            <FormField label="New password" type="password" placeholder="At least 8 characters" value={newPassword} onChange={setNewPassword} />
            <FormField label="Confirm new password" type="password" placeholder="Enter it again" value={confirmPassword} onChange={setConfirmPassword} />
            {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
            {success && <p className="rounded-2xl bg-primary/10 p-4 text-base font-bold text-primary">{success}</p>}
            {!success && !error.includes("expired") && <button type="button" onClick={() => void handleSave()} disabled={saving || !newPassword || !confirmPassword} className="mt-3 w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Change Password"}</button>}
            {error.includes("expired") && <button type="button" onClick={() => navigate({ to: "/login" })} className="mt-3 w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground">Back to Log In</button>}
          </div>
        )}
      </main>
    </AppShell>
  );
}
