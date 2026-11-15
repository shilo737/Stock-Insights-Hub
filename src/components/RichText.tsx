import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';

const TOKEN = /(@[A-Za-z0-9_.-]{3,30}|\$[A-Za-z0-9^.-]{1,12})/g;

interface RichTextProps {
  text: string;
  maxLength?: number; // אורך מקסימלי להצגה לפני קיצוץ
}

export default function RichText({ text, maxLength = 250 }: RichTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // האם הטקסט ארוך מהגבול שהוגדר?
  const isLongText = text.length > maxLength;
  
  // טקסט מוצג: או המלא או חצוי
  const displayText = isLongText && !isExpanded ? text.slice(0, maxLength) + '...' : text;

  const parts = displayText.split(TOKEN);

  return (
    <div>
      <span className="whitespace-pre-wrap break-words">
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
      </span>

      {/* כפתור הצג עוד / הצג פחות */}
      {isLongText && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 block text-xs font-medium text-sky-400 hover:underline focus:outline-none"
        >
          {isExpanded ? 'הצג פחות' : 'הצג עוד'}
        </button>
      )}
    </div>
  );
}