# Stock Insights Hub – Frontend

React 18 + Vite + TypeScript + Tailwind CSS (dark mode) + TanStack Query + React Router + Lucide.

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api → http://localhost:4000)
npm run build      # production bundle in dist/
```

For a separately hosted API, set `VITE_API_URL` (e.g. `https://host/api`) at build time.

## Performance notes

- Feed queries use `staleTime: 2 min`; tabs are prefetched on hover/focus
  (`FeedTabs.tsx`), so switching tabs is instant.
- Ticker tape / sidebar / feed reserve fixed space and use `animate-pulse`
  skeletons to avoid layout shift.
- Likes patch the cache in place (no refetch).
