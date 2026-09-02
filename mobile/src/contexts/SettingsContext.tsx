import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { currencies, type Currency } from "../utils/currency";

interface Settings {
  fullName: string;
  email: string;
  currency: Currency;
  defaultMonthlyBudget: number;
  autoCopyPreviousMonth: boolean;
  budgetCycleStartDay: number;
  theme: "light" | "dark" | "system";
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  currencySymbol: string;
  colorScheme: "light" | "dark";
}

const defaults: Settings = {
  fullName: "",
  email: "",
  currency: currencies.find((c) => c.code === "USD")!,
  defaultMonthlyBudget: 0,
  autoCopyPreviousMonth: false,
  budgetCycleStartDay: 1,
  theme: "system",
};

const STORAGE_KEY = "settings";

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({
            fullName: parsed.fullName ?? defaults.fullName,
            email: parsed.email ?? defaults.email,
            currency: currencies.find((c: any) => c.code === parsed.currency) ?? defaults.currency,
            defaultMonthlyBudget: parsed.defaultMonthlyBudget ?? defaults.defaultMonthlyBudget,
            autoCopyPreviousMonth: parsed.autoCopyPreviousMonth ?? defaults.autoCopyPreviousMonth,
            budgetCycleStartDay: parsed.budgetCycleStartDay ?? defaults.budgetCycleStartDay,
            theme: parsed.theme ?? defaults.theme,
          });
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const toStore = { ...settings, currency: settings.currency.code };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore)).catch(() => {});
  }, [settings, loaded]);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const colorScheme: "light" | "dark" =
    settings.theme === "system" ? ((systemScheme as "light" | "dark") ?? "light") : (settings.theme as "light" | "dark");

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, currencySymbol: settings.currency.symbol, colorScheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
