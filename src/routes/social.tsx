import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Send, UserPlus, UserCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/social")({ component: SocialScreen });

type Profile = { id: string; full_name: string; city: string | null; avatar_url: string | null };
type Post = { id: string; user_id: string; content: string; image_url: string | null; created_at: string; author: Profile | null; liked: boolean; likeCount: number; comments: Comment[] };
type Comment = { id: string; user_id: string; content: string; created_at: string; author: Profile | null };

function SocialScreen() {
  const [userId, setUserId] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const [content, setContent] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const load = async (uid = userId) => {
    if (!uid) return;
    const [{ data: rawPosts, error: postsError }, { data: rawPeople }, { data: rawFriends }] = await Promise.all([
      supabase.from("social_posts").select("id,user_id,content,image_url,created_at,profiles!social_posts_user_id_fkey(id,full_name,city,avatar_url)").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id,full_name,city,avatar_url").neq("id", uid).order("full_name").limit(30),
      supabase.from("social_friends").select("requester_id,addressee_id,status").or(`requester_id.eq.${uid},addressee_id.eq.${uid}`),
    ]);
    if (postsError) { setError(postsError.message); return; }
    const postIds = (rawPosts ?? []).map((p: any) => p.id);
    const [{ data: likes }, { data: comments }] = await Promise.all([
      postIds.length ? supabase.from("social_likes").select("post_id,user_id").in("post_id", postIds) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from("social_comments").select("id,post_id,user_id,content,created_at,profiles!social_comments_user_id_fkey(id,full_name,city,avatar_url)").in("post_id", postIds).order("created_at") : Promise.resolve({ data: [] as any[] }),
    ]);
    const nextPosts = (rawPosts ?? []).map((p: any) => {
      const postLikes = (likes ?? []).filter((x: any) => x.post_id === p.id);
      const postComments = (comments ?? []).filter((x: any) => x.post_id === p.id).map((x: any) => ({ ...x, author: x.profiles }));
      return { ...p, author: p.profiles, liked: postLikes.some((x: any) => x.user_id === uid), likeCount: postLikes.length, comments: postComments } as Post;
    });
    setPosts(nextPosts);
    setPeople((rawPeople ?? []) as Profile[]);
    setFriends(new Set((rawFriends ?? []).filter((x: any) => x.status === "accepted").map((x: any) => x.requester_id === uid ? x.addressee_id : x.requester_id)));
  };

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please log in again."); setLoading(false); return; }
      setUserId(user.id); await load(user.id); setLoading(false);
    })();
  }, []);

  const createPost = async () => {
    const text = content.trim(); if (!text || posting || !userId) return;
    setPosting(true); setError("");
    const { data, error: insertError } = await supabase.from("social_posts").insert({ user_id: userId, content: text }).select("id,user_id,content,image_url,created_at,profiles!social_posts_user_id_fkey(id,full_name,city,avatar_url)").single();
    if (insertError) setError(insertError.message); else { setContent(""); await load(userId); }
    setPosting(false);
  };

  const toggleLike = async (post: Post) => {
    setError("");
    if (post.liked) {
      const { error: e } = await supabase.from("social_likes").delete().eq("post_id", post.id).eq("user_id", userId); if (e) setError(e.message);
    } else {
      const { error: e } = await supabase.from("social_likes").insert({ post_id: post.id, user_id: userId }); if (e) setError(e.message);
    }
    await load(userId);
  };

  const addComment = async (postId: string) => {
    const text = (commentDrafts[postId] ?? "").trim(); if (!text) return;
    const { error: e } = await supabase.from("social_comments").insert({ post_id: postId, user_id: userId, content: text });
    if (e) setError(e.message); else setCommentDrafts((x) => ({ ...x, [postId]: "" }));
    await load(userId);
  };

  const deletePost = async (id: string) => { const { error: e } = await supabase.from("social_posts").delete().eq("id", id).eq("user_id", userId); if (e) setError(e.message); else await load(userId); };

  const addFriend = async (personId: string) => {
    const { error: e } = await supabase.from("social_friends").insert({ requester_id: userId, addressee_id: personId });
    if (e) setError(e.code === "23505" ? "A friend request already exists." : e.message); else setError("Friend request sent.");
  };

  return <AppShell><PageHeader title="Social" subtitle="Stay connected without the pressure" /><main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-5">
    <Card><div className="flex items-center gap-2 text-xl font-black"><MessageCircle className="h-6 w-6" />Share something</div><FormField label="Your post" placeholder="Share a thought, photo caption, or update…" value={content} onChange={setContent} multiline /><button type="button" onClick={() => void createPost()} disabled={!content.trim() || posting} className="mt-4 w-full rounded-3xl bg-primary px-6 py-4 text-xl font-extrabold text-primary-foreground disabled:opacity-50">{posting ? "Posting…" : "Post"}</button></Card>
    {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
    {loading ? <p className="p-4 text-lg font-semibold">Loading Social…</p> : posts.length === 0 ? <Card><p className="text-lg font-semibold">No posts yet. Share the first one.</p></Card> : posts.map((post) => <Card key={post.id}><div className="flex items-center justify-between gap-3"><div><p className="text-xl font-black">{post.author?.full_name || "Community member"}</p><p className="text-sm font-semibold text-muted-foreground">{post.author?.city || "Old Touch"} · {new Date(post.created_at).toLocaleString()}</p></div>{post.user_id === userId && <button type="button" onClick={() => void deletePost(post.id)} aria-label="Delete post" className="rounded-xl p-2"><Trash2 className="h-5 w-5" /></button>}</div><p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed">{post.content}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => void toggleLike(post)} className={`rounded-2xl border px-4 py-2 font-bold ${post.liked ? "text-primary" : ""}`}><Heart className="mr-1 inline h-5 w-5" />{post.liked ? "Liked" : "Like"}</button><span className="rounded-2xl border px-4 py-2 font-bold">{post.likeCount > 0 && post.user_id === userId ? `${post.likeCount} likes` : ""}</span></div><div className="mt-4 border-t pt-4"><div className="flex gap-2"><input value={commentDrafts[post.id] ?? ""} onChange={(e) => setCommentDrafts((x) => ({ ...x, [post.id]: e.target.value }))} placeholder="Write a comment…" className="min-w-0 flex-1 rounded-2xl border-2 bg-background px-4 py-3 text-base" /><button type="button" onClick={() => void addComment(post.id)} aria-label="Send comment" className="rounded-2xl bg-primary p-3 text-primary-foreground"><Send className="h-5 w-5" /></button></div>{post.comments.map((comment) => <div key={comment.id} className="mt-3 rounded-2xl bg-muted/50 p-3"><p className="font-bold">{comment.author?.full_name || "Community member"}</p><p>{comment.content}</p></div>)}</div></Card>)}
    <Card><div className="flex items-center gap-2 text-xl font-black"><UserPlus className="h-6 w-6" />People you may know</div>{people.length === 0 ? <p className="mt-3 font-semibold">No other members yet.</p> : people.map((person) => <div key={person.id} className="flex items-center justify-between gap-3 border-b py-4 last:border-b-0"><div><p className="font-black">{person.full_name}</p><p className="text-sm font-semibold text-muted-foreground">{person.city || "Old Touch member"}</p></div>{friends.has(person.id) ? <span className="rounded-2xl border px-4 py-2 font-bold"><UserCheck className="mr-1 inline h-5 w-5" />Friends</span> : <button type="button" onClick={() => void addFriend(person.id)} className="rounded-2xl bg-primary px-4 py-2 font-bold text-primary-foreground"><UserPlus className="mr-1 inline h-5 w-5" />Add</button>}</div>)}</Card>
  </main></AppShell>;
}
