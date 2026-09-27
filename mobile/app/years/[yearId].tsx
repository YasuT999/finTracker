import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { createMonth, deleteMonth, getCurrency, listMonthsWithNet, listYears, type MonthNet } from "../../src/db";
import type { Year } from "../../src/types";
import { formatCurrency } from "../../src/format";
import { useTheme } from "../../src/theme";
import { Btn, Card, CenterLoad, EmptyState, FAB, Field, MiniBars, MonthCard, Sheet, Toast, useTopPad } from "../../src/ui";

export default function YearMonths() {
  const { yearId } = useLocalSearchParams<{ yearId: string }>();
  const yid = Number(yearId);
  const router = useRouter();
  const t = useTheme();
  const [years, setYears] = useState<Year[]>([]);
  const [months, setMonths] = useState<MonthNet[]>([]);
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
      const [ys, ms, cur] = await Promise.all([
        listYears(),
        listMonthsWithNet(yid),
        getCurrency(),
      ]);
      setYears(ys);
      setMonths(ms);
      setCurrencyState(cur);
    } finally {
      setLoading(false);
    }
  }, [yid]);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const say = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const onCreate = useCallback(async () => {
    if (!name.trim()) return;
    try {
      await createMonth(yid, name, Number(budget) || 0);
      setName("");
      setBudget("");
      setShowNew(false);
      load();
      say("Saved ✓");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, [yid, name, budget, load, say]);

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert("Delete month?", "Groups inside will be deleted.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMonth(id).then(load) },
      ]);
    },
    [load]
  );

  if (loading) return <CenterLoad />;
  const current = years.find((y) => y.id === yid);
  return (
    <View style={[s.wrap, { backgroundColor: t.bg, paddingTop: topPad }]}>
      <Text style={[s.h1, { color: t.text }]}>{current?.name ?? "Months"}</Text>
      {months.length > 0 ? (
        <Card>
          <Text style={[s.h2, { color: t.text }]}>Balance per month</Text>
          <MiniBars values={months.map((m) => m.net)} />
        </Card>
      ) : null}
      {months.length === 0 ? (
        <EmptyState title="No months" hint="Add your first month." />
      ) : (
        <FlatList
          data={months}
          numColumns={2}
          keyExtractor={(m) => String(m.id)}
          windowSize={7}
          maxToRenderPerBatch={20}
          removeClippedSubviews
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          renderItem={({ item }) => (
            <MonthCard
              name={item.name}
              net={formatCurrency(item.net, currency)}
              positive={item.net >= 0}
              onPress={() => router.push({ pathname: "/months/[monthId]", params: { monthId: String(item.id) } })}
              onDelete={() => onDelete(item.id)}
            />
          )}
        />
      )}
      <FAB onPress={() => setShowNew(true)} label="Add month" />
      <Sheet visible={showNew} onClose={() => setShowNew(false)} title="Add month">
        <Field value={name} onChange={setName} placeholder="e.g. July 2026" />
        <Field value={budget} onChange={setBudget} placeholder="Budget" numeric />
        <Btn title="Save" onPress={onCreate} block />
      </Sheet>
      <Toast message={toast} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20 },
  h1: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5, marginBottom: 8 },
  h2: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  grid: { gap: 12, paddingBottom: 96 },
  row: { gap: 12 },
});
