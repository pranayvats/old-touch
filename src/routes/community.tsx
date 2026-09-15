import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Users, X, CalendarDays, MapPin, Check, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/community")({ component: CommunityScreen });

type Post = { id: string; user_id: string; content: string; created_at: string; author?: { full_name: string; city: string | null } | null };
type Invite = { id: string; status: string; rejection_reason: string | null; event: { id: string; name: string; description: string | null; starts_at: string; ends_at: string | null; location_name: string; host?: { full_name: string } | null } };

function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [rejecting, setRejecting] = useState<Invite | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadPosts = async () => {
    const { data, error } = await supabase.from("community_posts").select("id,user_id,content,created_at,profiles!community_posts_user_id_fkey(full_name,city)").order("created_at", { ascending: false });
    if (error) { setError(error.message); return; }
    setPosts((data ?? []).map((row: any) => ({ ...row, author: row.profiles })));
  };

  const loadInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: inviteError } = await supabase.from("event_invites")
      .select("id,status,rejection_reason,event:events!event_invites_event_id_fkey(id,name,description,starts_at,ends_at,location_name,host:profiles!events_host_id_fkey(full_name))")
      .eq("invitee_id", user.id).order("created_at", { ascending: false });
    if (inviteError) { setError(inviteError.message); return; }
    setInvites((data ?? []) as unknown as Invite[]);
  };

  useEffect(() => {
    void (async () => { setLoading(true); await Promise.all([loadPosts(), loadInvites()]); setLoading(false); })();
    const channel = supabase.channel("community-and-events-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string })?.id;
          if (id) setPosts((current) => current.filter((post) => post.id !== id));
        } else void loadPosts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_invites" }, () => void loadInvites())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const createPost = async () => {
    const text = content.trim();
    if (!text || posting) return;
    setPosting(true); setError("");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setError("Please log in again to post."); setPosting(false); return; }
    const { data: inserted, error: insertError } = await supabase.from("community_posts").insert({ user_id: user.id, content: text }).select("id,user_id,content,created_at,profiles!community_posts_user_id_fkey(full_name,city)").single();
    if (insertError) { setError(`Could not post: ${insertError.message}`); setPosting(false); return; }
    const newPost: Post = { ...(inserted as any), author: (inserted as any).profiles };
    setPosts((current) => [newPost, ...current.filter((post) => post.id !== newPost.id)]);
    setContent(""); setPosting(false);
  };

  const deletePost = async (id: string) => {
    setError("");
    if (deletingId) return;
    setDeletingId(id);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setError("Please log in again to delete this post."); setDeletingId(null); return; }
    const { data: deletedRows, error: deleteError } = await supabase.from("community_posts").delete().eq("id", id).eq("user_id", user.id).select("id");
    if (deleteError) { setError(`Could not delete post: ${deleteError.message}`); setDeletingId(null); return; }
    if (!deletedRows?.length) { setError("Could not delete this post. You can only delete your own posts."); setDeletingId(null); return; }
    setPosts((current) => current.filter((post) => post.id !== id));
    setPostToDelete(null); setDeletingId(null);
  };

  const acceptInvite = async (invite: Invite) => {
    setInviteBusyId(invite.id); setError("");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setError("Please log in again to respond to this invitation."); setInviteBusyId(null); return; }
    const { error: updateError } = await supabase.from("event_invites").update({ status: "accepted", rejection_reason: null }).eq("id", invite.id).eq("invitee_id", user.id).eq("status", "pending");
    if (updateError) setError(`Could not accept invitation: ${updateError.message}`);
    else setInvites((current) => current.map((x) => x.id === invite.id ? { ...x, status: "accepted", rejection_reason: null } : x));
    setInviteBusyId(null);
  };

  const rejectInvite = async () => {
    if (!rejecting || !rejectReason || inviteBusyId) return;
    const reason = rejectReason === "Other" ? otherReason.trim() : rejectReason;
    if (!reason) return;
    setInviteBusyId(rejecting.id); setError("");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setError("Please log in again to respond to this invitation."); setInviteBusyId(null); return; }
    const { error: updateError } = await supabase.from("event_invites").update({ status: "rejected", rejection_reason: reason }).eq("id", rejecting.id).eq("invitee_id", user.id).eq("status", "pending");
    if (updateError) setError(`Could not reject invitation: ${updateError.message}`);
    else setInvites((current) => current.map((x) => x.id === rejecting.id ? { ...x, status: "rejected", rejection_reason: reason } : x));
    setInviteBusyId(null); setRejecting(null); setRejectReason(""); setOtherReason("");
  };

  const pendingInvites = invites.filter((invite) => invite.status === "pending");

  return <AppShell><PageHeader title="My Community" subtitle="People and news near you" /><main className="flex flex-col gap-4 p-5">
    {pendingInvites.map((invite) => <Card key={invite.id}><div className="flex items-center gap-2 text-xl font-black text-primary"><CalendarDays className="h-6 w-6" /> Meet Up</div><h2 className="mt-3 text-2xl font-black">{invite.event.name}</h2><p className="mt-1 text-lg font-bold">Hosted by {invite.event.host?.full_name || "Community member"}</p><p className="mt-2 flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5" />{formatEventDate(invite.event.starts_at, invite.event.ends_at)}</p><p className="mt-1 flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" />{invite.event.location_name}</p>{invite.event.description && <p className="mt-2 text-lg leading-relaxed">{invite.event.description}</p>}<div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => void acceptInvite(invite)} disabled={!!inviteBusyId} className="rounded-3xl bg-primary px-5 py-4 text-lg font-extrabold text-primary-foreground disabled:opacity-50"><Check className="mr-2 inline h-5 w-5" />Accept</button><button type="button" onClick={() => setRejecting(invite)} disabled={!!inviteBusyId} className="rounded-3xl bg-black px-5 py-4 text-lg font-extrabold text-white disabled:opacity-50"><RotateCcw className="mr-2 inline h-5 w-5" />Reject</button></div></Card>)}
    <Card><div className="flex items-center gap-2 text-xl font-extrabold"><Plus className="h-6 w-6" /> Share with your community</div><FormField label="Your message" placeholder="What would you like to tell your community?" value={content} onChange={setContent} multiline /><button type="button" onClick={createPost} disabled={!content.trim() || posting} className="mt-4 w-full rounded-3xl bg-primary px-6 py-4 text-xl font-extrabold text-primary-foreground disabled:opacity-50">{posting ? "Posting…" : "Post"}</button></Card>
    {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
    {loading ? <p className="p-4 text-lg font-semibold">Loading community…</p> : posts.length === 0 ? <Card><p className="text-lg font-semibold">No posts yet. Be the first to share something!</p></Card> : posts.map((post) => <Card key={post.id}><div className="flex items-center gap-2 text-base font-bold text-primary"><Users className="h-5 w-5" /><span>{post.author?.city || "Your community"}</span></div><p className="mt-2 text-lg font-black">{post.author?.full_name || "Community member"}</p><p className="mt-1 text-lg leading-relaxed">{post.content}</p><div className="mt-3 flex items-center justify-between gap-3"><p className="text-base font-semibold text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p><DeleteOwnPost post={post} deleting={deletingId === post.id} onDelete={() => setPostToDelete(post)} /></div></Card>)}
  </main>
  {postToDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" role="dialog" aria-modal="true"><Card><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black">Delete this post?</h2><p className="mt-2 text-lg font-semibold text-muted-foreground">This post will be permanently removed.</p></div><button type="button" aria-label="Close" onClick={() => setPostToDelete(null)} disabled={!!deletingId} className="rounded-full p-2"><X className="h-6 w-6" /></button></div><div className="mt-5 flex gap-3"><button type="button" onClick={() => setPostToDelete(null)} disabled={!!deletingId} className="flex-1 rounded-3xl bg-black px-5 py-4 text-lg font-extrabold text-white disabled:opacity-50">Cancel</button><button type="button" onClick={() => void deletePost(postToDelete.id)} disabled={!!deletingId} className="flex-1 rounded-3xl bg-red-600 px-5 py-4 text-lg font-extrabold text-white disabled:opacity-50">{deletingId ? "Deleting…" : "Delete"}</button></div></Card></div>}
  {rejecting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" role="dialog" aria-modal="true"><Card><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black">Why can't you make it?</h2><p className="mt-2 text-lg font-semibold text-muted-foreground">Choose a reason for declining this invitation.</p></div><button type="button" aria-label="Close" onClick={() => { setRejecting(null); setRejectReason(""); setOtherReason(""); }} className="rounded-full p-2"><X className="h-6 w-6" /></button></div><div className="mt-5 flex flex-col gap-2">{["I'm sick","I'm outside at that time","I'm meeting family","Other"].map((reason) => <button key={reason} type="button" onClick={() => setRejectReason(reason)} className={`rounded-2xl border-2 p-4 text-left text-lg font-bold ${rejectReason === reason ? "border-primary bg-primary/10" : "border-border"}`}>{rejectReason === reason ? "✓ " : "○ "}{reason}</button>)}</div>{rejectReason === "Other" && <FormField label="Reason" placeholder="Tell us why" value={otherReason} onChange={setOtherReason} multiline />}<div className="mt-5 flex gap-3"><button type="button" onClick={() => { setRejecting(null); setRejectReason(""); setOtherReason(""); }} className="flex-1 rounded-3xl bg-black px-5 py-4 text-lg font-extrabold text-white">Cancel</button><button type="button" onClick={() => void rejectInvite()} disabled={!rejectReason || (rejectReason === "Other" && !otherReason.trim()) || !!inviteBusyId} className="flex-1 rounded-3xl bg-red-600 px-5 py-4 text-lg font-extrabold text-white disabled:opacity-50">Reject</button></div></Card></div>}
  </AppShell>;
}

function formatEventDate(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const date = start.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const startTime = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!endsAt) return `${date} · ${startTime}`;
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${startTime}–${endTime}`;
}

function DeleteOwnPost({ post, deleting, onDelete }: { post: Post; deleting: boolean; onDelete: () => void }) {
  const [own, setOwn] = useState(false);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setOwn(data.user?.id === post.user_id)); }, [post.user_id]);
  if (!own) return null;
  return <button type="button" aria-label="Delete post" disabled={deleting} onClick={onDelete} className="rounded-2xl border px-4 py-2 font-bold disabled:opacity-50"><Trash2 className="inline h-5 w-5" /> {deleting ? "Deleting…" : "Delete"}</button>;
}
