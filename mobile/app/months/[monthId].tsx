import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from "react-native";
import { useLocalSearchParams, Link, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { api } from "@/src/api";
import type { MonthSummary } from "@/src/types";

export default function MonthDetailScreen() {
  const { monthId } = useLocalSearchParams<{ monthId: string }>();
  const id = Number(monthId);
  const [data, setData] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");

  const load = useCallback(async () => {
    try {
      const m = await api.months.get(id);
      setData(m);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      await api.groups.create({ month_id: id, name: groupName.trim(), allocated_budget: 0 });
      setGroupName("");
      load();
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!data) return <View style={styles.center}><Text>Month not found</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{data.name}</Text>
      <View style={styles.card}>
        <Text>Budget: {data.total_budget} · Spent: {data.total_expenses} · Remaining: {data.remaining_budget}</Text>
        <Text>Savings: {data.savings} · Utilization: {data.utilization_percentage}%</Text>
      </View>
      <Text style={styles.sectionTitle}>Groups</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="New group name" value={groupName} onChangeText={setGroupName} />
        <Pressable style={styles.addBtn} onPress={createGroup}><Text style={styles.addText}>Add</Text></Pressable>
      </View>
      {data.groups.length === 0 ? <Text style={styles.empty}>No groups yet</Text> : data.groups.map((g) => (
        <Link key={g.id} href={`/groups/${g.id}` as any} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>{g.name}</Text>
            <Text style={styles.cardSub}>Allocated {g.allocated_budget} · Spent {g.actual_spending} · {g.utilization_percentage}%</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  card: { padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, gap: 4 },
  cardTitle: { fontWeight: "600" },
  cardSub: { opacity: 0.6, fontSize: 12 },
  sectionTitle: { fontWeight: "600", marginTop: 8 },
  row: { flexDirection: "row", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10 },
  addBtn: { backgroundColor: "#2f95dc", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addText: { color: "#fff", fontWeight: "600" },
  empty: { opacity: 0.6 },
});
