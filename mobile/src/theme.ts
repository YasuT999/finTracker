import { createContext, useContext } from "react";

export interface T {
  bg: string;
  card: string;
  nav: string;
  border: string;
  primary: string;
  success: string;
  danger: string;
  warning: string;
  accent: string;
  text: string;
  sub: string;
}

export const Dark: T = {
  bg: "#0F1420",
  card: "#171F33",
  nav: "#151B2B",
  border: "#232C42",
  primary: "#4F8CFF",
  success: "#3DDC84",
  danger: "#FF6B7A",
  warning: "#FFB84F",
  accent: "#B06BFF",
  text: "#E8ECF4",
  sub: "#6B7690",
};

export const Light: T = {
  bg: "#F4F6FB",
  card: "#FFFFFF",
  nav: "#FFFFFF",
  border: "#E3E8F2",
  primary: "#2F6BFF",
  success: "#16A34A",
  danger: "#E5485D",
  warning: "#E8930C",
  accent: "#8B5CF6",
  text: "#0F1420",
  sub: "#64748B",
};

export type Mode = "dark" | "light";

export const R = { card: 16, btn: 12, input: 12, tag: 20 };

export const CHART_COLORS = [
  "#4F8CFF",
  "#B06BFF",
  "#3DDC84",
  "#FFB84F",
  "#FF6B7A",
  "#4FD8FF",
  "#FF8C4F",
  "#8CFF4F",
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
