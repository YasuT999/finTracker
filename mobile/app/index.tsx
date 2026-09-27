import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { dashboardSummary, getCurrency, getSetting } from "../src/db";
import { useTheme } from "../src/theme";

const SCAN_H = 132;

const ITEMS = [
  { icon: "shopping-basket" as const, label: "Groceries", amount: "54.20" },
  { icon: "directions-bus" as const, label: "Bus fare", amount: "2.50" },
  { icon: "coffee" as const, label: "Morning coffee", amount: "3.80" },
];

const LEAVES = [
  { side: "L", bottom: 16, w: 34, h: 16, rot: "-35deg", dark: false },
  { side: "R", bottom: 34, w: 30, h: 15, rot: "30deg", dark: true },
  { side: "L", bottom: 52, w: 26, h: 13, rot: "-30deg", dark: true },
  { side: "R", bottom: 66, w: 22, h: 12, rot: "28deg", dark: false },
] as const;

const PETALS = [
  { left: 21.5, top: 6.5 },
  { left: 36, top: 17 },
  { left: 7, top: 17 },
  { left: 13, top: 34 },
  { left: 30, top: 34 },
];

// Splash: scans everyday spends into a vault card, then grows an authentic
// plant (soil, stem, leaves, bloom) before routing. Pure Animated, no deps.
export default function Splash() {
  const router = useRouter();
  const t = useTheme();
  const [phase, setPhase] = useState<"scan" | "grow">("scan");
  const [count, setCount] = useState(0);
  const [cur, setCur] = useState("$");
  const scanY = useRef(new Animated.Value(0)).current;
  const stemH = useRef(new Animated.Value(0)).current;
  const leaves = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let live = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    (async () => {
      try {
        const [s, c] = await Promise.all([dashboardSummary(), getCurrency()]);
        if (live) {
          setCount(s.total_transactions);
          setCur(c);
        }
      } catch {
        // fresh install — defaults stand
      }
      if (!live) return;
      Animated.loop(
        Animated.timing(scanY, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        { iterations: 2 }
      ).start();
      timers.push(setTimeout(() => live && setPhase("grow"), 1900));
      timers.push(
        setTimeout(() => {
          if (!live) return;
          Animated.stagger(220, [
            Animated.timing(stemH, { toValue: 1, duration: 650, useNativeDriver: false }),
            Animated.spring(leaves, { toValue: 1, useNativeDriver: true }),
            Animated.spring(bloom, { toValue: 1, useNativeDriver: true }),
          ]).start();
        }, 2000)
      );
      timers.push(
        setTimeout(async () => {
          if (!live) return;
          const [ob, prof] = await Promise.all([getSetting("onboarded"), getSetting("profile")]);
          if (!live) return;
          if (ob !== "1") router.replace("/onboarding");
          else if (!prof) router.replace("/login");
          else router.replace("/(tabs)");
        }, 3400)
      );
    })();
    return () => {
      live = false;
      timers.forEach(clearTimeout);
    };
  }, [router, scanY, stemH, leaves, bloom]);

  const scanTop = scanY.interpolate({ inputRange: [0, 1], outputRange: [0, SCAN_H] });
  const stemHeight = stemH.interpolate({ inputRange: [0, 1], outputRange: [0, 96] });

  return (
    <View style={[s.wrap, { backgroundColor: t.bg }]}>
      <Text style={[s.name, { color: t.text }]}>Expense Tracker</Text>
      {phase === "scan" ? (
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          {ITEMS.map((it) => (
            <View key={it.label} style={s.row}>
              <View style={[s.ic, { backgroundColor: t.bg }]}>
                <MaterialIcons name={it.icon} size={16} color={t.primary} />
              </View>
              <Text style={[s.itemLabel, { color: t.text }]}>{it.label}</Text>
              <Text style={[s.itemAmt, { color: t.sub }]}>
                {cur}
                {it.amount}
              </Text>
            </View>
          ))}
          <Animated.View
            style={[s.scanline, { backgroundColor: t.primary, transform: [{ translateY: scanTop }] }]}
          />
        </View>
      ) : (
        <View style={s.plant}>
          <Animated.View style={[s.bloom, { transform: [{ scale: bloom }] }]}>
            {PETALS.map((p, i) => (
              <View
                key={i}
                style={[s.petal, { left: p.left, top: p.top, backgroundColor: "#FFFFFF", borderColor: t.primary }]}
              />
            ))}
            <View style={[s.bud, { backgroundColor: t.primary }]}>
              <MaterialIcons name="savings" size={14} color={t.onPrimary} />
            </View>
          </Animated.View>
          <View style={s.stemZone}>
            {LEAVES.map((lf, i) => (
              <Animated.View
                key={i}
                style={[
                  lf.side === "L" ? s.leafL : s.leafR,
                  { bottom: lf.bottom, transform: [{ scale: leaves }, { rotate: lf.rot }] },
                ]}
              >
                <View
                  style={[
                    s.leaf,
                    {
                      width: lf.w,
                      height: lf.h,
                      borderRadius: lf.h / 2,
                      backgroundColor: lf.dark ? "#27AE60" : t.success,
                    },
                  ]}
                />
              </Animated.View>
            ))}
            <Animated.View style={[s.stem, { backgroundColor: "#2E9E5B", height: stemHeight }]} />
          </View>
          <View style={[s.soil, { backgroundColor: "#5B3A24" }]} />
          <View style={[s.rim, { backgroundColor: "#C96F4A" }]} />
          <View style={[s.pot, { backgroundColor: "#B5651D" }]} />
        </View>
      )}
      <Text style={[s.tag, { color: t.sub }]}>
        {phase === "scan"
          ? count > 0
            ? `Scanning everyday spends · ${count} found`
            : "Scanning everyday spends…"
          : count > 0
            ? `${count} stored · growing your savings`
            : "Growing your savings"}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 32 },
  name: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  card: { width: 264, height: 164, borderRadius: 18, borderWidth: 1, padding: 16, gap: 14, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  ic: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  itemAmt: { fontSize: 14, fontWeight: "600", fontVariant: ["tabular-nums"] },
  scanline: { position: "absolute", left: 12, right: 12, top: 12, height: 3, borderRadius: 2 },
  tag: { fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  plant: { height: 250, alignItems: "center", justifyContent: "flex-end" },
  bloom: { width: 56, height: 56, marginBottom: -8 },
  petal: { position: "absolute", width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5 },
  bud: { position: "absolute", left: 15, top: 15, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stemZone: { height: 100, width: 110, alignItems: "center", justifyContent: "flex-end" },
  stem: { width: 7, borderRadius: 3.5 },
  leaf: {},
  leafL: { position: "absolute", left: 8 },
  leafR: { position: "absolute", right: 8 },
  soil: { width: 56, height: 12, borderRadius: 6, marginBottom: -6, zIndex: 1 },
  rim: { width: 78, height: 12, borderRadius: 6 },
  pot: { width: 64, height: 38, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
});
