import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneCall, ShieldAlert, Star, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabase";
import {
  getPrimaryContactId,
  isEmergencyReason,
  sortContacts,
  type EmergencyContact,
  type EmergencyReason,
} from "@/lib/emergency";

export const Route = createFileRoute("/emergency/contact")({
  validateSearch: (search: Record<string, unknown>) => ({
    reason: isEmergencyReason(search.reason)
      ? (search.reason as EmergencyReason)
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Get Help — Old Touch" },
      {
        name: "description",
        content: "Call emergency services or one of your saved emergency contacts.",
      },
      { property: "og:title", content: "Get Help — Old Touch" },
      {
        property: "og:description",
        content: "Call emergency services or one of your saved emergency contacts.",
      },
    ],
  }),
  component: EmergencyContactScreen,
});

function EmergencyContactScreen() {
  const { reason } = Route.useSearch();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setPrimaryId(getPrimaryContactId(user.id));
      const { data, error: contactError } = await supabase
        .from("emergency_contacts")
        .select("id,name,phone,relationship")
        .eq("user_id", user.id)
        .order("created_at");
      if (contactError) setError(contactError.message);
      setContacts((data ?? []) as EmergencyContact[]);
      setLoading(false);
    })();
  }, []);

  const ordered = sortContacts(contacts, primaryId);

  return (
    <AppShell>
      <PageHeader title="Get Help" backTo="/emergency" />
      <main className="flex flex-col gap-4 p-5">
        {reason && (
          <div className="rounded-3xl border-2 border-destructive bg-destructive/10 p-5">
            <p className="text-base font-bold uppercase tracking-wide text-destructive">
              What is wrong
            </p>
            <p className="mt-1 text-3xl font-black text-foreground">{reason}</p>
            <p className="mt-2 text-base font-semibold text-muted-foreground">
              Read this out when someone answers the call.
            </p>
          </div>
        )}

        <Card>
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-7 w-7 shrink-0 text-destructive" />
            <div>
              <p className="text-xl font-black">If this is an emergency</p>
              <p className="mt-1 text-base font-semibold text-muted-foreground">
                Call India’s emergency number 112 or a trusted contact below.
              </p>
            </div>
          </div>
        </Card>

        <a
          href="tel:112"
          className="flex w-full items-center justify-center gap-3 rounded-3xl bg-red-600 px-6 py-5 text-2xl font-extrabold text-white active:opacity-90"
        >
          <PhoneCall className="h-8 w-8" aria-hidden="true" /> Call 112
        </a>

        {error && (
          <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">
            Could not load saved contacts: {error}
          </p>
        )}

        {!loading &&
          ordered.map((contact) => (
            <a
              key={contact.id}
              href={`tel:${contact.phone}`}
              className={`flex items-center justify-between gap-4 rounded-3xl border-2 px-5 py-4 ${
                contact.id === primaryId
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              <div>
                <p className="flex items-center gap-2 text-xl font-black">
                  {contact.id === primaryId && (
                    <Star
                      className="h-5 w-5 shrink-0 text-primary"
                      aria-label="Primary contact"
                    />
                  )}
                  {contact.name}
                </p>
                <p className="text-base font-semibold text-muted-foreground">
                  {contact.relationship || contact.phone}
                </p>
              </div>
              <PhoneCall className="h-7 w-7 shrink-0" aria-hidden="true" />
            </a>
          ))}

        {!loading && contacts.length === 0 && (
          <Card>
            <p className="text-lg font-semibold">
              No personal emergency contacts are saved yet. You can still call 112.
            </p>
          </Card>
        )}

        <Link
          to="/emergency/contacts"
          className="flex items-center justify-center gap-3 rounded-3xl border-2 border-border bg-card px-5 py-4 text-lg font-extrabold text-foreground active:bg-accent"
        >
          <Users className="h-6 w-6" aria-hidden="true" /> Manage my emergency
          contacts
        </Link>
      </main>
    </AppShell>
  );
}
