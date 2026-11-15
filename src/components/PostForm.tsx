import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import type { Category, Post, PostInput, Sentiment } from '../types';

interface Props {
  defaultCategory: Category;
  initial?: Post;
  submitLabel?: string;
  pending?: boolean;
  error?: string | null;
  onSubmit: (input: PostInput) => void;
  onCancel?: () => void;
}

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: 'news', label: 'חדשות השוק' },
  { value: 'insight', label: 'תובנות וטיקרים' },
  { value: 'learning', label: 'למידה ושיתופי ידע' },
];

const SENTIMENTS: Array<{ value: Sentiment; label: string }> = [
  { value: 'BULLISH', label: '▲ שורי (עולה)' },
  { value: 'BEARISH', label: '▼ דובי (יורד)' },
  { value: 'NEUTRAL', label: '— ניטרלי' },
];

export default function PostForm({
  defaultCategory,
  initial,
  submitLabel = 'פרסום',
  pending,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [category, setCategory] = useState<Category>(initial?.category ?? defaultCategory);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [ticker, setTicker] = useState(initial?.ticker ?? '');
  const [sentiment, setSentiment] = useState<Sentiment | ''>(initial?.sentiment ?? '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      content,
      category,
      ticker: ticker.trim() ? ticker.trim() : null,
      sentiment: sentiment || null,
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          aria-label="קטגוריה"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          dir="ltr"
          className="input font-mono text-start"
          placeholder={category === 'insight' ? '$TICKER (חובה)' : '$TICKER (אופציונלי)'}
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          maxLength={13}
          aria-label="סימול מניה"
        />
        <select
          className="input"
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value as Sentiment | '')}
          aria-label="סנטימנט"
        >
          <option value="">סנטימנט (אופציונלי)</option>
          {SENTIMENTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <input
        className="input"
        placeholder="כותרת"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
        maxLength={200}
      />
      <textarea
        className="input min-h-[110px] resize-y"
        placeholder="שתף את הניתוח שלך… (אפשר לתייג חברים עם @שם_משתמש ומניות עם $AAPL)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            ביטול
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={pending}>
          <Send size={15} className="-scale-x-100" /> {pending ? 'שומר…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
