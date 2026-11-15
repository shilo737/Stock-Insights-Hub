export type Role = 'USER' | 'ADMIN';
export type Category = 'news' | 'insight' | 'learning';
export type Sentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
}

export interface PostAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
  role?: Role;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: Category;
  ticker: string | null;
  sentiment: Sentiment | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface PostsPage {
  items: Post[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  author: PostAuthor;
  replyToUser: { id: string; username: string } | null;
}

export interface Leader {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: Role;
  posts: number;
}

export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  basePrice: number;
  sparkline: number[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  totalVotes: number;
  options: PollOption[];
  hasVoted: boolean;
  active: boolean;
  createdAt: string;
}

export interface HotStock {
  ticker: string;
  mentions: number;
  price: number | null;
  changePct: number | null;
  sparkline: number[];
}

export interface SidebarData {
  hotStocks: HotStock[];
  poll: Poll | null;
  dailyTip: { text: string; updatedAt: string };
  topContributors: { day: Leader[]; week: Leader[] };
}

export interface PostInput {
  title: string;
  content: string;
  category: Category;
  ticker?: string | null;
  sentiment?: Sentiment | null;
}
