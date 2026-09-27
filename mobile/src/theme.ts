import { createContext, useContext } from "react";

export interface T {
  bg: string;
  card: string;
  nav: string;
  border: string;
  primary: string;
  primaryDeep: string;
  onPrimary: string;
  success: string;
  danger: string;
  warning: string;
  accent: string;
  text: string;
  sub: string;
}

// Apple finance palette.
// Blue = stability/trust (primary actions). Green/red = high-contrast
// functional indicators (growth vs loss). Neutrals (charcoal/slate/white)
// keep dense dashboards readable.
export const Dark: T = {
  bg: "#101418",
  card: "#1A2029",
  nav: "#101418",
  border: "#2A3340",
  primary: "#2997FF",
  primaryDeep: "#1E6FBD",
  onPrimary: "#FFFFFF",
  success: "#4ADE80",
  danger: "#F87171",
  warning: "#FBBF24",
  accent: "#38BDF8",
  text: "#F1F5F9",
  sub: "#94A3B8",
};

export const Light: T = {
  bg: "#F2F4F7",
  card: "#FFFFFF",
  nav: "#FFFFFF",
  border: "#E2E8F0",
  primary: "#0066CC",
  primaryDeep: "#004E9E",
  onPrimary: "#FFFFFF",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#B45309",
  accent: "#0A84FF",
  text: "#1D1D1F",
  sub: "#64748B",
};

export type Mode = "dark" | "light";

// Apple grammar: pill actions/chips, 18px utility cards, blue-led charts
// readable on charcoal and white canvases.
export const R = { card: 18, btn: 9999, input: 9999, tag: 9999 };

// Blue-led categorical set; green/red stay reserved for profit/loss.
export const CHART_COLORS = [
  "#0A84FF",
  "#5E5CE6",
  "#64D2FF",
  "#30B0C7",
  "#FF9F0A",
  "#C7A57A",
  "#94A3B8",
  "#64748B",
];

const Ctx = createContext<T>(Dark);

export function useTheme(): T {
  return useContext(Ctx);
}

export const ThemeCtx = Ctx;

export const ModeCtx = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({
  mode: "dark",
  setMode: () => {},
});

export function useMode() {
  return useContext(ModeCtx);
}
