import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Plus, Trash2, TrendingUp, Vote, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { keys } from '../lib/queries';
import { fmtPct, fmtPrice } from '../lib/format';
import type { Poll, Ticker } from '../types';
import Sparkline from '../components/Sparkline';

function useRefreshPublic() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: keys.tickers });
    qc.invalidateQueries({ queryKey: keys.sidebar });
    qc.invalidateQueries({ queryKey: ['admin'] });
  };
}

function TickersPanel() {
  const refresh = useRefreshPublic();
  const { data } = useQuery({
    queryKey: ['admin', 'tickers'],
    queryFn: () => api<Ticker[]>('/admin/tickers'),
    refetchInterval: 4000,
  });
  console.log("data" , data);
  
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});

  const add = useMutation({
    mutationFn: () =>
      api('/admin/tickers', {
        method: 'POST',
        body: { symbol, name, basePrice: Number(price) },
      }),
    onSuccess: () => {
      setSymbol('');
      setName('');
      setPrice('');
      refresh();
    },
  });
  const patch = useMutation({
    mutationFn: ({ s, basePrice }: { s: string; basePrice: number }) =>
      api(`/admin/tickers/${encodeURIComponent(s)}`, { method: 'PATCH', body: { basePrice } }),
    onSuccess: (_d, v) => {
      setEdits((e) => {
        const { [v.s]: _drop, ...rest } = e;
        return rest;
      });
      refresh();
    },
  });
  const del = useMutation({
    mutationFn: (s: string) => api<void>(`/admin/tickers/${encodeURIComponent(s)}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    add.mutate();
  };

  return (
    <section className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <TrendingUp size={18} className="text-emerald-400" /> טיקרים
      </h2>

      <form onSubmit={submit} className="mb-4 grid gap-2 sm:grid-cols-[120px_1fr_140px_auto]">
        <input className="input font-mono" placeholder="סימול (AAPL)" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
        <input className="input" placeholder="שם החברה / הנכס" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input font-mono" type="number" step="any" min="0" placeholder="מחיר בסיס" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <button className="btn-primary" disabled={add.isPending}>
          <Plus size={16} /> הוסף
        </button>
      </form>
      {add.error && <p className="mb-3 text-sm text-rose-400">{add.error.message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pe-3">סימול</th>
              <th className="pe-3">שם</th>
              <th className="pe-3 text-end">מחיר</th>
              <th className="pe-3 text-end">שינוי</th>
              <th className="pe-3">מגמה</th>
              <th className="pe-3">מחיר בסיס</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {data?.map((t) => {
              const draft = edits[t.symbol];
              return (
                <tr key={t.symbol}>
                  <td className="py-2 pe-3 font-mono font-semibold">{t.symbol}</td>
                  <td className="pe-3 text-slate-400">{t.name}</td>
                  <td className="pe-3 text-end font-mono">{fmtPrice(t.price)}</td>
                  <td className={`pe-3 text-end font-mono ${t.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmtPct(t.changePct)}
                  </td>
                  <td className="pe-3"><Sparkline data={t.sparkline} width={60} height={20} /></td>
                  <td className="pe-3">
                    <div className="flex items-center gap-2">
                      <input
                        className="input w-28 py-1 font-mono"
                        type="number"
                        step="any"
                        min="0"
                        value={draft ?? String(t.basePrice)}
                        onChange={(e) => setEdits((s) => ({ ...s, [t.symbol]: e.target.value }))}
                      />
                      {draft !== undefined && Number(draft) > 0 && (
                        <button
                          className="btn-primary px-2 py-1 text-xs"
                          onClick={() => patch.mutate({ s: t.symbol, basePrice: Number(draft) })}
                        >
                          החל
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn-ghost px-2 py-1 hover:text-rose-400"
                      onClick={() => window.confirm(`למחוק את ${t.symbol}?`) && del.mutate(t.symbol)}
                      title="מחיקה"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------- Polls ------------------------------- */
function PollsPanel() {
  const refresh = useRefreshPublic();
  const { data } = useQuery({
    queryKey: ['admin', 'polls'],
    queryFn: () => api<Poll[]>('/admin/polls'),
  });
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const create = useMutation({
    mutationFn: () =>
      api('/admin/polls', {
        method: 'POST',
        body: { question, options: options.map((o) => o.trim()).filter(Boolean) },
      }),
    onSuccess: () => {
      setQuestion('');
      setOptions(['', '']);
      refresh();
    },
  });
  const close = useMutation({
    mutationFn: (id: string) => api(`/admin/polls/${id}/close`, { method: 'POST' }),
    onSuccess: refresh,
  });
  const del = useMutation({
    mutationFn: (id: string) => api<void>(`/admin/polls/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  return (
    <section className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Vote size={18} className="text-sky-400" /> סקרים מהירים
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="mb-4 space-y-2"
      >
        <input className="input" placeholder="שאלה" value={question} onChange={(e) => setQuestion(e.target.value)} required />
        {options.map((o, i) => (
          <input
            key={i}
            className="input"
            placeholder={`אפשרות ${i + 1}`}
            value={o}
            onChange={(e) => setOptions((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
          />
        ))}
        <div className="flex gap-2">
          {options.length < 6 && (
            <button type="button" className="btn-ghost" onClick={() => setOptions((o) => [...o, ''])}>
              <Plus size={14} /> אפשרות
            </button>
          )}
          <button className="btn-primary" disabled={create.isPending}>
            פרסם סקר (מחליף את הפעיל)
          </button>
        </div>
        {create.error && <p className="text-sm text-rose-400">{create.error.message}</p>}
      </form>

      <ul className="space-y-2">
        {data?.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/70 px-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium">
                {p.question}{' '}
                {p.active && (
                  <span className="ms-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    פעיל
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                {p.options.map((o) => `${o.text}: ${o.votes}`).join(' · ')}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {p.active && (
                <button className="btn-ghost px-2 py-1" onClick={() => close.mutate(p.id)} title="סגירת הסקר">
                  <XCircle size={15} />
                </button>
              )}
              <button className="btn-ghost px-2 py-1 hover:text-rose-400" onClick={() => del.mutate(p.id)} title="מחיקה">
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------ Daily tip ----------------------------- */
function TipPanel() {
  const refresh = useRefreshPublic();
  const { data } = useQuery({
    queryKey: ['admin', 'tip'],
    queryFn: () => api<{ text: string; updatedAt: string }>('/admin/tip'),
  });
  const [text, setText] = useState('');
  useEffect(() => {
    if (data) setText(data.text);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api('/admin/tip', { method: 'PUT', body: { text } }),
    onSuccess: refresh,
  });

  return (
    <section className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Lightbulb size={18} className="text-amber-400" /> טיפ השקעות יומי
      </h2>
      <textarea className="input min-h-[90px]" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">{save.isSuccess ? 'נשמר ✓' : ''}</span>
        <button className="btn-primary" disabled={save.isPending || text.trim().length < 3} onClick={() => save.mutate()}>
          שמור טיפ
        </button>
      </div>
      {save.error && <p className="text-sm text-rose-400">{save.error.message}</p>}
    </section>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">לוח ניהול</h1>
      <p className="-mt-3 text-sm text-slate-400">
        השינויים חלים מיידית. נתוני השוק נשמרים בזיכרון השרת ויתאפסו בהפעלה מחדש שלו.
      </p>
      <TickersPanel />
      <PollsPanel />
      <TipPanel />
    </div>
  );
}
