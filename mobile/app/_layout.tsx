import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { initDb } from "../src/db";
import { CenterLoad } from "../src/ui";

export default function Layout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    initDb().finally(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!ready) return <CenterLoad />;
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: "FinTracker" }} />
        <Stack.Screen name="years/[yearId]" options={{ title: "Months" }} />
        <Stack.Screen name="months/[monthId]" options={{ title: "Groups" }} />
        <Stack.Screen name="groups/[groupId]" options={{ title: "Categories" }} />
        <Stack.Screen name="categories/[categoryId]" options={{ title: "Transactions" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </>
  );
}
