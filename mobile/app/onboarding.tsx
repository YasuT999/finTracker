import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { setSetting } from "../src/db";
import { useTheme } from "../src/theme";
import { Btn, Card } from "../src/ui";

const POINTS = [
  ["＋", "Years, months & groups", "Budget top-down, track bottom-up"],
  ["▦", "Charts that explain", "Income vs spent bars, spend-by-group donut"],
  ["◉", "100% offline", "Your data never leaves this device"],
];

export default function Onboarding() {
  const router = useRouter();
  const t = useTheme();

  const start = async () => {
    await setSetting("onboarded", "1");
    router.replace("/login");
  };

  return (
    <View style={[s.wrap, { backgroundColor: t.bg }]}>
      <Text style={[s.h1, { color: t.text }]}>Welcome to FinTrack</Text>
      <Text style={[s.sub, { color: t.sub }]}>Simple budgeting that respects your privacy.</Text>
      {POINTS.map(([g, h, b]) => (
        <Card key={h}>
          <View style={s.row}>
            <View style={[s.glyphBox, { backgroundColor: t.bg }]}>
              <Text style={[s.glyph, { color: t.primary }]}>{g}</Text>
            </View>
            <View style={s.grow}>
              <Text style={[s.h, { color: t.text }]}>{h}</Text>
              <Text style={[s.b, { color: t.sub }]}>{b}</Text>
            </View>
          </View>
        </Card>
      ))}
      <Btn title="Get started" onPress={start} block />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 12, justifyContent: "center" },
  h1: { fontSize: 28, fontWeight: "800" },
  sub: { fontSize: 15, marginBottom: 8 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  glyphBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  glyph: { fontSize: 20, fontWeight: "800" },
  grow: { flex: 1 },
  h: { fontSize: 15, fontWeight: "700" },
  b: { fontSize: 13, marginTop: 2 },
});
