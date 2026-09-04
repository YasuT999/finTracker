import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { createCategory, deleteCategory, getCurrency, listCategories } from "../../src/db";
import { formatCurrency } from "../../src/format";
import type { CategorySummary } from "../../src/types";
import { Btn, C, CategoryRow, CenterLoad, Empty, Field, Sheet } from "../../src/ui";

export default function GroupCategories() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const gid = Number(groupId);
  const router = useRouter();
  const [cats, setCats] = useState<CategorySummary[]>([]);
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cs, cur] = await Promise.all([listCategories(gid), getCurrency()]);
      setCats(cs);
      setCurrencyState(cur);
    } finally {
      setLoading(false);
    }
  }, [gid]);

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
    await createCategory(gid, name, Number(budget) || 0);
    setName("");
    setBudget("");
    setShowNew(false);
    load();
  }, [gid, name, budget, load]);

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert("Delete category?", "Transactions inside will be deleted.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteCategory(id).then(load) },
      ]);
    },
    [load]
  );

  if (loading) return <CenterLoad />;
  return (
    <View style={s.wrap}>
      <Btn title="+ Category" onPress={() => setShowNew(true)} />
      {cats.length === 0 ? (
        <Empty title="No categories" hint="Add your first category." />
      ) : (
        <FlatList
          data={cats}
          keyExtractor={(c) => String(c.id)}
          windowSize={7}
          maxToRenderPerBatch={20}
          removeClippedSubviews
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <CategoryRow
              name={item.name}
              meta={`${formatCurrency(item.actual_spending, currency)} of ${formatCurrency(item.allocated_budget, currency)}`}
              utilization={item.utilization_percentage}
              onPress={() =>
                router.push({ pathname: "/categories/[categoryId]", params: { categoryId: String(item.id) } })
              }
              onDelete={() => onDelete(item.id)}
            />
          )}
        />
      )}
      <Sheet visible={showNew} onClose={() => setShowNew(false)} title="New category">
        <Field value={name} onChange={setName} placeholder="e.g. Groceries" />
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
