import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/social-messages")({ component: SocialMessagesScreen });

type Profile = { id: string; full_name: string; city: string | null; avatar_url: string | null };
type Message = { id: string; sender_id: string; recipient_id: string; content: string; created_at: string };

function SocialMessagesScreen() {
  const [userId, setUserId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [target, setTarget] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = async (uid: string, other: string) => {
    const { data, error: e } = await supabase.from("social_messages").select("id,sender_id,recipient_id,content,created_at").or(`and(sender_id.eq.${uid},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${uid})`).order("created_at", { ascending: true }).limit(200);
    if (e) setError(e.message); else setMessages((data ?? []) as Message[]);
  };

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please log in again."); setLoading(false); return; }
      setUserId(user.id);
      const id = new URLSearchParams(window.location.search).get("id") || "";
      setTargetId(id);
      const { data: rels } = await supabase.from("social_friends").select("requester_id,addressee_id").eq("status", "accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      const ids = (rels ?? []).map((r: any) => r.requester_id === user.id ? r.addressee_id : r.requester_id);
      if (ids.length) { const { data: ps } = await supabase.from("profiles").select("id,full_name,city,avatar_url").in("id", ids).order("full_name"); setFriends((ps ?? []) as Profile[]); }
      if (id && ids.includes(id)) { const { data: p } = await supabase.from("profiles").select("id,full_name,city,avatar_url").eq("id", id).maybeSingle(); if (p) { setTarget(p as Profile); await loadMessages(user.id, id); } }
      else if (ids[0]) { const first = ids[0]; setTargetId(first); const { data: p } = await supabase.from("profiles").select("id,full_name,city,avatar_url").eq("id", first).maybeSingle(); if (p) { setTarget(p as Profile); await loadMessages(user.id, first); } }
      else setError("Add a friend before starting a private conversation.");
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!userId || !targetId) return;
    const channel = supabase.channel(`social-messages-${userId}-${targetId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "social_messages" }, (payload) => {
      const row = payload.new as Message;
      if ((row.sender_id === userId && row.recipient_id === targetId) || (row.sender_id === targetId && row.recipient_id === userId)) setMessages((current) => current.some((m) => m.id === row.id) ? current : [...current, row]);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, targetId]);

  const selectFriend = async (friend: Profile) => { setTarget(friend); setTargetId(friend.id); setError(""); await loadMessages(userId, friend.id); window.history.replaceState(null, "", `/social-messages?id=${friend.id}`); };
  const send = async () => {
    const text = draft.trim(); if (!text || !userId || !targetId) return;
    const { data, error: e } = await supabase.from("social_messages").insert({ sender_id: userId, recipient_id: targetId, content: text }).select("id,sender_id,recipient_id,content,created_at").single();
    if (e) setError(e.message); else { setDraft(""); if (data) setMessages((current) => current.some((m) => m.id === data.id) ? current : [...current, data as Message]); }
  };

  if (loading) return <AppShell><main className="p-5 text-xl font-bold">Loading messages…</main></AppShell>;
  return <AppShell><PageHeader title="Messages" subtitle={target?.full_name || "Private conversations"} backTo="/social" /><main className="grid gap-4 p-5 md:grid-cols-[240px_1fr]">
    <Card><h2 className="text-xl font-black">Friends</h2>{friends.length === 0 ? <p className="mt-3 font-semibold">No friends yet.</p> : friends.map((friend) => <button type="button" key={friend.id} onClick={() => void selectFriend(friend)} className={`mt-2 flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left font-bold ${friend.id === targetId ? "bg-primary/10 text-primary" : "bg-muted/50"}`}>{friend.avatar_url ? <img src={friend.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">{friend.full_name.slice(0,1)}</span>}<span>{friend.full_name}</span></button>)}</Card>
    <Card><div className="flex min-h-[55vh] flex-col"><div className="border-b pb-4">{target ? <><p className="text-2xl font-black">{target.full_name}</p><p className="font-semibold text-muted-foreground">{target.city || "Old Touch member"}</p></> : <p className="font-bold">Select a friend</p>}</div><div className="flex-1 space-y-3 overflow-y-auto py-4">{messages.length === 0 && target && <p className="text-center font-semibold text-muted-foreground">Start the conversation.</p>}{messages.map((message) => <div key={message.id} className={`flex ${message.sender_id === userId ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-3xl px-4 py-3 ${message.sender_id === userId ? "bg-primary text-primary-foreground" : "bg-muted"}`}><p className="whitespace-pre-wrap text-base font-semibold">{message.content}</p><p className="mt-1 text-xs opacity-70">{new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></div></div>)}</div>{target && <div className="flex gap-2 border-t pt-4"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Write a message…" className="min-h-14 min-w-0 flex-1 rounded-2xl border-2 bg-background px-4 text-base" /><button type="button" onClick={() => void send()} disabled={!draft.trim()} aria-label="Send message" className="min-h-14 rounded-2xl bg-primary px-5 text-primary-foreground disabled:opacity-50"><Send className="h-5 w-5" /></button></div>}</div></Card>
    {error && <p className="rounded-2xl bg-destructive/10 p-4 font-bold text-destructive md:col-span-2">{error}</p>}
    <a href="/social" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 font-extrabold md:col-span-2"><ArrowLeft className="h-5 w-5" />Back to Social</a>
  </main></AppShell>;
}
