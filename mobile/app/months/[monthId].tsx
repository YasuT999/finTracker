import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  createGroup,
  deleteGroup,
  deleteTransaction,
  getCurrency,
  getMonthSummary,
  listGroups,
  recentMonthTxns,
  spendByGroup,
  type GroupTxn,
} from "../../src/db";
import type { GroupWithUtilization, MonthSummary } from "../../src/types";
import { formatCurrency } from "../../src/format";
import { CHART_COLORS, useTheme } from "../../src/theme";
import {
  BarChart,
  Btn,
  Card,
  CenterLoad,
  Chip,
  DonutChart,
  EmptyState,
  FAB,
  Field,
  GroupCard,
  Sheet,
  Stat,
  Toast,
  TxnRow,
  useTopPad,
} from "../../src/ui";

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CHART_COLORS[h % CHART_COLORS.length];
}

export default function MonthDashboard() {
  const { monthId } = useLocalSearchParams<{ monthId: string }>();
  const mid = Number(monthId);
  const router = useRouter();
  const t = useTheme();
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [groups, setGroups] = useState<GroupWithUtilization[]>([]);
  const [recent, setRecent] = useState<GroupTxn[]>([]);
  const [byGroup, setByGroup] = useState<{ name: string; amount: number }[]>([]);
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const topPad = useTopPad();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, gs, cur, rec, bg] = await Promise.all([
        getMonthSummary(mid),
        listGroups(mid),
        getCurrency(),
        recentMonthTxns(mid, 3),
        spendByGroup(mid),
      ]);
      setSummary(sum);
      setGroups(gs);
      setRecent(rec);
      setByGroup(bg.filter((g) => g.amount > 0).slice(0, 6));
      setCurrencyState(cur);
    } finally {
      setLoading(false);
    }
  }, [mid]);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const fmt = useCallback((n: number) => formatCurrency(n, currency), [currency]);
  const say = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const onCreate = useCallback(async () => {
    if (!name.trim()) return;
    await createGroup(mid, name, Number(budget) || 0);
    setName("");
    setBudget("");
    setShowNew(false);
    load();
    say("Saved ✓");
  }, [mid, name, budget, load, say]);

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert("Delete group?", "Categories inside will be deleted.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteGroup(id).then(load) },
      ]);
    },
    [load]
  );

  const onDeleteTxn = useCallback(
    (id: number) => {
      Alert.alert("Delete transaction?", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id).then(load) },
      ]);
    },
    [load]
  );

  const openGroup = useCallback(
    (id: number) => router.push({ pathname: "/groups/[groupId]", params: { groupId: String(id) } }),
    [router]
  );

  if (loading) return <CenterLoad />;
  return (
    <View style={[s.wrap, { backgroundColor: t.bg, paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={[s.h1, { color: t.text }]}>{summary?.name ?? ""}</Text>
        <Card>
          <Text style={[s.cap, { color: t.sub }]}>Remaining</Text>
          <Text style={[s.hero, { color: t.text }]}>{fmt(summary?.remaining_budget ?? 0)}</Text>
          <View style={s.stats}>
            <Stat label="Income" value={fmt(summary?.total_income ?? 0)} />
            <Stat label="Spent" value={fmt(summary?.total_expenses ?? 0)} />
          </View>
        </Card>
        <Card>
          <Text style={[s.h2, { color: t.text }]}>Income vs spent</Text>
          <BarChart
            data={[
              { label: "Income", value: summary?.total_income ?? 0, color: t.success },
              { label: "Spent", value: summary?.total_expenses ?? 0, color: t.danger },
            ]}
            height={120}
          />
        </Card>
        {byGroup.length > 0 ? (
          <Card>
            <Text style={[s.h2, { color: t.text }]}>Spend by group</Text>
            <DonutChart
              data={byGroup}
              centerLabel={fmt(byGroup.reduce((s2, g) => s2 + g.amount, 0))}
              format={fmt}
            />
          </Card>
        ) : null}
        <Text style={[s.h2, { color: t.text }]}>Groups</Text>
        <FlatList
          horizontal
          data={groups}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={s.chips}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Chip
              label={item.name}
              dot={CHART_COLORS[index % CHART_COLORS.length]}
              onPress={() => openGroup(item.id)}
            />
          )}
        />
        {groups.length === 0 ? (
          <EmptyState title="No groups" hint="Add your first budget group." />
        ) : (
          <View style={s.gap}>
            {groups.map((g, i) => (
              <GroupCard
                key={g.id}
                name={g.name}
                meta={`${fmt(g.actual_spending)} of ${fmt(g.allocated_budget)}`}
                utilization={g.utilization_percentage}
                color={CHART_COLORS[i % CHART_COLORS.length]}
                onPress={() => openGroup(g.id)}
                onDelete={() => onDelete(g.id)}
              />
            ))}
          </View>
        )}
        {recent.length > 0 ? (
          <>
            <Text style={[s.h2, { color: t.text }]}>Recent</Text>
            <View style={s.gap}>
              {recent.map((txn) => (
                <TxnRow
                  key={txn.id}
                  name={txn.description}
                  category={txn.category}
                  date={txn.date}
                  amount={`${txn.type === "income" ? "+" : "-"}${fmt(txn.amount)}`}
                  isIncome={txn.type === "income"}
                  color={colorFor(txn.category)}
                  onDelete={() => onDeleteTxn(txn.id)}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
      <FAB onPress={() => setShowNew(true)} label="Add group" />
      <Sheet visible={showNew} onClose={() => setShowNew(false)} title="Add group">
        <Field value={name} onChange={setName} placeholder="e.g. Food" />
        <Field value={budget} onChange={setBudget} placeholder="Budget" numeric />
        <Btn title="Save" onPress={onCreate} block />
      </Sheet>
      <Toast message={toast} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  body: { padding: 20, gap: 12, paddingBottom: 110 },
  h1: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: "700" },
  cap: { fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  hero: { fontSize: 40, fontWeight: "700", letterSpacing: -1, marginVertical: 4, fontVariant: ["tabular-nums"] },
  stats: { flexDirection: "row", gap: 12, marginTop: 8 },
  chips: { gap: 8 },
  gap: { gap: 12 },
});
