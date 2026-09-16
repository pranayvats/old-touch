import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, Check, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/notifications")({ head: () => ({ meta: [{ title: "Notifications — Old Touch" }, { name: "description", content: "Messages and reminders from Old Touch." }] }), component: NotificationsScreen });
type Notification = { id: string; title: string; body: string | null; read: boolean; created_at: string; source: "app" | "social" };

function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [working, setWorking] = useState(false);
  const load = async () => {
    setLoading(true); setError(""); const { data: { user } } = await supabase.auth.getUser(); if (!user) { setError("Please log in again to see your notifications."); setLoading(false); return; }
    const [{ data: app, error: appError }, { data: social, error: socialError }] = await Promise.all([
      supabase.from("notifications").select("id,title,body,read,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("social_notifications").select("id,actor_id,type,post_id,friend_request_id,read_at,created_at,profiles!social_notifications_actor_id_fkey(full_name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    if (appError && socialError) { setError("Your notifications could not be loaded. Please try again."); setLoading(false); return; }
    const appItems = (app ?? []).map((n: any) => ({ ...n, source: "app" as const }));
    const socialItems = (social ?? []).map((n: any) => { const name = n.profiles?.full_name || "Someone"; const text = n.type === "friend_request" ? `${name} sent you a friend request.` : n.type === "friend_accepted" ? `${name} accepted your friend request.` : n.type === "like" ? `${name} liked your post.` : `${name} commented on your post.`; return { id: n.id, title: n.type === "friend_request" ? "New friend request" : n.type === "friend_accepted" ? "Friend request accepted" : n.type === "like" ? "New like" : "New comment", body: text, read: Boolean(n.read_at), created_at: n.created_at, source: "social" as const }; });
    setItems([...appItems, ...socialItems].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))); setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => { const channel = supabase.channel("notifications-live").on("postgres_changes", { event: "INSERT", schema: "public", table: "social_notifications" }, () => void load()).subscribe(); return () => { void supabase.removeChannel(channel); }; }, []);
  const markRead = async (item: Notification) => { setWorking(true); const { error: e } = item.source === "app" ? await supabase.from("notifications").update({ read: true }).eq("id", item.id) : await supabase.from("social_notifications").update({ read_at: new Date().toISOString() }).eq("id", item.id); if (e) setError("That notification could not be marked as read."); else setItems((current) => current.map((x) => x.id === item.id && x.source === item.source ? { ...x, read: true } : x)); setWorking(false); };
  const markAllRead = async () => { const unread = items.filter((x) => !x.read); if (!unread.length) return; setWorking(true); await Promise.all([supabase.from("notifications").update({ read: true }).eq("read", false), supabase.from("social_notifications").update({ read_at: new Date().toISOString() }).is("read_at", null)]); setItems((current) => current.map((x) => ({ ...x, read: true }))); setWorking(false); };
  const unreadCount = items.filter((x) => !x.read).length;
  return <AppShell><PageHeader title="Notifications" subtitle={unreadCount ? `${unreadCount} new` : "All caught up"} /><main className="flex flex-col gap-4 p-5">
    {error && <p role="alert" className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
    {loading && <p className="text-lg font-bold">Loading your notifications…</p>}
    {!loading && unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} disabled={working} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-lg font-extrabold text-primary-foreground disabled:opacity-50"><CheckCheck className="h-6 w-6" />Mark all as read</button>}
    {!loading && !items.length && <Card><p className="text-lg font-semibold">You have no notifications yet.</p><p className="mt-1 text-base font-medium text-muted-foreground">Reminders about your events, community and friends will appear here.</p></Card>}
    {items.map((item) => <div key={`${item.source}-${item.id}`} className={`rounded-3xl border-2 p-5 shadow-sm ${item.read ? "border-border bg-card" : "border-primary bg-primary/10"}`}><div className="flex items-start gap-3">{!item.read && <BellRing className="mt-1 h-6 w-6 shrink-0 text-primary" />}<div className="min-w-0"><p className="text-xl font-black">{item.title}</p>{item.body && <p className="mt-1 text-base font-semibold">{item.body}</p>}<p className="mt-1 text-sm font-semibold text-muted-foreground">{new Date(item.created_at).toLocaleString(undefined, { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}</p></div></div>{!item.read && <button type="button" onClick={() => void markRead(item)} disabled={working} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-lg font-bold disabled:opacity-50"><Check className="h-5 w-5" />Mark as read</button>}</div>)}
  </main></AppShell>;
}
