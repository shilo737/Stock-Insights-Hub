import { useQueryClient } from '@tanstack/react-query';
import { prefetchFeed } from '../lib/queries';
import type { Category } from '../types';

export const TABS: Array<{ id: Category; label: string; short: string; emoji: string }> = [
  { id: 'news', label: 'חדשות השוק', short: 'חדשות', emoji: '📰' },
  { id: 'insight', label: 'תובנות וטיקרים', short: 'תובנות', emoji: '💬' },
  { id: 'learning', label: 'למידה ושיתופי ידע', short: 'למידה', emoji: '🎓' },
];

interface Props {
  active: Category;
  ticker?: string;
  onChange: (c: Category) => void;
}

export default function FeedTabs({ active, ticker, onChange }: Props) {
  const qc = useQueryClient();

  return (
    <div role="tablist" className="flex gap-1 rounded-xl border border-slate-700/60 bg-slate-800/60 p-1">
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            // טעינה מוקדמת לפני הלחיצה כדי שהמעבר בין טאבים יהיה מיידי
            onMouseEnter={() => prefetchFeed(qc, { category: t.id, ticker, page: 1 })}
            onFocus={() => prefetchFeed(qc, { category: t.id, ticker, page: 1 })}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <span className="me-1.5">{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.short}</span>
          </button>
        );
      })}
    </div>
  );
}
