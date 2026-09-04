import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getSetting } from "../src/db";
import { useTheme } from "../src/theme";

export default function Splash() {
  const router = useRouter();
  const t = useTheme();

  useEffect(() => {
    let live = true;
    (async () => {
      const [ob, prof] = await Promise.all([getSetting("onboarded"), getSetting("profile")]);
      await new Promise((r) => setTimeout(r, 900));
      if (!live) return;
      if (ob !== "1") router.replace("/onboarding");
      else if (!prof) router.replace("/login");
      else router.replace("/(tabs)");
    })();
    return () => {
      live = false;
    };
  }, [router]);

  return (
    <View style={[s.wrap, { backgroundColor: t.bg }]}>
      <View style={[s.logo, { backgroundColor: t.primary }]}>
        <Text style={s.glyph}>₣</Text>
      </View>
      <Text style={[s.name, { color: t.text }]}>FinTrack</Text>
      <Text style={[s.tag, { color: t.sub }]}>Track every rupee, dollar & dime</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  logo: { width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  glyph: { color: "#fff", fontSize: 52, fontWeight: "800" },
  name: { fontSize: 28, fontWeight: "800" },
  tag: { fontSize: 15 },
});
