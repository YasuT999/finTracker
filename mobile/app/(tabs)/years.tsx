import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { createYear, deleteYear, getCurrency, yearStats, type YearStat } from "../../src/db";
import { formatCurrency } from "../../src/format";
import { useTheme } from "../../src/theme";
import { Btn, CenterLoad, EmptyState, FAB, Field, Sheet, Toast, YearCard, useTopPad } from "../../src/ui";

export default function Years() {
  const router = useRouter();
  const t = useTheme();
  const topPad = useTopPad();
  const [years, setYears] = useState<YearStat[]>([]);
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [ys, cur] = await Promise.all([yearStats(), getCurrency()]);
      setYears(ys);
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

  const say = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const onCreate = useCallback(async () => {
    if (!name.trim()) return;
    try {
      await createYear(name);
      setName("");
      setShowNew(false);
      load();
      say("Saved ✓");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, [name, load, say]);

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
  return (
    <View style={[s.wrap, { backgroundColor: t.bg, paddingTop: topPad }]}>
      <Text style={[s.h1, { color: t.text }]}>Years</Text>
      {years.length === 0 ? (
        <EmptyState
          title="No years yet"
          hint="Create your first year to start tracking."
          actionTitle="Create year"
          onAction={openSheet}
        />
      ) : (
        <FlatList
          data={years}
          keyExtractor={(y) => String(y.id)}
          windowSize={7}
          maxToRenderPerBatch={20}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <YearCard
              name={item.name}
              meta={`${item.months} months · ${formatCurrency(item.saved, currency)} saved`}
              onPress={() => router.push({ pathname: "/years/[yearId]", params: { yearId: String(item.id) } })}
              onDelete={() => onDelete(item.id)}
            />
          )}
        />
      )}
      <FAB onPress={openSheet} label="Add year" />
      <Sheet visible={showNew} onClose={closeSheet} title="Add year">
        <Field value={name} onChange={onName} placeholder="e.g. 2026" />
        <Btn title="Save" onPress={onCreate} block />
      </Sheet>
      <Toast message={toast} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20 },
  h1: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5, marginBottom: 12 },
  list: { gap: 12, paddingBottom: 96 },
});
