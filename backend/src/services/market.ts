import { config } from '../config';

export interface MockTicker {
  symbol: string;
  name: string;
  basePrice: number; // admin-editable anchor price
  price: number;
  prevClose: number;
  changePct: number; // vs prevClose
  volatility: number; // per-tick std-dev (fraction)
  history: number[]; // last N prices for sparklines
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  active: boolean;
  createdAt: string;
  voters: Set<string>; // userIds that already voted
}

export interface MockState {
  tickers: Map<string, MockTicker>;
  polls: Poll[];
  dailyTip: { text: string; updatedAt: string };
}

const HISTORY_LEN = 40;

const SEED: Array<[string, string, number, number]> = [
  // symbol, name, price, volatility
  ['^GSPC', 'מדד S&P 500', 5950, 0.0006],
  ['^IXIC', 'מדד נאסד"ק', 19400, 0.0008],
  ['^DJI', 'מדד דאו ג\'ונס', 43800, 0.0005],
  ['^RUT', 'מדד ראסל 2000', 2290, 0.0009],
  ['AAPL', 'אפל', 228.5, 0.0012],
  ['MSFT', 'מיקרוסופט', 421.3, 0.0011],
  ['NVDA', 'אנבידיה', 141.7, 0.0025],
  ['TSLA', 'טסלה', 352.4, 0.003],
  ['AMZN', 'אמזון', 206.2, 0.0014],
  ['GOOGL', 'אלפבית (גוגל)', 177.8, 0.0013],
  ['META', 'מטא', 592.1, 0.0016],
  ['AMD', 'AMD', 138.9, 0.002],
  ['NFLX', 'נטפליקס', 904.6, 0.0018],
  ['JPM', 'ג\'יי פי מורגן', 248.3, 0.001],
  ['BTC-USD', 'ביטקוין', 97500, 0.004],
  ['ETH-USD', 'את\'ריום', 3450, 0.005],
  ['SPY', 'קרן סל S&P 500', 592.4, 0.0006],
  ['QQQ', 'קרן סל נאסד"ק 100', 512.8, 0.0008],
  ['GLD', 'קרן סל זהב', 245.6, 0.0007],
  ['TLT', 'אג"ח ממשלתי ארוך (TLT)', 91.2, 0.0006],
];

function makeTicker(
  symbol: string,
  name: string,
  price: number,
  volatility: number,
): MockTicker {
  const history: number[] = [price];
  return {
    symbol,
    name,
    basePrice: price,
    price,
    prevClose: price,
    changePct: 0,
    volatility,
    history,
  };
}

/** Standard normal via Box-Muller */
function randn(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function round(n: number): number {
  return n >= 1000 ? Math.round(n * 10) / 10 : Math.round(n * 100) / 100;
}

export const MOCK_STATE: MockState = {
  tickers: new Map(),
  polls: [],
  dailyTip: {
    text: 'פיזור הוא הארוחה החינמית היחידה בהשקעות. לעולם אל תיקח פוזיציה כל כך גדולה שיום רע אחד משנה לך את התוכניות.',
    updatedAt: new Date().toISOString(),
  },
};

function initTickers(): void {
  for (const [symbol, name, price, vol] of SEED) {
    const t = makeTicker(symbol, name, price, vol);
    // Warm up history so sparklines are not empty on first load
    for (let i = 0; i < HISTORY_LEN - 1; i++) stepTicker(t, false);
    t.prevClose = t.history[0];
    t.changePct = ((t.price - t.prevClose) / t.prevClose) * 100;
    MOCK_STATE.tickers.set(symbol, t);
  }
}

/**
 * Random walk with mild mean reversion towards basePrice,
 * so prices wander but never drift off to infinity.
 */
function stepTicker(t: MockTicker, recomputePct = true): void {
  const reversion = ((t.basePrice - t.price) / t.basePrice) * 0.02;
  const shock = randn() * t.volatility;
  const next = Math.max(0.01, t.price * (1 + shock + reversion));
  t.price = round(next);
  t.history.push(t.price);
  if (t.history.length > HISTORY_LEN) t.history.shift();
  if (recomputePct) {
    t.changePct = Math.round(((t.price - t.prevClose) / t.prevClose) * 10000) / 100;
  }
}

export function tickMarket(): void {
  for (const t of MOCK_STATE.tickers.values()) stepTicker(t);
}

let timer: NodeJS.Timeout | null = null;

export function startMarketSimulation(): void {
  if (MOCK_STATE.tickers.size === 0) initTickers();
  if (MOCK_STATE.polls.length === 0) {
    MOCK_STATE.polls.push({
      id: cryptoId(),
      question: 'איפה יסגור מדד S&P 500 את השבוע?',
      options: [
        { id: 'a', text: 'גבוה יותר', votes: 0 },
        { id: 'b', text: 'ללא שינוי', votes: 0 },
        { id: 'c', text: 'נמוך יותר', votes: 0 },
      ],
      active: true,
      createdAt: new Date().toISOString(),
      voters: new Set(),
    });
  }
  if (timer) return;
  timer = setInterval(tickMarket, config.marketTickMs);
  timer.unref();
}

export function cryptoId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export interface PublicTicker {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  basePrice: number;
  sparkline: number[];
}

export function toPublic(t: MockTicker): PublicTicker {
  return {
    symbol: t.symbol,
    name: t.name,
    price: t.price,
    changePct: t.changePct,
    basePrice: t.basePrice,
    sparkline: t.history,
  };
}

export function listTickers(): PublicTicker[] {
  return [...MOCK_STATE.tickers.values()].map(toPublic);
}

export function addTicker(
  symbol: string,
  name: string,
  price: number,
  volatility = 0.0015,
): PublicTicker {
  const sym = symbol.toUpperCase();
  if (MOCK_STATE.tickers.has(sym)) throw new Error('הטיקר כבר קיים');
  const t = makeTicker(sym, name, price, volatility);
  for (let i = 0; i < HISTORY_LEN - 1; i++) stepTicker(t, false);
  t.prevClose = t.history[0];
  t.changePct = ((t.price - t.prevClose) / t.prevClose) * 100;
  MOCK_STATE.tickers.set(sym, t);
  return toPublic(t);
}

export function updateTickerBase(
  symbol: string,
  fields: { basePrice?: number; name?: string; volatility?: number },
): PublicTicker | null {
  const t = MOCK_STATE.tickers.get(symbol.toUpperCase());
  if (!t) return null;
  if (fields.name) t.name = fields.name;
  if (fields.volatility !== undefined) t.volatility = fields.volatility;
  if (fields.basePrice !== undefined) {
    t.basePrice = fields.basePrice;
    t.price = fields.basePrice;
    t.prevClose = fields.basePrice;
    t.changePct = 0;
    t.history = [fields.basePrice];
  }
  return toPublic(t);
}

export function deleteTicker(symbol: string): boolean {
  return MOCK_STATE.tickers.delete(symbol.toUpperCase());
}

export function getActivePoll(): Poll | undefined {
  return MOCK_STATE.polls.find((p) => p.active);
}

export function serializePoll(p: Poll, userId?: string) {
  const total = p.options.reduce((s, o) => s + o.votes, 0);
  return {
    id: p.id,
    question: p.question,
    totalVotes: total,
    options: p.options.map((o) => ({ ...o })),
    hasVoted: userId ? p.voters.has(userId) : false,
    active: p.active,
    createdAt: p.createdAt,
  };
}
