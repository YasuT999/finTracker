import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from "react-native";
import { useLocalSearchParams, Link, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { api } from "@/src/api";
import type { GroupDetail } from "@/src/types";

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const id = Number(groupId);
  const [data, setData] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [catName, setCatName] = useState("");

  const load = useCallback(async () => {
    try {
      const g = await api.groups.get(id);
      setData(g);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createCat = async () => {
    if (!catName.trim()) return;
    try {
      await api.categories.create({ group_id: id, name: catName.trim(), allocated_budget: 0 });
      setCatName("");
      load();
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!data) return <View style={styles.center}><Text>Group not found</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{data.name}</Text>
      <View style={styles.card}>
        <Text>Allocated {data.allocated_budget} · Spent {data.actual_spending} · Remaining {data.remaining_budget} · {data.utilization_percentage}%</Text>
      </View>
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="New category" value={catName} onChangeText={setCatName} />
        <Pressable style={styles.addBtn} onPress={createCat}><Text style={styles.addText}>Add</Text></Pressable>
      </View>
      {data.categories.length === 0 ? <Text style={styles.empty}>No categories yet</Text> : data.categories.map((c) => (
        <Link key={c.id} href={`/categories/${c.id}` as any} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>{c.name}</Text>
            <Text style={styles.cardSub}>Budget {c.allocated_budget} · Spent {c.actual_spending} · {c.utilization_percentage}%</Text>
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
