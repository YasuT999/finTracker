import { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getSetting, initDb, setSetting } from "../src/db";
import { Dark, Light, ModeCtx, ThemeCtx, type Mode } from "../src/theme";
import { CenterLoad } from "../src/ui";

export default function Layout() {
  const [ready, setReady] = useState(false);
  const [mode, setModeState] = useState<Mode>("dark");

  useEffect(() => {
    let live = true;
    (async () => {
      await initDb();
      const m = await getSetting("theme");
      if (live) {
        if (m === "light" || m === "dark") setModeState(m);
        setReady(true);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const setMode = useCallback(async (m: Mode) => {
    setModeState(m);
    await setSetting("theme", m);
  }, []);

  if (!ready) return <CenterLoad />;
  return (
    <SafeAreaProvider>
    <ThemeCtx.Provider value={mode === "dark" ? Dark : Light}>
      <ModeCtx.Provider value={{ mode, setMode }}>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="years/[yearId]" />
          <Stack.Screen name="months/[monthId]" />
          <Stack.Screen name="groups/[groupId]" />
          <Stack.Screen name="categories/[categoryId]" />
        </Stack>
      </ModeCtx.Provider>
    </ThemeCtx.Provider>
    </SafeAreaProvider>
  );
}
