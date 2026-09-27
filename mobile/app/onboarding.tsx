import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { setSetting } from "../src/db";
import { useTheme } from "../src/theme";
import { Btn, Card, useTopPad } from "../src/ui";

const POINTS = [
  ["account-tree", "Years, months & groups", "Budget top-down, track bottom-up"],
  ["pie-chart", "Charts that explain", "Income vs spent bars, spend-by-group donut"],
  ["offline-bolt", "100% offline", "Your data never leaves this device"],
] as const;

export default function Onboarding() {
  const router = useRouter();
  const t = useTheme();
  const topPad = useTopPad();

  const start = async () => {
    await setSetting("onboarded", "1");
    router.replace("/login");
  };

  return (
    <View style={[s.wrap, { backgroundColor: t.bg, paddingTop: topPad }]}>
      <Text style={[s.h1, { color: t.text }]}>Welcome to Expense Tracker</Text>
      <Text style={[s.sub, { color: t.sub }]}>Simple budgeting that respects your privacy.</Text>
      {POINTS.map(([g, h, b]) => (
        <Card key={h}>
          <View style={s.row}>
            <View style={[s.glyphBox, { backgroundColor: t.bg, borderColor: t.border }]}>
              <MaterialIcons name={g} size={22} color={t.primary} />
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
  h1: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  sub: { fontSize: 15, marginBottom: 8 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  glyphBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  grow: { flex: 1 },
  h: { fontSize: 15, fontWeight: "700" },
  b: { fontSize: 13, marginTop: 2 },
});
