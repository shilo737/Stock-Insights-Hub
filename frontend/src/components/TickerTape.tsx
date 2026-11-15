import { memo } from 'react';
import { useTickers } from '../lib/queries';
import { fmtPct, fmtPrice } from '../lib/format';
import type { Ticker } from '../types';
import Sparkline from './Sparkline';

const Item = memo(function Item({ t }: { t: Ticker }) {
  const up = t.changePct >= 0;
  return (
    <span className="mx-5 inline-flex items-center gap-2 whitespace-nowrap font-mono text-xs">
      <span className="font-semibold text-slate-200">{t.symbol}</span>
      <span className="text-slate-300">{fmtPrice(t.price)}</span>
      <span className={up ? 'text-emerald-400' : 'text-rose-400'}>
        {up ? '▲' : '▼'} {fmtPct(t.changePct)}
      </span>
      <Sparkline data={t.sparkline} width={44} height={14} />
    </span>
  );
});

export default function TickerTape() {
  const { data } = useTickers();

  // dir="ltr": market tapes scroll left, and numbers read left-to-right.
  // Fixed height reserves space → no layout shift while loading.
  return (
    <div dir="ltr" className="h-9 overflow-hidden border-b border-slate-700/60 bg-slate-950">
      {!data ? (
        <div className="flex h-full animate-pulse items-center gap-6 px-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-3 w-28 rounded bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="ticker-track flex h-full w-max animate-ticker items-center">
          {/* duplicated so the -50% translate loops seamlessly */}
          {[...data, ...data].map((t, i) => (
            <Item key={`${t.symbol}-${i}`} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
