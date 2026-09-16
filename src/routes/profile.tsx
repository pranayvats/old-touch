import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, LogOut, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";
import { applyTextSize, getStoredTextSize, saveTextSize, TEXT_SIZE_LABELS, TEXT_SIZES, type TextSize } from "@/lib/text-size";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile & Settings — Old Touch" }, { name: "description", content: "Update your Old Touch profile and accessibility settings." }] }),
  component: ProfileScreen,
});

type Profile = { full_name: string; phone: string | null; city: string | null; home_location: string | null; avatar_url: string | null; text_size: string };

function ProfileScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [textSize, setTextSize] = useState<TextSize>(getStoredTextSize());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    applyTextSize(textSize);
    void (async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { navigate({ to: "/login", replace: true }); return; }
      setUserId(user.id);
      const { data, error: profileError } = await supabase.from("profiles").select("full_name,phone,city,home_location,avatar_url,text_size").eq("id", user.id).maybeSingle();
      if (profileError) { setError("Your profile could not be loaded. Please try again."); setLoading(false); return; }
      const next: Profile = {
        full_name: data?.full_name ?? String(user.user_metadata?.full_name ?? "Old Touch member"),
        phone: data?.phone ?? user.phone ?? null,
        city: data?.city ?? null,
        home_location: data?.home_location ?? null,
        avatar_url: data?.avatar_url ?? null,
        text_size: data?.text_size ?? getStoredTextSize(),
      };
      setProfile(next); setName(next.full_name); setPhone(next.phone ?? ""); setCity(next.city ?? ""); setHomeLocation(next.home_location ?? ""); setAvatarUrl(next.avatar_url); if (next.text_size === "default" || next.text_size === "large" || next.text_size === "xlarge") { setTextSize(next.text_size); saveTextSize(next.text_size); }
      setLoading(false);
    })();
  }, [navigate]);

  const save = async () => {
    if (!userId || saving) return;
    const cleanName = name.trim();
    if (!cleanName) { setError("Please enter your full name."); return; }
    setSaving(true); setError(""); setMessage("");
    const { error: updateError } = await supabase.from("profiles").update({ full_name: cleanName, phone: phone.trim() || null, city: city.trim() || null, home_location: homeLocation.trim() || null, avatar_url: avatarUrl, text_size: textSize }).eq("id", userId);
    if (updateError) setError("Your changes could not be saved. Please try again.");
    else { saveTextSize(textSize); setMessage("Profile saved."); setProfile({ full_name: cleanName, phone: phone.trim() || null, city: city.trim() || null, home_location: homeLocation.trim() || null, avatar_url: avatarUrl, text_size: textSize }); }
    setSaving(false);
  };

  const choosePhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Please choose a photo smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : null;
      if (value && value.length <= 900_000) { setAvatarUrl(value); setError(""); }
      else setError("That photo is too large. Please choose a smaller image.");
    };
    reader.readAsDataURL(file);
  };

  const signOut = async () => { await supabase.auth.signOut(); localStorage.removeItem("old-touch-logged-in"); localStorage.removeItem("old-touch-setup-complete"); navigate({ to: "/login", replace: true }); };

  if (loading) return <AppShell><main className="flex flex-1 items-center justify-center p-6"><p className="text-2xl font-bold">Loading your profile…</p></main></AppShell>;

  return <AppShell>
    <PageHeader title="Profile & Settings" subtitle="Your details and accessibility" backTo="/" />
    <main className="flex flex-col gap-4 p-5">
      {error && <p role="alert" className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-2xl bg-primary/10 p-4 text-base font-bold text-primary">{message}</p>}
      <Card>
        <div className="flex items-center gap-4">
          {avatarUrl ? <img src={avatarUrl} alt="Your profile photo" className="h-24 w-24 rounded-full object-cover border-2 border-border" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-12 w-12" /></div>}
          <div><p className="text-xl font-black">Profile photo</p><p className="text-base font-medium text-muted-foreground">Optional. Stored securely with your profile.</p><label className="mt-3 inline-flex min-h-12 cursor-pointer items-center rounded-2xl border-2 border-border bg-background px-4 text-base font-bold">Choose photo<input type="file" accept="image/*" className="sr-only" onChange={(event) => choosePhoto(event.target.files?.[0])} /></label></div>
        </div>
      </Card>
      <Card>
        <div className="space-y-4">
          <FormField label="Full name" value={name} onChange={setName} />
          <FormField label="Phone number" type="tel" placeholder="e.g. +91 98765 43210" value={phone} onChange={setPhone} />
          <FormField label="Town or city" value={city} onChange={setCity} />
          <FormField label="Home location" optional placeholder="Neighbourhood, apartment or landmark" value={homeLocation} onChange={setHomeLocation} />
          <p className="text-sm font-medium text-muted-foreground">Your email address is managed by your sign-in provider and cannot be edited here.</p>
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-black">Text size</h2>
        <p className="mt-1 text-base font-medium text-muted-foreground">Choose a size that is comfortable to read.</p>
        <div className="mt-4 flex flex-col gap-3">
          {TEXT_SIZES.map((size) => <button key={size} type="button" onClick={() => { setTextSize(size); saveTextSize(size); }} aria-pressed={textSize === size} className={`flex min-h-14 items-center justify-between rounded-2xl border-2 px-4 text-left font-extrabold ${textSize === size ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}><span>{TEXT_SIZE_LABELS[size]}</span>{textSize === size && <Check className="h-6 w-6" aria-hidden="true" />}</button>)}
        </div>
      </Card>
      <button type="button" onClick={() => void save()} disabled={saving} className="flex min-h-16 w-full items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-5 text-xl font-extrabold text-primary-foreground disabled:opacity-50"><Check className="h-7 w-7" />{saving ? "Saving…" : "Save changes"}</button>
      <button type="button" onClick={() => void signOut()} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-3xl border-2 border-destructive bg-background px-6 py-4 text-lg font-extrabold text-destructive"><LogOut className="h-6 w-6" />Sign out</button>
      {profile && <p className="text-center text-sm font-medium text-muted-foreground">Your Old Touch profile is always private.</p>}
    </main>
  </AppShell>;
}
