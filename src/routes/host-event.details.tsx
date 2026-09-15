import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/host-event/details")({
  validateSearch: (search: Record<string, unknown>) => ({ name: typeof search.name === "string" ? search.name : "" }),
  component: EventDetailsScreen,
});

function EventDetailsScreen() {
  const navigate = useNavigate();
  const { name } = Route.useSearch();
  const [eventName, setEventName] = useState(name);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [inviteText, setInviteText] = useState("");
  const [people, setPeople] = useState<{ id: string; full_name: string; phone: string | null }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPeople = async () => {
      const { data } = await supabase.from("profiles").select("id,full_name,phone").order("full_name");
      setPeople(data ?? []);
    };
    void loadPeople();
  }, []);

  const filteredPeople = people.filter((p) => `${p.full_name} ${p.phone ?? ""}`.toLowerCase().includes(inviteText.toLowerCase()));

  const togglePerson = (id: string) => setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);

  const createEvent = async () => {
    if (!eventName.trim() || !date || !startTime || !location.trim()) return;
    setSaving(true); setError(""); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please log in again."); setSaving(false); return; }

    const startsAt = new Date(`${date}T${startTime}`).toISOString();
    const endsAt = endTime ? new Date(`${date}T${endTime}`).toISOString() : null;
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) { setError("End time must be after the start time."); setSaving(false); return; }

    const { data: event, error: eventError } = await supabase.from("events").insert({
      host_id: user.id, name: eventName.trim(), description: description.trim() || null,
      starts_at: startsAt, ends_at: endsAt, location_name: location.trim(),
    }).select("id").single();
    if (eventError || !event) { setError(eventError?.message || "Could not create event."); setSaving(false); return; }

    if (selected.length) {
      const invites = selected.filter((id) => id !== user.id).map((invitee_id) => ({ event_id: event.id, invitee_id, status: "pending" }));
      if (invites.length) {
        const { error: inviteError } = await supabase.from("event_invites").insert(invites);
        if (inviteError) { setError(`Event created, but invitations failed: ${inviteError.message}`); setSaving(false); return; }
        const notifications = invites.map((i) => ({ user_id: i.invitee_id, title: "New event invitation", body: eventName.trim() }));
        await supabase.from("notifications").insert(notifications);
      }
    }

    setMessage("✓ Event created successfully!");
    setSaving(false);
    setTimeout(() => navigate({ to: "/community" }), 900);
  };

  return (
    <AppShell>
      <PageHeader title="Event Details" backTo="/host-event" />
      <main className="flex flex-1 flex-col gap-5 p-5">
        <FormField label="Event name" placeholder="Evening walk together" value={eventName} onChange={setEventName} />
        <FormField label="Description" placeholder="Tell people what the event is about" optional multiline value={description} onChange={setDescription} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" type="date" value={date} onChange={setDate} />
          <FormField label="Start time" type="time" value={startTime} onChange={setStartTime} />
        </div>
        <FormField label="End time" type="time" value={endTime} onChange={setEndTime} optional />
        <FormField label="Location" placeholder="Community hall, Sector 12" value={location} onChange={setLocation} />
        <FormField label="Find people to invite" placeholder="Search by name or phone" value={inviteText} onChange={setInviteText} optional />
        <div className="flex flex-col gap-2">
          {filteredPeople.slice(0, 8).map((person) => (
            <button key={person.id} type="button" onClick={() => togglePerson(person.id)} className={`rounded-2xl border-2 p-4 text-left text-lg font-bold ${selected.includes(person.id) ? "border-primary bg-primary/10" : "border-border"}`}>
              {selected.includes(person.id) ? "✓ " : "○ "}{person.full_name}{person.phone ? ` · ${person.phone}` : ""}
            </button>
          ))}
        </div>
        {error && <p className="rounded-2xl bg-destructive/10 p-4 font-bold text-destructive">{error}</p>}
        {message && <p className="rounded-2xl bg-primary/10 p-5 text-center text-xl font-black">{message}</p>}
        <button type="button" onClick={createEvent} disabled={saving || !eventName.trim() || !date || !startTime || !location.trim()} className="mt-2 w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:opacity-50">{saving ? "Creating…" : "Create Event"}</button>
        <Card><p className="text-base font-medium text-muted-foreground">Invited people will receive an Old Touch notification and can respond to the invitation.</p></Card>
      </main>
    </AppShell>
  );
}
