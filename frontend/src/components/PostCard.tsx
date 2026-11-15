import { memo, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CornerUpLeft, Heart, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  useAddComment,
  useComments,
  useDeleteComment,
  useDeletePost,
  useSidebar,
  useToggleLike,
  useUpdatePost,
} from '../lib/queries';
import { timeAgo } from '../lib/format';
import type { Post, PostComment } from '../types';
import SentimentBadge from './SentimentBadge';
import PostForm from './PostForm';
import RichText from './RichText';

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-600 text-sm font-bold uppercase text-white"
    >
      {name.slice(0, 1)}
    </div>
  );
}

/** תגית "מוביל" למשתמשים שנמצאים בטופ 3 השבועי */
function useTopLeaderIds(): Set<string> {
  const { data } = useSidebar();
  return useMemo(
    () => new Set((data?.topContributors.week ?? []).slice(0, 3).map((l) => l.userId)),
    [data],
  );
}

function LeaderTag() {
  return (
    <span className="ms-2 rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-400">
      🏆 מוביל
    </span>
  );
}

function CommentBox({
  placeholder,
  pending,
  error,
  autoFocus,
  onSubmit,
  onCancel,
  submitLabel = 'שליחה',
}: {
  placeholder: string;
  pending: boolean;
  error?: string | null;
  autoFocus?: boolean;
  submitLabel?: string;
  onSubmit: (text: string, done: () => void) => void;
  onCancel?: () => void;
}) {
  const [text, setText] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim(), () => setText(''));
  };
  return (
    <form onSubmit={submit} className="space-y-1">
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          autoFocus={autoFocus}
        />
        <button className="btn-primary" disabled={pending || !text.trim()}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            ביטול
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </form>
  );
}

function CommentItem({
  c,
  postId,
  isReply,
  leaders,
  replyingTo,
  setReplyingTo,
}: {
  c: PostComment;
  postId: string;
  isReply: boolean;
  leaders: Set<string>;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
}) {
  const { user } = useAuth();
  const add = useAddComment(postId);
  const del = useDeleteComment(postId);
  const canDelete = !!user && (user.id === c.author.id || user.role === 'ADMIN');

  return (
    <div>
      <div className="flex gap-2">
        <Avatar name={c.author.username} size={isReply ? 28 : 32} />
        <div className="min-w-0 flex-1">
          <div className="rounded-lg bg-slate-900/70 px-3 py-2">
            <div className="text-xs text-slate-400">
              <span className="ltr font-semibold text-slate-200">@{c.author.username}</span>
              {leaders.has(c.author.id) && <LeaderTag />}
              <span className="mx-1">·</span>
              {timeAgo(c.createdAt)}
            </div>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">
              {c.replyToUser && (
                <span className="ltr me-1.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-xs font-semibold text-sky-400">
                  @{c.replyToUser.username}
                </span>
              )}
              <RichText text={c.content} />
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3 px-1 text-xs text-slate-500">
            {user && (
              <button
                className="inline-flex items-center gap-1 hover:text-sky-400"
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
              >
                <CornerUpLeft size={12} /> השב
              </button>
            )}
            {canDelete && (
              <button
                className="hover:text-rose-400"
                disabled={del.isPending}
                onClick={() => window.confirm('למחוק את התגובה?') && del.mutate(c.id)}
              >
                מחק
              </button>
            )}
          </div>

          {replyingTo === c.id && (
            <div className="mt-2">
              <div className="mb-1 text-xs text-slate-400">
                משיב ל-<span className="ltr font-semibold text-sky-400">@{c.author.username}</span>
                {' '}(הוא יתויג בתגובה)
              </div>
              <CommentBox
                autoFocus
                placeholder="כתוב תגובה…"
                pending={add.isPending}
                error={add.error?.message}
                onCancel={() => setReplyingTo(null)}
                onSubmit={(text) =>
                  add.mutate(
                    { content: text, parentId: c.id },
                    { onSuccess: () => setReplyingTo(null) },
                  )
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Comments({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { data, isLoading } = useComments(postId, true);
  const add = useAddComment(postId);
  const leaders = useTopLeaderIds();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { roots, repliesByRoot } = useMemo(() => {
    const roots: PostComment[] = [];
    const map = new Map<string, PostComment[]>();
    for (const c of data ?? []) {
      if (!c.parentId) roots.push(c);
      else map.set(c.parentId, [...(map.get(c.parentId) ?? []), c]);
    }
    return { roots, repliesByRoot: map };
  }, [data]);

  return (
    <div className="mt-3 space-y-4 border-t border-slate-700/50 pt-3">
      {isLoading && <div className="h-4 w-1/2 animate-pulse rounded bg-slate-700" />}

      {roots.map((c) => (
        <div key={c.id} className="space-y-2">
          <CommentItem
            c={c}
            postId={postId}
            isReply={false}
            leaders={leaders}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
          />
          {(repliesByRoot.get(c.id) ?? []).length > 0 && (
            <div className="me-0 ms-10 space-y-2 border-s-2 border-slate-700/60 ps-3">
              {repliesByRoot.get(c.id)!.map((r) => (
                <CommentItem
                  key={r.id}
                  c={r}
                  postId={postId}
                  isReply
                  leaders={leaders}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {data?.length === 0 && <p className="text-sm text-slate-500">עדיין אין תגובות.</p>}

      {user ? (
        <CommentBox
          placeholder="כתוב תגובה…"
          pending={add.isPending}
          error={add.error?.message}
          onSubmit={(text, done) => add.mutate({ content: text }, { onSuccess: done })}
        />
      ) : (
        <p className="text-sm text-slate-500">
          <Link to="/login" className="text-emerald-400 hover:underline">
            התחבר
          </Link>{' '}
          כדי להגיב.
        </p>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const like = useToggleLike();
  const del = useDeletePost();
  const update = useUpdatePost();
  const leaders = useTopLeaderIds();
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);

  const canManage = !!user && (user.id === post.author.id || user.role === 'ADMIN');

  if (editing) {
    return (
      <PostForm
        defaultCategory={post.category}
        initial={post}
        submitLabel="שמירת שינויים"
        pending={update.isPending}
        error={update.error?.message}
        onCancel={() => setEditing(false)}
        onSubmit={(input) =>
          update.mutate({ id: post.id, input }, { onSuccess: () => setEditing(false) })
        }
      />
    );
  }

  return (
    <article className="card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={post.author.username} />
          <div>
            <div className="text-sm font-semibold">
              <span className="ltr">@{post.author.username}</span>
              {post.author.role === 'ADMIN' && (
                <span className="ms-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  מנהל
                </span>
              )}
              {leaders.has(post.author.id) && <LeaderTag />}
            </div>
            <div className="text-xs text-slate-500">{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.ticker && (
            <Link
              to={`/?tab=${post.category}&ticker=${encodeURIComponent(post.ticker)}`}
              className="ltr rounded-md bg-slate-700/60 px-2 py-0.5 font-mono text-xs font-semibold text-sky-300 hover:bg-slate-700"
            >
              ${post.ticker}
            </Link>
          )}
          {post.sentiment && <SentimentBadge sentiment={post.sentiment} />}
        </div>
      </header>

      <h2 className="mt-3 text-lg font-semibold leading-snug">{post.title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
        <RichText text={post.content} maxLength={280}/>
      </p>

      <footer className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            className={`btn-ghost px-2.5 py-1.5 ${post.likedByMe ? 'text-rose-400' : ''}`}
            disabled={!user || like.isPending}
            onClick={() => like.mutate(post.id)}
            title={user ? 'לייק' : 'התחבר כדי לתת לייק'}
          >
            <Heart size={16} fill={post.likedByMe ? 'currentColor' : 'none'} /> {post.likeCount}
          </button>
          <button
            className="btn-ghost px-2.5 py-1.5"
            onClick={() => setShowComments((v) => !v)}
            aria-expanded={showComments}
          >
            <MessageCircle size={16} /> {post.commentCount} תגובות
          </button>
        </div>
        {canManage && (
          <div className="flex items-center gap-1">
            <button className="btn-ghost px-2.5 py-1.5" onClick={() => setEditing(true)} title="עריכה">
              <Pencil size={15} />
            </button>
            <button
              className="btn-ghost px-2.5 py-1.5 hover:text-rose-400"
              disabled={del.isPending}
              onClick={() => {
                if (window.confirm('למחוק את הפוסט?')) del.mutate(post.id);
              }}
              title="מחיקה"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </footer>

      {showComments && <Comments postId={post.id} />}
    </article>
  );
}

export default memo(PostCard);
