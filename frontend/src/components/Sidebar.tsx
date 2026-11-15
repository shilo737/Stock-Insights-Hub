import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Lightbulb, Trophy, Vote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar, useVote } from '../lib/queries';
import { fmtPct, fmtPrice } from '../lib/format';
import Sparkline from './Sparkline';
import { SidebarSkeleton } from './Skeletons';
import type { Leader } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];

function Leaderboard({ day, week }: { day: Leader[]; week: Leader[] }) {
  const [period, setPeriod] = useState<'day' | 'week'>('week');
  const list = period === 'day' ? day : week;

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400">
          <Trophy size={16} className="text-yellow-400" /> מובילי הקהילה
        </h3>
        <div className="flex rounded-lg bg-slate-900 p-0.5 text-xs">
          {(['day', 'week'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                period === p ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'day' ? 'יומי' : 'שבועי'}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-3 text-center text-sm text-slate-500">
          עדיין אין פרסומים בתקופה הזו. מי יהיה הראשון? 🚀
        </p>
      ) : (
        <ol className="space-y-1.5">
          {list.map((l) => (
            <li
              key={l.userId}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 ${
                l.rank === 1
                  ? 'bg-gradient-to-l from-yellow-500/15 to-transparent ring-1 ring-yellow-500/30'
                  : 'bg-slate-900/50'
              }`}
            >
              <span className="w-6 text-center text-lg">{MEDALS[l.rank - 1] ?? l.rank}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  <span className="ltr">@{l.username}</span>
                </div>
                {l.rank === 1 && (
                  <div className="text-[11px] font-medium text-yellow-400">הכותב המוביל</div>
                )}
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {l.posts} {l.posts === 1 ? 'פוסט' : 'פוסטים'}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-center text-xs text-slate-500">
        מי שמפרסם הכי הרבה {period === 'day' ? 'ב-24 השעות האחרונות' : 'ב-7 הימים האחרונים'} עולה לטבלה
      </p>
    </section>
  );
}

export default function Sidebar() {
  const { data, isLoading } = useSidebar();
  const { user } = useAuth();
  const vote = useVote();

  if (isLoading || !data) return <SidebarSkeleton />;
  const { hotStocks, poll, dailyTip, topContributors } = data;

  return (
    <div className="space-y-4">
      {/* מניות חמות */}
      <section className="card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
          <Flame size={16} className="text-orange-400" /> מניות חמות בקהילה
        </h3>
        <ul className="divide-y divide-slate-700/50">
          {hotStocks.map((s) => {
            const up = (s.changePct ?? 0) >= 0;
            return (
              <li key={s.ticker}>
                <Link
                  to={`/?tab=insight&ticker=${encodeURIComponent(s.ticker)}`}
                  className="flex items-center justify-between gap-2 py-2 hover:bg-slate-700/20"
                >
                  <div>
                    <div className="ltr font-mono text-sm font-semibold">${s.ticker}</div>
                    <div className="text-xs text-slate-500">
                      {s.mentions > 0 ? `${s.mentions} פוסטים השבוע` : 'תנודתית היום'}
                    </div>
                  </div>
                  <Sparkline data={s.sparkline} width={56} height={20} />
                  <div className="text-end font-mono text-xs" dir="ltr">
                    <div>{s.price != null ? fmtPrice(s.price) : '—'}</div>
                    {s.changePct != null && (
                      <div className={up ? 'text-emerald-400' : 'text-rose-400'}>
                        {fmtPct(s.changePct)}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* סקר יומי */}
      {poll && (
        <section className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
            <Vote size={16} className="text-sky-400" /> סקר יומי
          </h3>
          <p className="mb-3 text-sm font-medium">{poll.question}</p>
          <div className="space-y-2">
            {poll.options.map((o) => {
              const pct = poll.totalVotes ? Math.round((o.votes / poll.totalVotes) * 100) : 0;
              const showResults = poll.hasVoted || !user;
              return showResults ? (
                <div key={o.id} className="relative overflow-hidden rounded-lg bg-slate-900 px-3 py-2 text-sm">
                  <div className="absolute inset-y-0 start-0 bg-sky-500/20" style={{ width: `${pct}%` }} />
                  <div className="relative flex justify-between">
                    <span>{o.text}</span>
                    <span className="font-mono text-slate-400">{pct}%</span>
                  </div>
                </div>
              ) : (
                <button
                  key={o.id}
                  disabled={vote.isPending}
                  onClick={() => vote.mutate({ pollId: poll.id, optionId: o.id })}
                  className="w-full rounded-lg border border-slate-600 px-3 py-2 text-start text-sm transition hover:border-sky-500 hover:bg-sky-500/10 disabled:opacity-50"
                >
                  {o.text}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {poll.totalVotes} הצבעות
            {!user && ' · התחבר כדי להצביע'}
          </p>
        </section>
      )}

      {/* טיפ יומי */}
      <section className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-800/80 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
          <Lightbulb size={16} /> טיפ השקעות יומי
        </h3>
        <p className="text-sm leading-relaxed text-slate-200">{dailyTip.text}</p>
      </section>

      {/* מובילי הקהילה - מתחת לטיפ */}
      <Leaderboard day={topContributors.day} week={topContributors.week} />
    </div>
  );
}
