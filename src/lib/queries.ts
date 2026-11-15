import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { api } from './api';
import type {
  Category,
  Poll,
  PostComment,
  PostInput,
  PostsPage,
  SidebarData,
  Ticker,
} from '../types';

export const STALE_2_MIN = 2 * 60 * 1000;

export interface FeedFilters {
  category: Category;
  ticker?: string;
  page: number;
}

export const keys = {
  feed: (f: FeedFilters) => ['feed', f.category, f.ticker ?? '', f.page] as const,
  feedAll: ['feed'] as const,
  sidebar: ['sidebar'] as const,
  tickers: ['tickers'] as const,
  comments: (postId: string) => ['comments', postId] as const,
};

function feedUrl(f: FeedFilters) {
  const p = new URLSearchParams({ category: f.category, page: String(f.page), limit: '10' });
  if (f.ticker) p.set('ticker', f.ticker);
  return `/posts?${p.toString()}`;
}

export function feedQueryOptions(f: FeedFilters) {
  return {
    queryKey: keys.feed(f),
    queryFn: () => api<PostsPage>(feedUrl(f)),
    staleTime: STALE_2_MIN,
  };
}

/** Warm the cache for a tab (used on hover). */
export function prefetchFeed(qc: QueryClient, f: FeedFilters) {
  return qc.prefetchQuery(feedQueryOptions(f));
}

export function useFeed(f: FeedFilters) {
  return useQuery({ ...feedQueryOptions(f), placeholderData: (prev) => prev });
}

export function useSidebar() {
  return useQuery({
    queryKey: keys.sidebar,
    queryFn: () => api<SidebarData>('/dashboard/sidebar'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useTickers() {
  return useQuery({
    queryKey: keys.tickers,
    queryFn: () => api<Ticker[]>('/market/tickers'),
    staleTime: 0,
    refetchInterval: 3_000,
  });
}

export function useComments(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.comments(postId),
    queryFn: () => api<PostComment[]>(`/posts/${postId}/comments`),
    enabled,
    staleTime: 30_000,
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { content: string; parentId?: string | null }) =>
      api<PostComment>(`/posts/${postId}/comments`, { method: 'POST', body: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.comments(postId) });
      qc.invalidateQueries({ queryKey: keys.feedAll });
    },
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      api<void>(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.comments(postId) });
      qc.invalidateQueries({ queryKey: keys.feedAll });
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      api<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`, { method: 'POST' }),
    onSuccess: (data, postId) => {
      // Patch every cached feed page in place – no refetch needed.
      qc.setQueriesData<PostsPage>({ queryKey: keys.feedAll }, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((p) =>
                p.id === postId ? { ...p, likedByMe: data.liked, likeCount: data.likeCount } : p,
              ),
            }
          : old,
      );
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) => api('/posts', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.feedAll });
      qc.invalidateQueries({ queryKey: keys.sidebar });
    },
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PostInput> }) =>
      api(`/posts/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.feedAll });
      qc.invalidateQueries({ queryKey: keys.sidebar });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.feedAll });
      qc.invalidateQueries({ queryKey: keys.sidebar });
    },
  });
}

export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      api<Poll>(`/market/poll/${pollId}/vote`, { method: 'POST', body: { optionId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sidebar }),
  });
}
