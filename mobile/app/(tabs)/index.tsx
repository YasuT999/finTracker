import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  dashboardSummary,
  deleteTransaction,
  getCurrency,
  getMonthSummary,
  getProfile,
  getProfilePhoto,
  monthlyTotals,
  recentMonthTxns,
  spendByGroup,
  type GroupTxn,
} from "../../src/db";
import type { DashboardSummary, MonthSummary } from "../../src/types";
import { formatCurrency } from "../../src/format";
import { CHART_COLORS, useTheme } from "../../src/theme";
import {
  Avatar,
  BarChart,
  Card,
  CenterLoad,
  DonutChart,
  Stat,
  TxnRow,
  TXN_H,
  useTopPad,
} from "../../src/ui";

type DayKey = "morning" | "afternoon" | "evening" | "night";

function daypartKey(): DayKey {
  const h = new Date().getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 22) return "evening";
  return "night";
}

const DAY_LABEL: Record<DayKey, string> = {
  morning: "Good Morning",
  afternoon: "Good Afternoon",
  evening: "Good Evening",
  night: "Good Night",
};

// Fixed scenic palettes (like reference cards) — same in both themes.
const SKY: Record<DayKey, { grad: [string, string]; text: string; sub: string; sun: string; ray: string; cloud: string; hill: string }> = {
  morning: { grad: ["#FFF8E3", "#FFD68A"], text: "#1D1D1F", sub: "#8A7A4B", sun: "#FFC93C", ray: "rgba(255,170,0,0.30)", cloud: "rgba(255,255,255,0.9)", hill: "rgba(46,125,50,0.20)" },
  afternoon: { grad: ["#E9F5FF", "#BEE0FF"], text: "#1D1D1F", sub: "#5B7A99", sun: "#FFD60A", ray: "rgba(255,200,40,0.35)", cloud: "rgba(255,255,255,0.95)", hill: "rgba(30,110,70,0.18)" },
  evening: { grad: ["#5B3E96", "#E8845C"], text: "#FFFFFF", sub: "#EADFFB", sun: "#FFB03A", ray: "rgba(255,176,58,0.40)", cloud: "rgba(230,200,255,0.45)", hill: "rgba(20,10,40,0.35)" },
  night: { grad: ["#0B0B14", "#1E2648"], text: "#FFFFFF", sub: "#A7B0C5", sun: "#F5F3CE", ray: "rgba(245,243,206,0.16)", cloud: "rgba(255,255,255,0)", hill: "rgba(0,0,0,0)" },
};

const RAY_ANGLES = [0, 45, 90, 135];
const STARS: { l: number; t: number; s: number; o: number }[] = [
  { l: 150, t: 18, s: 3, o: 0.9 },
  { l: 200, t: 44, s: 2, o: 0.6 },
  { l: 120, t: 60, s: 2, o: 0.7 },
  { l: 250, t: 24, s: 3, o: 0.8 },
  { l: 90, t: 30, s: 2, o: 0.5 },
  { l: 180, t: 90, s: 2, o: 0.6 },
  { l: 230, t: 110, s: 3, o: 0.7 },
  { l: 140, t: 120, s: 2, o: 0.5 },
  { l: 60, t: 90, s: 2, o: 0.6 },
  { l: 280, t: 70, s: 2, o: 0.7 },
  { l: 30, t: 60, s: 3, o: 0.5 },
  { l: 210, t: 130, s: 2, o: 0.6 },
];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CHART_COLORS[h % CHART_COLORS.length];
}

export default function Home() {
  const router = useRouter();
  const t = useTheme();
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [currency, setCurrencyState] = useState("$");
  const [monthName, setMonthName] = useState("");
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [byGroup, setByGroup] = useState<{ name: string; amount: number }[]>([]);
  const [recent, setRecent] = useState<GroupTxn[]>([]);
  const [dash, setDash] = useState<DashboardSummary | null>(null);
  const [topGroups, setTopGroups] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [prof, uri, cur, months, d, tg] = await Promise.all([
        getProfile(),
        getProfilePhoto(),
        getCurrency(),
        monthlyTotals(),
        dashboardSummary(),
        spendByGroup(),
      ]);
      setName(prof?.name ?? "");
      setPhoto(uri);
      setCurrencyState(cur);
      setDash(d);
      setTopGroups(tg.filter((g) => g.amount > 0).slice(0, 5));
      const latest = months[months.length - 1];
      if (latest) {
        const [sum, bg, rec] = await Promise.all([
          getMonthSummary(latest.id),
          spendByGroup(latest.id),
          recentMonthTxns(latest.id, 5),
        ]);
        if (sum) {
          setMonthName(latest.name);
          setSummary(sum);
          setByGroup(bg.filter((g) => g.amount > 0).slice(0, 5));
          setRecent(rec);
        }
      } else {
        setRecent([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const fmt = useCallback((n: number) => formatCurrency(n, currency), [currency]);

  const openProfile = useCallback(() => router.push("/profile"), [router]);

  const onDeleteTxn = useCallback(
    (id: number) => {
      Alert.alert("Delete transaction?", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id).then(load) },
      ]);
    },
    [load]
  );

  const key = daypartKey();
  const pal = SKY[key];
  const showStars = key === "evening" || key === "night";
  const topPad = useTopPad();

  // Dynamic heights: charts scale with device height (clamped), so small
  // phones stay compact and tall screens breathe.
  const { height: winH } = useWindowDimensions();
  const barH = Math.max(96, Math.min(160, Math.round(winH * 0.16)));
  const donutSize = Math.max(140, Math.min(208, Math.round(winH * 0.22)));

  if (loading) return <CenterLoad />;
  return (
    <View style={[s.wrap, { backgroundColor: t.bg, paddingTop: topPad }]}>
      <FlatList
        data={recent}
        keyExtractor={(x) => String(x.id)}
        getItemLayout={(_, i) => ({ length: TXN_H, offset: TXN_H * i, index: i })}
        windowSize={5}
        maxToRenderPerBatch={20}
        initialNumToRender={10}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <View style={s.gap}>
            <LinearGradient colors={pal.grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.banner}>
              {key !== "night" ? (
                <>
                  <View style={[s.halo, { backgroundColor: pal.ray }]} />
                  <View style={[s.sun, key === "evening" && s.sunLow, { backgroundColor: pal.sun }]} />
                  {RAY_ANGLES.map((a) => (
                    <View
                      key={a}
                      style={[s.ray, { backgroundColor: pal.ray, transform: [{ rotate: `${a}deg` }] }]}
                    />
                  ))}
                  <View style={[s.cloud, { backgroundColor: pal.cloud }]} />
                  <View style={[s.cloudPuff1, { backgroundColor: pal.cloud }]} />
                  <View style={[s.cloudPuff2, { backgroundColor: pal.cloud }]} />
                  <View style={[s.hill, { backgroundColor: pal.hill }]} />
                </>
              ) : (
                <>
                  <View style={[s.moon, { backgroundColor: pal.sun }]} />
                  <View style={[s.moonCut, { backgroundColor: pal.grad[1] }]} />
                </>
              )}
              {showStars
                ? STARS.map((st, i) => (
                    <View
                      key={i}
                      style={{
                        position: "absolute",
                        left: st.l,
                        top: st.t,
                        width: st.s,
                        height: st.s,
                        borderRadius: st.s / 2,
                        backgroundColor: "#FFFFFF",
                        opacity: st.o,
                      }}
                    />
                  ))
                : null}
              <View style={s.bannerRow}>
                <View style={s.grow}>
                  <Text style={[s.hi, { color: pal.sub }]}>Hi{name ? `, ${name}` : ""}</Text>
                  <Text style={[s.greet, { color: pal.text }]}>{DAY_LABEL[key]}</Text>
                </View>
                <Pressable onPress={openProfile} hitSlop={8}>
                  <Avatar uri={photo} name={name} size={52} />
                </Pressable>
              </View>
            </LinearGradient>
            <Text style={[s.h2, { color: t.text }]}>Recents</Text>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={[s.body, { color: t.sub }]}>No recent transactions yet.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <TxnRow
            name={item.description}
            category={item.category}
            date={item.date}
            amount={`${item.type === "income" ? "+" : "-"}${fmt(item.amount)}`}
            isIncome={item.type === "income"}
            color={colorFor(item.category)}
            onDelete={() => onDeleteTxn(item.id)}
          />
        )}
        ListFooterComponent={
          <View style={s.gap}>
            <Text style={[s.h2, { color: t.text }]}>This month{monthName ? ` · ${monthName}` : ""}</Text>
            {summary ? (
              <Card>
                <Text style={[s.cap, { color: t.sub }]}>Remaining</Text>
                <Text style={[s.hero, { color: t.text }]}>{fmt(summary.remaining_budget)}</Text>
                <View style={s.stats}>
                  <Stat label="Income" value={fmt(summary.total_income)} />
                  <Stat label="Spent" value={fmt(summary.total_expenses)} />
                </View>
              </Card>
            ) : (
              <Card>
                <Text style={[s.body, { color: t.sub }]}>
                  No month yet — add a year in the Years tab, then a month to see insights.
                </Text>
              </Card>
            )}
            {summary ? (
              <Card>
                <Text style={[s.h2, { color: t.text }]}>Income vs spent</Text>
                <BarChart
                  data={[
                    { label: "Income", value: summary.total_income, color: t.success },
                    { label: "Spent", value: summary.total_expenses, color: t.danger },
                  ]}
                  height={barH}
                />
              </Card>
            ) : null}
            {byGroup.length > 0 ? (
              <Card>
                <Text style={[s.h2, { color: t.text }]}>Spend by group</Text>
                <DonutChart
                  data={byGroup}
                  size={donutSize}
                  centerLabel={fmt(byGroup.reduce((s2, g) => s2 + g.amount, 0))}
                  format={fmt}
                />
              </Card>
            ) : null}
            <Text style={[s.h2, { color: t.text }]}>Other insights</Text>
            {dash && dash.month_count > 0 ? (
              <Card>
                <View style={s.stats}>
                  <Stat label="Avg / month" value={fmt(dash.avg_monthly_spending)} />
                  <Stat label="Over budget" value={String(dash.months_over_budget)} />
                </View>
                <View style={[s.stats, s.mt]}>
                  <Stat
                    label="Highest"
                    value={dash.highest_spend_month ? fmt(dash.highest_spend_month.amount) : "—"}
                  />
                  <Stat label="Transactions" value={String(dash.total_transactions)} />
                </View>
                {topGroups.length > 0 ? (
                  <View style={s.mt}>
                    {topGroups.map((g) => (
                      <View key={g.name} style={s.kv}>
                        <Text style={[s.body, { color: t.text }]} numberOfLines={1}>
                          {g.name}
                        </Text>
                        <Text style={[s.body, { color: t.sub }]}>{fmt(g.amount)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            ) : (
              <Card>
                <Text style={[s.body, { color: t.sub }]}>Insights appear once you add data.</Text>
              </Card>
            )}
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20 },
  list: { gap: 12, paddingBottom: 32 },
  gap: { gap: 12 },
  banner: { minHeight: 176, borderRadius: 18, padding: 20, overflow: "hidden", justifyContent: "center" },
  halo: { position: "absolute", left: 26, top: 68, width: 96, height: 96, borderRadius: 48, opacity: 0.5 },
  sun: { position: "absolute", left: 46, top: 88, width: 56, height: 56, borderRadius: 28 },
  sunLow: { top: 108 },
  ray: { position: "absolute", left: 71, top: 56, width: 6, height: 120, borderRadius: 3, opacity: 0.5 },
  cloud: { position: "absolute", right: 30, top: 24, width: 74, height: 22, borderRadius: 11 },
  cloudPuff1: { position: "absolute", right: 66, top: 14, width: 30, height: 30, borderRadius: 15 },
  cloudPuff2: { position: "absolute", right: 44, top: 18, width: 24, height: 24, borderRadius: 12 },
  hill: { position: "absolute", left: -70, bottom: -130, width: 300, height: 170, borderRadius: 85 },
  moon: { position: "absolute", left: 34, top: 24, width: 42, height: 42, borderRadius: 21 },
  moonCut: { position: "absolute", left: 46, top: 19, width: 36, height: 36, borderRadius: 18 },
  bannerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grow: { flex: 1 },
  hi: { fontSize: 15, fontWeight: "600" },
  greet: { fontSize: 34, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  h2: { fontSize: 20, fontWeight: "700" },
  body: { fontSize: 15 },
  cap: { fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  hero: { fontSize: 32, fontWeight: "700", letterSpacing: -0.5, marginVertical: 4, fontVariant: ["tabular-nums"] },
  stats: { flexDirection: "row", gap: 12, marginTop: 8 },
  mt: { marginTop: 8 },
  kv: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
});
