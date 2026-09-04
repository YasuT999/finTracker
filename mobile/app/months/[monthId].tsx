import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { createGroup, deleteGroup, getCurrency, getMonthSummary, listGroups } from "../../src/db";
import { formatCurrency } from "../../src/format";
import type { GroupWithUtilization, MonthSummary } from "../../src/types";
import { Btn, C, Card, CenterLoad, Empty, Field, GroupRow, Sheet, Stat } from "../../src/ui";

export default function MonthGroups() {
  const { monthId } = useLocalSearchParams<{ monthId: string }>();
  const mid = Number(monthId);
  const router = useRouter();
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [groups, setGroups] = useState<GroupWithUtilization[]>([]);
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, gs, cur] = await Promise.all([
        getMonthSummary(mid),
        listGroups(mid),
        getCurrency(),
      ]);
      setSummary(sum);
      setGroups(gs);
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

  const onCreate = useCallback(async () => {
    if (!name.trim()) return;
    await createGroup(mid, name, Number(budget) || 0);
    setName("");
    setBudget("");
    setShowNew(false);
    load();
  }, [mid, name, budget, load]);

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert("Delete group?", "Categories inside will be deleted.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteGroup(id).then(load) },
      ]);
    },
    [load]
  );

  if (loading) return <CenterLoad />;
  return (
    <View style={s.wrap}>
      <Card>
        <Text style={s.title}>{summary?.name ?? ""}</Text>
        <View style={s.stats}>
          <Stat label="Budget" value={formatCurrency(summary?.total_budget ?? 0, currency)} />
          <Stat label="Spent" value={formatCurrency(summary?.total_expenses ?? 0, currency)} />
        </View>
        <View style={s.stats}>
          <Stat label="Left" value={formatCurrency(summary?.remaining_budget ?? 0, currency)} />
          <Stat label="Used" value={`${summary?.utilization_percentage ?? 0}%`} />
        </View>
      </Card>
      <Btn title="+ Group" onPress={() => setShowNew(true)} />
      {groups.length === 0 ? (
        <Empty title="No groups" hint="Add your first budget group." />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => String(g.id)}
          windowSize={7}
          maxToRenderPerBatch={20}
          removeClippedSubviews
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <GroupRow
              name={item.name}
              meta={`${formatCurrency(item.actual_spending, currency)} of ${formatCurrency(item.allocated_budget, currency)}`}
              utilization={item.utilization_percentage}
              onPress={() => router.push({ pathname: "/groups/[groupId]", params: { groupId: String(item.id) } })}
              onDelete={() => onDelete(item.id)}
            />
          )}
        />
      )}
      <Sheet visible={showNew} onClose={() => setShowNew(false)} title="New group">
        <Field value={name} onChange={setName} placeholder="e.g. Food" />
        <Field value={budget} onChange={setBudget} placeholder="Budget" numeric />
        <Btn title="Create" onPress={onCreate} />
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 12, gap: 10 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  stats: { flexDirection: "row", gap: 8, marginBottom: 8 },
  list: { gap: 8, paddingBottom: 24 },
});
