import { Fragment } from 'react';
import { Link } from 'react-router-dom';

/**
 * Renders plain text and highlights @username mentions and $TICKER symbols.
 * Pure text → React nodes (no HTML injection).
 */
const TOKEN = /(@[A-Za-z0-9_.-]{3,30}|\$[A-Za-z0-9^.-]{1,12})/g;

export default function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@') && part.length > 3) {
          return (
            <span key={i} className="ltr font-semibold text-sky-400">
              {part}
            </span>
          );
        }
        if (part.startsWith('$') && part.length > 1) {
          return (
            <Link
              key={i}
              to={`/?tab=insight&ticker=${encodeURIComponent(part.slice(1).toUpperCase())}`}
              className="ltr font-mono font-semibold text-emerald-400 hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
