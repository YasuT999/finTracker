import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { createMonth, deleteMonth, getCurrency, listMonths } from "../../src/db";
import { formatCurrency } from "../../src/format";
import { PAGE_SIZE, type Month } from "../../src/types";
import { Btn, C, CenterLoad, Empty, Field, MonthRow, ROW_H, Sheet } from "../../src/ui";

export default function YearMonths() {
  const { yearId } = useLocalSearchParams<{ yearId: string }>();
  const yid = Number(yearId);
  const router = useRouter();
  const [months, setMonths] = useState<Month[]>([]);
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [page, cur] = await Promise.all([
        listMonths(yid, PAGE_SIZE, 0),
        getCurrency(),
      ]);
      setMonths(page);
      setCurrencyState(cur);
      setHasMore(page.length === PAGE_SIZE);
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

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await listMonths(yid, PAGE_SIZE, months.length);
      setMonths((p) => [...p, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, yid, months.length]);

  const onCreate = useCallback(async () => {
    if (!name.trim()) return;
    try {
      await createMonth(yid, name, Number(budget) || 0);
      setName("");
      setBudget("");
      setShowNew(false);
      load();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, [yid, name, budget, load]);

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
  return (
    <View style={s.wrap}>
      <Btn title="+ Month" onPress={() => setShowNew(true)} />
      {months.length === 0 ? (
        <Empty title="No months" hint="Add your first month." />
      ) : (
        <FlatList
          data={months}
          keyExtractor={(m) => String(m.id)}
          getItemLayout={(_, i) => ({ length: ROW_H, offset: ROW_H * i, index: i })}
          windowSize={7}
          maxToRenderPerBatch={20}
          removeClippedSubviews
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <MonthRow
              name={item.name}
              budget={formatCurrency(item.total_budget, currency)}
              onPress={() => router.push({ pathname: "/months/[monthId]", params: { monthId: String(item.id) } })}
              onDelete={() => onDelete(item.id)}
            />
          )}
        />
      )}
      <Sheet visible={showNew} onClose={() => setShowNew(false)} title="New month">
        <Field value={name} onChange={setName} placeholder="e.g. July 2026" />
        <Field value={budget} onChange={setBudget} placeholder="Budget" numeric />
        <Btn title="Create" onPress={onCreate} />
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 12, gap: 10 },
  list: { gap: 8, paddingBottom: 24 },
});
