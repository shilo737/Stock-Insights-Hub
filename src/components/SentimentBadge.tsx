import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { Sentiment } from '../types';

const STYLES: Record<Sentiment, { cls: string; label: string; Icon: typeof Minus }> = {
  BULLISH: { cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30', label: 'שורי', Icon: ArrowUpRight },
  BEARISH: { cls: 'bg-rose-500/15 text-rose-400 ring-rose-500/30', label: 'דובי', Icon: ArrowDownRight },
  NEUTRAL: { cls: 'bg-slate-500/15 text-slate-300 ring-slate-500/30', label: 'ניטרלי', Icon: Minus },
};

export default function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const { cls, label, Icon } = STYLES[sentiment];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      <Icon size={13} strokeWidth={2.5} />
      {label}
    </span>
  );
}
