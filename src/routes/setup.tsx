import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/setup")({ component: SetupScreen });

function SetupScreen() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      if (userError || !user) { navigate({ to: "/login", replace: true }); return; }

      const { data: profile, error: profileError } = await supabase.from("profiles").select("city").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (profileError) setError(profileError.message);
      if (profile?.city) setCity(profile.city);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [navigate]);

  const finish = async () => {
    const cleanCity = city.trim();
    if (!cleanCity) return;
    setSaving(true); setError("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { navigate({ to: "/login", replace: true }); return; }

    const cleanName = String(user.user_metadata?.full_name ?? "Old Touch member").trim() || "Old Touch member";
    const metadataPhone = String(user.user_metadata?.phone ?? "").trim();

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: cleanName,
      phone: metadataPhone || user.phone || null,
      city: cleanCity,
    });
    if (profileError) { setError(profileError.message); setSaving(false); return; }

    if (emergencyContact.trim()) {
      const raw = emergencyContact.trim();
      const phoneMatch = raw.match(/(?:\+?\d[\d\s()-]{7,}\d)/);
      const phone = (phoneMatch?.[0] ?? "").replace(/[^\d+]/g, "");
      if (phone.replace(/\D/g, "").length < 10) {
        setError("Please enter a valid emergency contact mobile number.");
        setSaving(false);
        return;
      }
      const name = raw.replace(phoneMatch?.[0] ?? "", "").replace(/[,:-]/g, " ").replace(/\s+/g, " ").trim() || "Emergency contact";

      // Avoid creating duplicate contacts if setup is opened again.
      const { data: existing } = await supabase.from("emergency_contacts").select("id").eq("user_id", user.id).eq("phone", phone).maybeSingle();
      if (!existing) {
        const { error: contactError } = await supabase.from("emergency_contacts").insert({ user_id: user.id, name, phone });
        if (contactError) { setError(contactError.message); setSaving(false); return; }
      }
    }

    localStorage.setItem("old-touch-setup-complete", "true");
    localStorage.setItem("old-touch-logged-in", "true");
    navigate({ to: "/", replace: true });
  };

  if (loading) return <AppShell><main className="flex flex-1 items-center justify-center p-6"><p className="text-2xl font-bold">Loading your setup…</p></main></AppShell>;

  return <AppShell><main className="flex flex-1 flex-col p-6 pt-10">
    <div className="mb-8"><h1 className="text-4xl font-black">A few things first</h1><p className="mt-2 text-lg font-semibold text-muted-foreground">These help Old Touch show useful local information and make it easier to get help.</p></div>
    <div className="flex flex-col gap-5">
      <FormField label="Your town or city" placeholder="e.g. New Delhi" value={city} onChange={setCity} />
      <FormField label="Emergency contact" placeholder="e.g. Ramesh — 98765 43210" value={emergencyContact} onChange={setEmergencyContact} />
      <p className="text-base font-medium text-muted-foreground">You can add or change emergency contacts later.</p>
      {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
    </div>
    <button type="button" onClick={() => void finish()} disabled={saving || !city.trim()} className="mt-auto w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Finish Setup"}</button>
  </main></AppShell>;
}
