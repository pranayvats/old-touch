import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, Check, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Old Touch" },
      { name: "description", content: "Messages and reminders from Old Touch." },
      { property: "og:title", content: "Notifications — Old Touch" },
      { property: "og:description", content: "Messages and reminders from Old Touch." },
    ],
  }),
  component: NotificationsScreen,
});

type Notification = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please log in again to see your notifications.");
      setLoading(false);
      return;
    }
    const { data, error: loadError } = await supabase
      .from("notifications")
      .select("id,title,body,read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (loadError) setError("Your notifications could not be loaded. Please try again.");
    else setItems((data ?? []) as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (id: string) => {
    setWorking(true);
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (updateError) setError("That notification could not be marked as read.");
    else
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
    setWorking(false);
  };

  const markAllRead = async () => {
    const unread = items.filter((item) => !item.read).map((item) => item.id);
    if (!unread.length) return;
    setWorking(true);
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unread);
    if (updateError) setError("Your notifications could not be marked as read.");
    else setItems((current) => current.map((item) => ({ ...item, read: true })));
    setWorking(false);
  };

  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount ? `${unreadCount} new` : "All caught up"}
      />
      <main className="flex flex-col gap-4 p-5">
        {error && (
          <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">
            {error}
          </p>
        )}

        {loading && <p className="text-lg font-bold">Loading your notifications…</p>}

        {!loading && unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={working}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-lg font-extrabold text-primary-foreground disabled:opacity-50"
          >
            <CheckCheck className="h-6 w-6" aria-hidden="true" /> Mark all as read
          </button>
        )}

        {!loading && !error && items.length === 0 && (
          <Card>
            <p className="text-lg font-semibold">You have no notifications yet.</p>
            <p className="mt-1 text-base font-medium text-muted-foreground">
              Reminders about your events and community will appear here.
            </p>
          </Card>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-3xl border-2 p-5 shadow-sm ${
              item.read ? "border-border bg-card" : "border-primary bg-primary/10"
            }`}
          >
            <div className="flex items-start gap-3">
              {!item.read && (
                <BellRing className="mt-1 h-6 w-6 shrink-0 text-primary" aria-label="New" />
              )}
              <div className="min-w-0">
                <p className="text-xl font-black">{item.title}</p>
                {item.body && <p className="mt-1 text-base font-semibold">{item.body}</p>}
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {new Date(item.created_at).toLocaleString(undefined, {
                    day: "numeric",
                    month: "long",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            {!item.read && (
              <button
                type="button"
                onClick={() => void markRead(item.id)}
                disabled={working}
                className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-lg font-bold disabled:opacity-50"
              >
                <Check className="h-5 w-5" aria-hidden="true" /> Mark as read
              </button>
            )}
          </div>
        ))}
      </main>
    </AppShell>
  );
}
