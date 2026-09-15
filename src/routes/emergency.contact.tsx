import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneCall, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/emergency/contact")({
  head: () => ({
    meta: [
      { title: "Get Help — Old Touch" },
      { name: "description", content: "Call emergency services or one of your saved emergency contacts." },
    ],
  }),
  component: EmergencyContactScreen,
});

type EmergencyContact = { id: string; name: string; phone: string; relationship: string | null };

function EmergencyContactScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error: contactError } = await supabase.from("emergency_contacts").select("id,name,phone,relationship").eq("user_id", user.id).order("created_at");
      if (contactError) setError(contactError.message);
      setContacts((data ?? []) as EmergencyContact[]);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell>
      <PageHeader title="Get Help" backTo="/emergency" />
      <main className="flex flex-col gap-4 p-5">
        <Card>
          <div className="flex items-start gap-3"><ShieldAlert className="mt-1 h-7 w-7 shrink-0 text-destructive" /><div><p className="text-xl font-black">If this is an emergency</p><p className="mt-1 text-base font-semibold text-muted-foreground">Call India’s emergency number 112 or a trusted contact below.</p></div></div>
        </Card>
        <a href="tel:112" className="flex w-full items-center justify-center gap-3 rounded-3xl bg-red-600 px-6 py-5 text-2xl font-extrabold text-white"><PhoneCall className="h-8 w-8" /> Call 112</a>
        {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">Could not load saved contacts: {error}</p>}
        {!loading && contacts.map((contact) => (
          <a key={contact.id} href={`tel:${contact.phone}`} className="flex items-center justify-between gap-4 rounded-3xl border-2 border-border bg-background px-5 py-4">
            <div><p className="text-xl font-black">{contact.name}</p><p className="text-base font-semibold text-muted-foreground">{contact.relationship || contact.phone}</p></div>
            <PhoneCall className="h-7 w-7 shrink-0" />
          </a>
        ))}
        {!loading && contacts.length === 0 && <Card><p className="text-lg font-semibold">No personal emergency contacts are saved yet. You can still call 112.</p></Card>}
      </main>
    </AppShell>
  );
}
