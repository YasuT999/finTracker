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

// Sleek dark-mode palette: OLED black canvas, elevated charcoal cards,
// electric blue + vivid pink interactive highlights, green/red status.
// Blue = stability/trust (primary actions). Green/red = high-contrast
// functional indicators (growth vs loss). Neutrals keep dense dashboards readable.
export const Dark: T = {
  bg: "#0A0A0C",
  card: "#1C1C20",
  nav: "#0A0A0C",
  border: "#2E2E36",
  primary: "#3B82F6",
  primaryDeep: "#2563EB",
  onPrimary: "#FFFFFF",
  success: "#10B981",
  danger: "#F43F5E",
  warning: "#FBBF24",
  accent: "#EC4899",
  text: "#EDEEF2",
  sub: "#8B8B98",
};

export const Light: T = {
  bg: "#F2F4F7",
  card: "#FFFFFF",
  nav: "#FFFFFF",
  border: "#E2E8F0",
  primary: "#3B82F6",
  primaryDeep: "#2563EB",
  onPrimary: "#FFFFFF",
  success: "#10B981",
  danger: "#F43F5E",
  warning: "#B45309",
  accent: "#EC4899",
  text: "#1D1D1F",
  sub: "#64748B",
};

export type Mode = "dark" | "light";

// Apple grammar: pill actions/chips, 18px utility cards, blue-led charts
// readable on charcoal and white canvases.
export const R = { card: 18, btn: 9999, input: 9999, tag: 9999 };

// Blue/purple/pink-led categorical set (interactive highlights);
// green/red stay reserved for profit/loss.
export const CHART_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#10B981",
  "#F43F5E",
  "#FBBF24",
  "#8B8B98",
  "#5E5E6E",
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
