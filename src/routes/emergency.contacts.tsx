import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Star, Trash2, Pencil, Check, X, PhoneCall } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";
import { isValidPhone, normalizePhone, sortContacts, type EmergencyContact } from "@/lib/emergency";

export const Route = createFileRoute("/emergency/contacts")({ component: EmergencyContactsScreen });

type Draft = { name: string; relationship: string; phone: string };
const emptyDraft: Draft = { name: "", relationship: "", phone: "" };

function EmergencyContactsScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [confirmDelete, setConfirmDelete] = useState<EmergencyContact | null>(null);

  const load = async (id: string) => {
    const { data, error: loadError } = await supabase.from("emergency_contacts").select("id,name,phone,relationship,is_primary").eq("user_id", id).order("created_at");
    if (loadError) { setError("Your contacts could not be loaded. Please try again."); return; }
    let loaded = (data ?? []) as EmergencyContact[];
    if (loaded.length > 0 && !loaded.some((contact) => contact.is_primary)) {
      const first = loaded[0];
      const { error: primaryError } = await supabase.from("emergency_contacts").update({ is_primary: true }).eq("id", first.id).eq("user_id", id);
      if (!primaryError) loaded = loaded.map((item) => item.id === first.id ? { ...item, is_primary: true } : item);
    }
    setContacts(sortContacts(loaded));
  };

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please log in again to manage your emergency contacts."); setLoading(false); return; }
      setUserId(user.id);
      await load(user.id);
      setLoading(false);
    })();
  }, []);

  const validate = (value: Draft) => {
    if (!value.name.trim()) return "Please enter a name.";
    if (!isValidPhone(value.phone)) return "Please enter a valid phone number (10 to 15 digits).";
    return "";
  };

  const makePrimary = async (contactId: string) => {
    if (!userId || saving) return;
    setSaving(true); setError("");
    const { error: clearError } = await supabase.from("emergency_contacts").update({ is_primary: false }).eq("user_id", userId).eq("is_primary", true);
    if (clearError) { setError("Could not change the primary contact."); setSaving(false); return; }
    const { error: setErrorValue } = await supabase.from("emergency_contacts").update({ is_primary: true }).eq("id", contactId).eq("user_id", userId);
    if (setErrorValue) setError("Could not set this contact as primary.");
    else setContacts((current) => sortContacts(current.map((item) => ({ ...item, is_primary: item.id === contactId }))));
    setSaving(false);
  };

  const addContact = async () => {
    if (!userId || saving) return;
    const problem = validate(draft); if (problem) { setError(problem); return; }
    setSaving(true); setError("");
    const { data, error: insertError } = await supabase.from("emergency_contacts").insert({ user_id: userId, name: draft.name.trim(), relationship: draft.relationship.trim() || null, phone: normalizePhone(draft.phone), is_primary: contacts.length === 0 }).select("id,name,phone,relationship,is_primary").single();
    if (insertError) setError(`Could not save this contact: ${insertError.message}`);
    else { setContacts((current) => sortContacts([...current, data as EmergencyContact])); setDraft(emptyDraft); setAdding(false); }
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!userId || !editingId || saving) return;
    const problem = validate(editDraft); if (problem) { setError(problem); return; }
    setSaving(true); setError("");
    const { error: updateError } = await supabase.from("emergency_contacts").update({ name: editDraft.name.trim(), relationship: editDraft.relationship.trim() || null, phone: normalizePhone(editDraft.phone) }).eq("id", editingId).eq("user_id", userId);
    if (updateError) setError(`Could not update this contact: ${updateError.message}`);
    else { setContacts((current) => current.map((item) => item.id === editingId ? { ...item, name: editDraft.name.trim(), relationship: editDraft.relationship.trim() || null, phone: normalizePhone(editDraft.phone) } : item)); setEditingId(null); }
    setSaving(false);
  };

  const deleteContact = async (contact: EmergencyContact) => {
    if (!userId || saving) return;
    setSaving(true); setError("");
    const { error: deleteError } = await supabase.from("emergency_contacts").delete().eq("id", contact.id).eq("user_id", userId);
    if (deleteError) { setError(`Could not remove this contact: ${deleteError.message}`); setSaving(false); return; }
    const remaining = contacts.filter((item) => item.id !== contact.id);
    if (contact.is_primary && remaining.length) {
      const newPrimary = remaining[0];
      const { error: primaryError } = await supabase.from("emergency_contacts").update({ is_primary: true }).eq("id", newPrimary.id).eq("user_id", userId);
      if (primaryError) setError("The contact was removed, but the next primary contact could not be set.");
      setContacts(sortContacts(remaining.map((item) => ({ ...item, is_primary: item.id === newPrimary.id }))));
    } else setContacts(remaining);
    setConfirmDelete(null); setSaving(false);
  };

  return <AppShell>
    <PageHeader title="Emergency Contacts" subtitle="People Old Touch should call for you" backTo="/emergency" />
    <main className="flex flex-col gap-4 p-5">
      {error && <p role="alert" className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
      {loading && <p className="text-lg font-bold">Loading your contacts…</p>}
      {!loading && contacts.length === 0 && <Card><p className="text-lg font-semibold">No personal emergency contacts are saved yet. You can still call 112.</p></Card>}
      {!loading && sortContacts(contacts).map((contact) => editingId === contact.id ? <Card key={contact.id}><div className="space-y-4"><FormField label="Name" value={editDraft.name} onChange={(value) => setEditDraft((c) => ({ ...c, name: value }))} /><FormField label="Relationship" optional placeholder="e.g. Son, Neighbour" value={editDraft.relationship} onChange={(value) => setEditDraft((c) => ({ ...c, relationship: value }))} /><FormField label="Phone number" type="tel" placeholder="e.g. +91 98765 43210" value={editDraft.phone} onChange={(value) => setEditDraft((c) => ({ ...c, phone: value }))} /><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => void saveEdit()} disabled={saving} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground"><Check className="h-6 w-6" />Save</button><button type="button" onClick={() => setEditingId(null)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-lg font-extrabold"><X className="h-6 w-6" />Cancel</button></div></div></Card> : <Card key={contact.id}><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-xl font-black">{contact.is_primary && <Star className="h-5 w-5 text-primary" />} {contact.name}</p>{contact.relationship && <p className="text-base font-semibold text-muted-foreground">{contact.relationship}</p>}<p className="mt-1 text-lg font-bold">{contact.phone}</p></div>{contact.is_primary && <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">Primary</span>}</div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><a href={`tel:${contact.phone}`} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground"><PhoneCall className="h-5 w-5" />Call</a><button type="button" onClick={() => { setEditingId(contact.id); setEditDraft({ name: contact.name, relationship: contact.relationship ?? "", phone: contact.phone }); }} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-base font-bold"><Pencil className="h-5 w-5" />Edit</button><button type="button" onClick={() => void makePrimary(contact.id)} disabled={contact.is_primary || saving} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-base font-bold disabled:opacity-50"><Star className="h-5 w-5" />Primary</button><button type="button" onClick={() => setConfirmDelete(contact)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-destructive bg-background text-base font-bold text-destructive"><Trash2 className="h-5 w-5" />Remove</button></div></Card>)}
      {adding ? <Card><div className="space-y-4"><h2 className="text-xl font-black">Add a contact</h2><FormField label="Name" placeholder="e.g. Ramesh" value={draft.name} onChange={(value) => setDraft((c) => ({ ...c, name: value }))} /><FormField label="Relationship" optional placeholder="e.g. Son, Neighbour" value={draft.relationship} onChange={(value) => setDraft((c) => ({ ...c, relationship: value }))} /><FormField label="Phone number" type="tel" placeholder="e.g. +91 98765 43210" value={draft.phone} onChange={(value) => setDraft((c) => ({ ...c, phone: value }))} /><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => void addContact()} disabled={saving} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground"><Check className="h-6 w-6" />Save</button><button type="button" onClick={() => { setAdding(false); setDraft(emptyDraft); }} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-lg font-extrabold"><X className="h-6 w-6" />Cancel</button></div></div></Card> : <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-5 text-xl font-extrabold text-primary-foreground"><Plus className="h-7 w-7" />Add a contact</button>}
      <p className="text-base font-medium text-muted-foreground">The primary contact appears first on Get Help. 112 is always available even without a saved contact.</p>
    </main>
    {confirmDelete && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-5"><div className="w-full max-w-md rounded-3xl bg-card p-6"><h2 className="text-2xl font-black">Remove {confirmDelete.name}?</h2><p className="mt-2 text-base font-semibold text-muted-foreground">They will no longer appear on your Get Help screen.</p><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => void deleteContact(confirmDelete)} disabled={saving} className="min-h-14 rounded-2xl bg-destructive text-lg font-extrabold text-destructive-foreground">Remove</button><button type="button" onClick={() => setConfirmDelete(null)} className="min-h-14 rounded-2xl border-2 border-border bg-background text-lg font-extrabold">Keep</button></div></div></div>}
  </AppShell>;
}
