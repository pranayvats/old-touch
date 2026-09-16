import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneCall, ShieldAlert, Star, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabase";
import { isEmergencyReason, sortContacts, type EmergencyContact, type EmergencyReason } from "@/lib/emergency";

export const Route = createFileRoute("/emergency/contact")({
  validateSearch: (search: Record<string, unknown>): { reason: EmergencyReason | undefined } => ({
    reason: isEmergencyReason(search["reason"]) ? search["reason"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Get Help — Old Touch" }, { name: "description", content: "Call emergency services or one of your saved emergency contacts." }] }),
  component: EmergencyContactScreen,
});

function EmergencyContactScreen() {
  const { reason } = Route.useSearch();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please log in again."); setLoading(false); return; }
      const { data, error: contactError } = await supabase.from("emergency_contacts").select("id,name,phone,relationship,is_primary").eq("user_id", user.id).order("created_at");
      if (contactError) setError("Could not load your emergency contacts. You can still call 112.");
      setContacts(sortContacts((data ?? []) as EmergencyContact[]));
      setLoading(false);
    })();
  }, []);

  return <AppShell>
    <PageHeader title="Get Help" backTo="/emergency" />
    <main className="flex flex-col gap-4 p-5">
      {reason && <div className="rounded-3xl border-2 border-destructive bg-destructive/10 p-5"><p className="text-base font-bold uppercase tracking-wide text-destructive">What is wrong</p><p className="mt-1 text-3xl font-black">{reason}</p><p className="mt-2 text-base font-semibold text-muted-foreground">Tell the person who answers what is happening.</p></div>}
      <Card><div className="flex items-start gap-3"><ShieldAlert className="mt-1 h-7 w-7 shrink-0 text-destructive" /><div><p className="text-xl font-black">Call for help</p><p className="mt-1 text-base font-semibold text-muted-foreground">Do not wait for this app if someone is in danger.</p></div></div></Card>
      <a href="tel:112" className="flex w-full items-center justify-center gap-3 rounded-3xl bg-red-600 px-6 py-5 text-2xl font-extrabold text-white active:opacity-90"><PhoneCall className="h-8 w-8" />Call 112</a>
      {error && <p role="alert" className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
      {!loading && contacts.map((contact) => <a key={contact.id} href={`tel:${contact.phone}`} className={`flex items-center justify-between gap-4 rounded-3xl border-2 px-5 py-4 ${contact.is_primary ? "border-primary bg-primary/10" : "border-border bg-background"}`}><div><p className="flex items-center gap-2 text-xl font-black">{contact.is_primary && <Star className="h-5 w-5 text-primary" aria-label="Primary contact" />}{contact.name}</p><p className="text-base font-semibold text-muted-foreground">{contact.relationship || contact.phone}</p></div><PhoneCall className="h-7 w-7 shrink-0" /></a>)}
      {!loading && contacts.length === 0 && <Card><p className="text-lg font-semibold">No personal emergency contacts are saved yet. You can still call 112.</p></Card>}
      <Link to="/emergency/contacts" className="flex items-center justify-center gap-3 rounded-3xl border-2 border-border bg-card px-5 py-4 text-lg font-extrabold"><Users className="h-6 w-6" />Manage my emergency contacts</Link>
    </main>
  </AppShell>;
}
