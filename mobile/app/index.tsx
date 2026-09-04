import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  createYear,
  dashboardSummary,
  deleteYear,
  getCurrency,
  listYears,
} from "../src/db";
import { formatCurrency } from "../src/format";
import type { DashboardSummary, Year } from "../src/types";
import { Btn, C, CenterLoad, Empty, Field, ROW_H, Sheet, Stat, YearRow } from "../src/ui";

export default function Dashboard() {
  const router = useRouter();
  const [years, setYears] = useState<Year[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    try {
      const [ys, sum, cur] = await Promise.all([
        listYears(),
        dashboardSummary(),
        getCurrency(),
      ]);
      setYears(ys);
      setSummary(sum);
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

  const onCreate = useCallback(async () => {
    if (!name.trim()) return;
    try {
      await createYear(name);
      setName("");
      setShowNew(false);
      load();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, [name, load]);

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert("Delete year?", "Months inside will be deleted.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteYear(id).then(load),
        },
      ]);
    },
    [load]
  );

  const openSheet = useCallback(() => setShowNew(true), []);
  const closeSheet = useCallback(() => setShowNew(false), []);
  const onName = useCallback((v: string) => setName(v), []);

  if (loading) return <CenterLoad />;
  if (years.length === 0)
    return (
      <View style={s.wrap}>
        <Empty title="No years yet" hint="Create your first year to start tracking." actionTitle="Create year" onAction={openSheet} />
        <Sheet visible={showNew} onClose={closeSheet} title="New year">
          <Field value={name} onChange={onName} placeholder="e.g. 2026" />
          <Btn title="Create" onPress={onCreate} />
        </Sheet>
      </View>
    );

  return (
    <View style={s.wrap}>
      <View style={s.stats}>
        <Stat label="Years" value={String(summary?.year_count ?? 0)} />
        <Stat label="Months" value={String(summary?.month_count ?? 0)} />
      </View>
      <View style={s.stats}>
        <Stat label="Txns" value={String(summary?.total_transactions ?? 0)} />
        <Stat label="Avg/mo" value={formatCurrency(summary?.avg_monthly_spending ?? 0, currency)} />
      </View>
      <View style={s.bar}>
        <Btn title="+ Year" onPress={openSheet} />
        <Btn title="Settings" variant="outline" onPress={() => router.push("/settings")} />
      </View>
      <FlatList
        data={years}
        keyExtractor={(y) => String(y.id)}
        getItemLayout={(_, i) => ({ length: ROW_H, offset: ROW_H * i, index: i })}
        windowSize={7}
        maxToRenderPerBatch={20}
        removeClippedSubviews
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <YearRow
            name={item.name}
            onPress={() => router.push({ pathname: "/years/[yearId]", params: { yearId: String(item.id) } })}
            onDelete={() => onDelete(item.id)}
          />
        )}
      />
      <Sheet visible={showNew} onClose={closeSheet} title="New year">
        <Field value={name} onChange={onName} placeholder="e.g. 2026" />
        <Btn title="Create" onPress={onCreate} />
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 12, gap: 10 },
  stats: { flexDirection: "row", gap: 10 },
  bar: { flexDirection: "row", gap: 8 },
  list: { gap: 8, paddingBottom: 24 },
});
