// Mutual fund data (public mfapi.in API) + SIP/SWP math for the Funds tab.
// Pure functions only — no state, no local DB, no keys/auth.

export interface FundMeta {
  code: number;
  name: string;
}

export interface NavPoint {
  date: string; // dd-mm-yyyy
  nav: string;
}

export interface FundDetail {
  code: number;
  name: string;
  house?: string;
  category?: string;
  latest: NavPoint;
  history: NavPoint[];
}

export interface Cagrs {
  y1: number | null;
  y3: number | null;
  y5: number | null;
  y10: number | null;
}

const API = "https://api.mfapi.in";

export async function searchFunds(q: string): Promise<FundMeta[]> {
  const res = await fetch(`${API}/mf/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`search HTTP ${res.status}`);
  const json: unknown = await res.json();
  if (!Array.isArray(json)) return [];
  return (json as { schemeCode: number; schemeName: string }[])
    .slice(0, 15)
    .map((f) => ({ code: f.schemeCode, name: f.schemeName }));
}

export async function fetchFund(code: number): Promise<FundDetail> {
  const res = await fetch(`${API}/mf/${code}`);
  if (!res.ok) throw new Error(`fund HTTP ${res.status}`);
  const json: {
    status?: string;
    meta?: { scheme_name?: string; fund_house?: string; scheme_category?: string };
    data?: NavPoint[];
  } = await res.json();
  if (json.status !== "SUCCESS" || !json.data || json.data.length === 0) {
    throw new Error("No NAV data");
  }
  return {
    code,
    name: json.meta?.scheme_name ?? "",
    house: json.meta?.fund_house,
    category: json.meta?.scheme_category,
    latest: json.data[0],
    history: json.data,
  };
}

function toDate(s: string): Date {
  const [d, m, y] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function cagrAt(history: NavPoint[], latestNav: string, years: number): number | null {
  const end = toDate(history[0].date);
  const target = new Date(end);
  target.setFullYear(end.getFullYear() - years);
  let best: NavPoint | null = null;
  for (let i = history.length - 1; i >= 0; i--) {
    const d = toDate(history[i].date);
    if (d <= target) {
      best = history[i];
      break;
    }
  }
  if (!best) best = history[history.length - 1];
  const startNav = Number(best.nav);
  const endNav = Number(latestNav);
  const span = (end.getTime() - toDate(best.date).getTime()) / (365.25 * 24 * 3600 * 1000);
  if (!(startNav > 0) || span < 0.9) return null;
  return (Math.pow(endNav / startNav, 1 / span) - 1) * 100;
}

export function computeCagrs(fund: FundDetail): Cagrs {
  const h = fund.history;
  const nav = fund.latest.nav;
  return {
    y1: cagrAt(h, nav, 1),
    y3: cagrAt(h, nav, 3),
    y5: cagrAt(h, nav, 5),
    y10: cagrAt(h, nav, 10),
  };
}

export function bestCagr(c: Cagrs): number | null {
  return c.y5 ?? c.y3 ?? c.y10 ?? c.y1;
}

export function sipFutureValue(p: number, annualRate: number, years: number): number {
  const n = Math.round(years * 12);
  const i = annualRate / 1200;
  if (n <= 0) return 0;
  if (i === 0) return p * n;
  return p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
}

export function simulateSip(p: number, annualRate: number, years: number): number[] {
  const n = Math.round(years * 12);
  const i = annualRate / 1200;
  const points = [0];
  let v = 0;
  for (let m = 1; m <= n; m++) {
    v = (v + p) * (1 + i);
    points.push(v);
  }
  return points;
}

export function investedSeries(p: number, years: number): number[] {
  const n = Math.round(years * 12);
  const pts = [0];
  for (let m = 1; m <= n; m++) pts.push(p * m);
  return pts;
}

export interface SwpResult {
  points: number[];
  withdrawnPts: number[];
  final: number;
  totalOut: number;
  depletedAt: number | null;
}

export function simulateSwp(
  initial: number,
  withdraw: number,
  annualRate: number,
  years: number
): SwpResult {
  const n = Math.round(years * 12);
  const i = annualRate / 1200;
  const points = [initial];
  const withdrawnPts = [0];
  let v = initial;
  let totalOut = 0;
  let depletedAt: number | null = null;
  for (let m = 1; m <= n; m++) {
    v = v * (1 + i);
    const w = Math.min(withdraw, Math.max(v, 0));
    v -= w;
    totalOut += w;
    points.push(v);
    withdrawnPts.push(totalOut);
    if (v <= 0 && depletedAt == null) depletedAt = m;
  }
  return { points, withdrawnPts, final: v, totalOut, depletedAt };
}

export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
