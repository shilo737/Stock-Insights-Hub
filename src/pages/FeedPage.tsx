import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, PenSquare, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCreatePost, useFeed } from '../lib/queries';
import type { Category } from '../types';
import FeedTabs from '../components/FeedTabs';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import Sidebar from '../components/Sidebar';
import { FeedSkeleton } from '../components/Skeletons';

const VALID: Category[] = ['news', 'insight', 'learning'];

export default function FeedPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [composing, setComposing] = useState(false);
  const [page, setPage] = useState(1);

  const tabParam = params.get('tab') as Category | null;
  const tab: Category = tabParam && VALID.includes(tabParam) ? tabParam : 'insight';
  const ticker = params.get('ticker') ?? undefined;

  const { data, isLoading, isError, error, isFetching } = useFeed({ category: tab, ticker, page });
  const create = useCreatePost();

  const setTab = (c: Category) => {
    setPage(1);
    const next = new URLSearchParams(params);
    next.set('tab', c);
    setParams(next, { replace: true });
  };

  const clearTicker = () => {
    setPage(1);
    const next = new URLSearchParams(params);
    next.delete('ticker');
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Left sidebar (stacks below the feed on small screens) */}
      <aside className="order-2 lg:order-1">
        <Sidebar />
      </aside>

      <main className="order-1 min-w-0 space-y-4 lg:order-2">
        <FeedTabs active={tab} ticker={ticker} onChange={setTab} />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {ticker && (
              <button
                onClick={clearTicker}
                className="ltr inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-3 py-1 font-mono text-xs font-semibold text-sky-300 hover:bg-sky-500/25"
              >
                ${ticker} <X size={12} />
              </button>
            )}
            {isFetching && !isLoading && <span className="text-xs">מתעדכן…</span>}
          </div>
          {user ? (
            <button className="btn-primary" onClick={() => setComposing((v) => !v)}>
              <PenSquare size={16} /> פוסט חדש
            </button>
          ) : (
            <Link to="/login" className="btn-ghost text-sm">
              התחבר כדי לפרסם
            </Link>
          )}
        </div>

        {composing && user && (
          <PostForm
            defaultCategory={tab}
            pending={create.isPending}
            error={create.error?.message}
            onCancel={() => setComposing(false)}
            onSubmit={(input) =>
              create.mutate(input, {
                onSuccess: () => {
                  setComposing(false);
                  setPage(1);
                  // jump to the tab the post landed in
                  if (input.category !== tab) setTab(input.category);
                },
              })
            }
          />
        )}

        {isLoading ? (
          <FeedSkeleton />
        ) : isError ? (
          <div className="card p-6 text-center text-rose-400">
            {(error as Error).message}
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="card p-10 text-center text-slate-400">
            עדיין אין כאן פוסטים. היה הראשון לשתף משהו.
          </div>
        ) : (
          <div className="space-y-4">
            {data?.items.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              className="btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronRight size={16} /> הקודם
            </button>
            <span className="font-mono text-sm text-slate-400">
              {data.page} / {data.totalPages}
            </span>
            <button
              className="btn-ghost"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              הבא <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
