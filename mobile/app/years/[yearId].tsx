import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from "react-native";
import { useLocalSearchParams, Link, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { api } from "@/src/api";
import type { Month } from "@/src/types";

export default function YearDetailScreen() {
  const { yearId } = useLocalSearchParams<{ yearId: string }>();
  const id = Number(yearId);
  const [months, setMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.months.listByYear(id);
      setMonths(data);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createMonth = async () => {
    if (!newName.trim()) return;
    try {
      await api.months.create({ year_id: id, name: newName.trim(), total_budget: 0 });
      setNewName("");
      load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Year #{yearId} — Months</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="New month name" value={newName} onChangeText={setNewName} />
        <Pressable style={styles.addBtn} onPress={createMonth}><Text style={styles.addText}>Add</Text></Pressable>
      </View>
      {months.length === 0 ? <Text style={styles.empty}>No months yet</Text> : months.map((m) => (
        <Link key={m.id} href={`/months/${m.id}` as any} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>{m.name}</Text>
            <Text style={styles.cardSub}>Budget: {m.total_budget} · Tap for groups</Text>
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
  row: { flexDirection: "row", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10 },
  addBtn: { backgroundColor: "#2f95dc", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addText: { color: "#fff", fontWeight: "600" },
  empty: { opacity: 0.6 },
  card: { padding: 14, borderWidth: 1, borderColor: "#ddd", borderRadius: 10 },
  cardTitle: { fontWeight: "600" },
  cardSub: { opacity: 0.6, fontSize: 12, marginTop: 4 },
});
