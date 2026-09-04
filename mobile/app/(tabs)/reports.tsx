import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { getCurrency, monthlyTotals, spendByGroup, type MonthTotal } from "../../src/db";
import { formatCurrency } from "../../src/format";
import { useTheme } from "../../src/theme";
import { BarChart, Card, CenterLoad, DonutChart, EmptyState, Stat } from "../../src/ui";

export default function Reports() {
  const t = useTheme();
  const [months, setMonths] = useState<MonthTotal[]>([]);
  const [groups, setGroups] = useState<{ name: string; amount: number }[]>([]);
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [ms, gs, cur] = await Promise.all([monthlyTotals(), spendByGroup(), getCurrency()]);
      setMonths(ms);
      setGroups(gs.slice(0, 6));
      setCurrencyState(cur);
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

  if (loading) return <CenterLoad />;
  if (months.length === 0)
    return (
      <View style={[s.wrap, { backgroundColor: t.bg }]}>
        <Text style={[s.h1, { color: t.text }]}>Reports</Text>
        <EmptyState title="No data yet" hint="Add months and transactions to see reports." />
      </View>
    );

  const total = months.reduce((sum, m) => sum + m.spent, 0);
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={s.wrap}>
      <Text style={[s.h1, { color: t.text }]}>Reports</Text>
      <Card>
        <Stat label="Total spent" value={fmt(total)} />
      </Card>
      <Card>
        <Text style={[s.h2, { color: t.text }]}>Spend per month</Text>
        <BarChart data={months.map((m) => ({ label: m.name.slice(0, 3), value: m.spent }))} />
      </Card>
      {groups.some((g) => g.amount > 0) ? (
        <Card>
          <Text style={[s.h2, { color: t.text }]}>Spend by group</Text>
          <DonutChart
            data={groups.filter((g) => g.amount > 0)}
            centerLabel={fmt(groups.reduce((sum, g) => sum + g.amount, 0))}
            format={fmt}
          />
        </Card>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, gap: 12, paddingBottom: 32 },
  h1: { fontSize: 28, fontWeight: "800" },
  h2: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
});
