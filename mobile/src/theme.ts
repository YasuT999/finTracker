import { createContext, useContext } from "react";

export interface T {
  bg: string;
  card: string;
  nav: string;
  border: string;
  primary: string;
  onPrimary: string;
  success: string;
  danger: string;
  warning: string;
  accent: string;
  text: string;
  sub: string;
}

// Dark = Lamborghini rich: absolute black canvas, charcoal surface,
// vivid gold CTA with near-black text. Light = Apple clarity: parchment
// canvas, white cards, ink text, deep antique gold so fills + links stay
// readable on white.
export const Dark: T = {
  bg: "#000000",
  card: "#181818",
  nav: "#000000",
  border: "#2A2A2A",
  primary: "#FFC000",
  onPrimary: "#1A1A1A",
  success: "#3DDC84",
  danger: "#FF6B7A",
  warning: "#FFCE3E",
  accent: "#29ABE2",
  text: "#FFFFFF",
  sub: "#A3A3A3",
};

export const Light: T = {
  bg: "#F5F5F7",
  card: "#FFFFFF",
  nav: "#FFFFFF",
  border: "#E6E6E6",
  primary: "#917300",
  onPrimary: "#FFFFFF",
  success: "#16A34A",
  danger: "#E5485D",
  warning: "#E8930C",
  accent: "#3860BE",
  text: "#1D1D1F",
  sub: "#7D7D7D",
};

export type Mode = "dark" | "light";

// Apple pill heritage tightened toward Lambo angularity: architectural
// corners, sharp tag chips, no full pills except FAB medallion.
export const R = { card: 14, btn: 10, input: 10, tag: 8 };

// Gold-led classic metallics: readable as fills on both black and
// parchment canvases (no neon, no pure-white slices).
export const CHART_COLORS = [
  "#D9A900",
  "#C98A3D",
  "#8C8C8C",
  "#2E9E6B",
  "#D1604D",
  "#5B8DC9",
  "#A67C52",
  "#6E6E73",
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
