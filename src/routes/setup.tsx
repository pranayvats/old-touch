import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/setup")({ component: SetupScreen });

function SetupScreen() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finish = async () => {
    if (!city.trim()) return;
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate({ to: "/login" }); return; }
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, full_name: user.user_metadata?.full_name ?? "Old Touch member", phone: user.phone ?? null, city: city.trim() });
    if (profileError) { setError(profileError.message); setLoading(false); return; }
    if (emergencyContact.trim()) {
      const parts = emergencyContact.trim().split(/\s*[,:-]\s*/);
      const phone = parts.find((part) => /[0-9+]/.test(part)) ?? emergencyContact.trim();
      const name = parts.find((part) => part !== phone) ?? "Emergency contact";
      await supabase.from("emergency_contacts").insert({ user_id: user.id, name, phone });
    }
    localStorage.setItem("old-touch-setup-complete", "true");
    navigate({ to: "/" });
  };

  return <AppShell><main className="flex flex-1 flex-col p-6 pt-10">
    <div className="mb-8"><h1 className="text-4xl font-black">A few things first</h1><p className="mt-2 text-lg font-semibold text-muted-foreground">These help Old Touch show useful local information and make it easier to get help.</p></div>
    <div className="flex flex-col gap-5"><FormField label="Your town or city" placeholder="e.g. New Delhi" value={city} onChange={setCity} /><FormField label="Emergency contact" placeholder="Name or mobile number" optional value={emergencyContact} onChange={setEmergencyContact} /><p className="text-base font-medium text-muted-foreground">You can add or change emergency contacts later.</p>{error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}</div>
    <button type="button" onClick={finish} disabled={loading || !city.trim()} className="mt-auto w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Saving…" : "Finish Setup"}</button>
  </main></AppShell>;
}
