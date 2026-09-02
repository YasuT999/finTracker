import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import type { GroupWithUtilization } from "../types";

const CHART_TYPES = [
  { value: "bar", label: "Bar" },
  { value: "pie", label: "Pie" },
  { value: "line", label: "Line" },
  { value: "radar", label: "Radar" },
  { value: "area", label: "Area" },
] as const;

type ChartType = (typeof CHART_TYPES)[number]["value"];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

interface Props {
  group: GroupWithUtilization;
}

export default function GroupChart({ group }: Props) {
  const [type, setType] = useState<ChartType>("bar");

  const chartData = group.categories.map((cat) => ({
    name: cat.name,
    budget: Number(cat.allocated_budget),
    actual: Number(cat.actual_spending),
    utilization: Number(cat.utilization_percentage),
    remaining: Math.max(0, Number(cat.allocated_budget) - Number(cat.actual_spending)),
  }));

  if (chartData.length === 0) {
    return <Text style={styles.empty}>Add categories to see charts</Text>;
  }

  const maxVal = Math.max(...chartData.map((d) => Math.max(d.budget, d.actual, 1)), 1);

  const renderBar = () => (
    <View style={styles.chartBox}>
      {chartData.map((d, i) => (
        <View key={d.name} style={styles.barRow}>
          <Text style={styles.barLabel} numberOfLines={1}>{d.name}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(d.budget / maxVal) * 100}%`, backgroundColor: COLORS[0] }]} />
            <View style={[styles.barFillSm, { width: `${(d.actual / maxVal) * 100}%`, backgroundColor: COLORS[3] }]} />
          </View>
          <Text style={styles.barValue}>{d.actual}/{d.budget}</Text>
        </View>
      ))}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS[0] }]} /><Text style={styles.legendText}>Budget</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS[3] }]} /><Text style={styles.legendText}>Actual</Text></View>
      </View>
    </View>
  );

  const renderPie = () => {
    const total = chartData.reduce((s, d) => s + d.actual, 0) || 1;
    return (
      <View style={styles.chartBox}>
        {chartData.map((d, i) => {
          const pct = ((d.actual / total) * 100).toFixed(0);
          return (
            <View key={d.name} style={styles.pieRow}>
              <View style={[styles.dot, { backgroundColor: COLORS[i % COLORS.length] }]} />
              <Text style={{ flex: 1 }}>{d.name}</Text>
              <Text style={styles.piePct}>{pct}%</Text>
              <Text style={styles.pieVal}>{d.actual}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLine = () => (
    <View style={styles.chartBox}>
      {chartData.map((d) => (
        <View key={d.name} style={styles.barRow}>
          <Text style={styles.barLabel}>{d.name}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barLine, { left: `${(d.budget / maxVal) * 100}%` }]} />
            <View style={[styles.barLine, { left: `${(d.actual / maxVal) * 100}%`, backgroundColor: COLORS[3] }]} />
          </View>
          <Text style={styles.barValue}>B:{d.budget} A:{d.actual}</Text>
        </View>
      ))}
    </View>
  );

  // radar/area re-use bar/pie for simplicity without SVG/Skia
  const render = type === "bar" ? renderBar() : type === "pie" ? renderPie() : type === "line" ? renderLine() : type === "radar" ? renderPie() : renderBar();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {CHART_TYPES.map((ct) => (
          <Pressable key={ct.value} onPress={() => setType(ct.value)} style={[styles.tab, type === ct.value && styles.tabActive]}>
            <Text style={[styles.tabText, type === ct.value && styles.tabTextActive]}>{ct.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {render}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  tabs: { flexDirection: "row", gap: 6, paddingVertical: 4 },
  tab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  tabActive: { backgroundColor: "#111", borderColor: "#111" },
  tabText: { fontSize: 12, color: "#666" },
  tabTextActive: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", padding: 16, opacity: 0.6, fontSize: 12 },
  chartBox: { gap: 8, padding: 8, borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 10, backgroundColor: "#fafafa" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 70, fontSize: 11, fontWeight: "600" },
  barTrack: { flex: 1, height: 18, backgroundColor: "#e5e5e5", borderRadius: 6, overflow: "hidden", justifyContent: "center" },
  barFill: { position: "absolute", height: "100%", borderRadius: 6, opacity: 0.5 },
  barFillSm: { position: "absolute", height: "60%", borderRadius: 4 },
  barLine: { position: "absolute", width: 3, height: "100%", backgroundColor: "#3b82f6", borderRadius: 2 },
  barValue: { width: 80, fontSize: 10, opacity: 0.6, textAlign: "right" },
  legend: { flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, opacity: 0.7 },
  pieRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  piePct: { fontSize: 12, fontWeight: "700", width: 36, textAlign: "right" },
  pieVal: { fontSize: 11, opacity: 0.6, width: 50, textAlign: "right" },
});
