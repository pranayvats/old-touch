import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Star, Trash2, Pencil, Check, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";
import {
  clearPrimaryContactId,
  getPrimaryContactId,
  isValidPhone,
  normalizePhone,
  setPrimaryContactId,
  sortContacts,
  type EmergencyContact,
} from "@/lib/emergency";

export const Route = createFileRoute("/emergency/contacts")({
  head: () => ({
    meta: [
      { title: "Emergency Contacts — Old Touch" },
      {
        name: "description",
        content: "Add, change or remove the people Old Touch should call for you.",
      },
      { property: "og:title", content: "Emergency Contacts — Old Touch" },
      {
        property: "og:description",
        content: "Add, change or remove the people Old Touch should call for you.",
      },
    ],
  }),
  component: EmergencyContactsScreen,
});

type Draft = { name: string; relationship: string; phone: string };

const emptyDraft: Draft = { name: "", relationship: "", phone: "" };

function EmergencyContactsScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [confirmDelete, setConfirmDelete] = useState<EmergencyContact | null>(null);

  const load = async (id: string) => {
    const { data, error: loadError } = await supabase
      .from("emergency_contacts")
      .select("id,name,phone,relationship")
      .eq("user_id", id)
      .order("created_at");
    if (loadError) {
      setError("Your contacts could not be loaded. Please try again.");
      return;
    }
    setContacts((data ?? []) as EmergencyContact[]);
  };

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in again to manage your emergency contacts.");
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setPrimaryId(getPrimaryContactId(user.id));
      await load(user.id);
      setLoading(false);
    })();
  }, []);

  const validate = (value: Draft) => {
    if (!value.name.trim()) return "Please enter a name.";
    if (!isValidPhone(value.phone))
      return "Please enter a valid mobile number (at least 10 digits).";
    return "";
  };

  const addContact = async () => {
    if (!userId || saving) return;
    const problem = validate(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    const { data, error: insertError } = await supabase
      .from("emergency_contacts")
      .insert({
        user_id: userId,
        name: draft.name.trim(),
        relationship: draft.relationship.trim() || null,
        phone: normalizePhone(draft.phone),
      })
      .select("id,name,phone,relationship")
      .single();
    if (insertError) {
      setError(`Could not save this contact: ${insertError.message}`);
      setSaving(false);
      return;
    }
    const created = data as EmergencyContact;
    setContacts((current) => [...current, created]);
    if (!primaryId) {
      setPrimaryContactId(userId, created.id);
      setPrimaryId(created.id);
    }
    setDraft(emptyDraft);
    setAdding(false);
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!userId || !editingId || saving) return;
    const problem = validate(editDraft);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase
      .from("emergency_contacts")
      .update({
        name: editDraft.name.trim(),
        relationship: editDraft.relationship.trim() || null,
        phone: normalizePhone(editDraft.phone),
      })
      .eq("id", editingId)
      .eq("user_id", userId);
    if (updateError) {
      setError(`Could not update this contact: ${updateError.message}`);
      setSaving(false);
      return;
    }
    setContacts((current) =>
      current.map((contact) =>
        contact.id === editingId
          ? {
              ...contact,
              name: editDraft.name.trim(),
              relationship: editDraft.relationship.trim() || null,
              phone: normalizePhone(editDraft.phone),
            }
          : contact,
      ),
    );
    setEditingId(null);
    setSaving(false);
  };

  const deleteContact = async (contact: EmergencyContact) => {
    if (!userId || saving) return;
    setSaving(true);
    setError("");
    const { error: deleteError } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("id", contact.id)
      .eq("user_id", userId);
    if (deleteError) {
      setError(`Could not remove this contact: ${deleteError.message}`);
      setSaving(false);
      return;
    }
    clearPrimaryContactId(userId, contact.id);
    if (primaryId === contact.id) setPrimaryId(null);
    setContacts((current) => current.filter((item) => item.id !== contact.id));
    setConfirmDelete(null);
    setSaving(false);
  };

  const makePrimary = (contact: EmergencyContact) => {
    if (!userId) return;
    setPrimaryContactId(userId, contact.id);
    setPrimaryId(contact.id);
  };

  const ordered = sortContacts(contacts, primaryId);

  return (
    <AppShell>
      <PageHeader
        title="Emergency Contacts"
        subtitle="People Old Touch should call for you"
        backTo="/emergency"
      />
      <main className="flex flex-col gap-4 p-5">
        {error && (
          <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">
            {error}
          </p>
        )}

        {loading && <p className="text-lg font-bold">Loading your contacts…</p>}

        {!loading &&
          ordered.map((contact) =>
            editingId === contact.id ? (
              <Card key={contact.id}>
                <div className="space-y-4">
                  <FormField
                    label="Name"
                    value={editDraft.name}
                    onChange={(value) =>
                      setEditDraft((current) => ({ ...current, name: value }))
                    }
                  />
                  <FormField
                    label="Relationship"
                    optional
                    placeholder="e.g. Son, Neighbour"
                    value={editDraft.relationship}
                    onChange={(value) =>
                      setEditDraft((current) => ({ ...current, relationship: value }))
                    }
                  />
                  <FormField
                    label="Mobile number"
                    type="tel"
                    placeholder="e.g. 98765 43210"
                    value={editDraft.phone}
                    onChange={(value) =>
                      setEditDraft((current) => ({ ...current, phone: value }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => void saveEdit()}
                      disabled={saving}
                      className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-lg font-extrabold text-primary-foreground disabled:opacity-50"
                    >
                      <Check className="h-6 w-6" aria-hidden="true" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setError("");
                      }}
                      className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background px-4 py-3 text-lg font-extrabold text-foreground"
                    >
                      <X className="h-6 w-6" aria-hidden="true" /> Cancel
                    </button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card key={contact.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xl font-black">
                      {contact.id === primaryId && (
                        <Star
                          className="h-5 w-5 shrink-0 text-primary"
                          aria-label="Primary contact"
                        />
                      )}
                      {contact.name}
                    </p>
                    {contact.relationship && (
                      <p className="text-base font-semibold text-muted-foreground">
                        {contact.relationship}
                      </p>
                    )}
                    <p className="mt-1 text-lg font-bold">{contact.phone}</p>
                  </div>
                  {contact.id === primaryId && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                      Primary
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(contact.id);
                      setError("");
                      setEditDraft({
                        name: contact.name,
                        relationship: contact.relationship ?? "",
                        phone: contact.phone,
                      });
                    }}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-base font-bold"
                  >
                    <Pencil className="h-5 w-5" aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => makePrimary(contact)}
                    disabled={contact.id === primaryId}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-base font-bold disabled:opacity-50"
                  >
                    <Star className="h-5 w-5" aria-hidden="true" /> Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(contact)}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-destructive bg-background text-base font-bold text-destructive"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden="true" /> Remove
                  </button>
                </div>
              </Card>
            ),
          )}

        {!loading && contacts.length === 0 && (
          <Card>
            <p className="text-lg font-semibold">
              You have not added anyone yet. Add a family member or neighbour who
              should be called in an emergency.
            </p>
          </Card>
        )}

        {adding ? (
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-black">Add a contact</h2>
              <FormField
                label="Name"
                placeholder="e.g. Ramesh"
                value={draft.name}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, name: value }))
                }
              />
              <FormField
                label="Relationship"
                optional
                placeholder="e.g. Son, Neighbour"
                value={draft.relationship}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, relationship: value }))
                }
              />
              <FormField
                label="Mobile number"
                type="tel"
                placeholder="e.g. 98765 43210"
                value={draft.phone}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, phone: value }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => void addContact()}
                  disabled={saving}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-lg font-extrabold text-primary-foreground disabled:opacity-50"
                >
                  <Check className="h-6 w-6" aria-hidden="true" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setDraft(emptyDraft);
                    setError("");
                  }}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background px-4 py-3 text-lg font-extrabold text-foreground"
                >
                  <X className="h-6 w-6" aria-hidden="true" /> Cancel
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setError("");
            }}
            className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-5 text-xl font-extrabold text-primary-foreground active:opacity-90"
          >
            <Plus className="h-7 w-7" aria-hidden="true" /> Add a contact
          </button>
        )}

        <p className="text-base font-medium text-muted-foreground">
          The primary contact is shown first on the Get Help screen so it is
          easiest to call.
        </p>
      </main>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-5">
          <div className="w-full max-w-md rounded-3xl bg-card p-6">
            <h2 className="text-2xl font-black">Remove {confirmDelete.name}?</h2>
            <p className="mt-2 text-base font-semibold text-muted-foreground">
              They will no longer appear on your Get Help screen.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void deleteContact(confirmDelete)}
                disabled={saving}
                className="min-h-14 rounded-2xl bg-destructive px-4 py-3 text-lg font-extrabold text-destructive-foreground disabled:opacity-50"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="min-h-14 rounded-2xl border-2 border-border bg-background px-4 py-3 text-lg font-extrabold text-foreground"
              >
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
