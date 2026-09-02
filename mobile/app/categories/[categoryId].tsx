import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { api } from "@/src/api";
import type { CategoryDetail } from "@/src/types";

export default function CategoryDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const id = Number(categoryId);
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");

  const load = useCallback(async () => {
    try {
      const c = await api.categories.get(id);
      setData(c);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addTx = async () => {
    const n = Number(amount);
    if (!n || !desc.trim()) return Alert.alert("Error", "Amount and description required");
    try {
      await api.transactions.create({ category_id: id, amount: n, type, description: desc.trim(), date: new Date().toISOString().slice(0, 10) });
      setAmount(""); setDesc("");
      load();
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!data) return <View style={styles.center}><Text>Category not found</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{data.name}</Text>
      <View style={styles.card}>
        <Text>Budget {data.allocated_budget} · Spent {data.actual_spending} · Remaining {data.remaining_budget} · {data.utilization_percentage}%</Text>
      </View>

      <Text style={styles.sectionTitle}>Add transaction</Text>
      <View style={styles.row}>
        <Pressable onPress={() => setType("expense")} style={[styles.chip, type === "expense" && styles.chipActive]}><Text style={type === "expense" ? styles.chipTextActive : undefined}>Expense</Text></Pressable>
        <Pressable onPress={() => setType("income")} style={[styles.chip, type === "income" && styles.chipActive]}><Text style={type === "income" ? styles.chipTextActive : undefined}>Income</Text></Pressable>
      </View>
      <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Description" value={desc} onChangeText={setDesc} />
      <Pressable style={styles.addBtn} onPress={addTx}><Text style={styles.addText}>Add transaction</Text></Pressable>

      <Text style={styles.sectionTitle}>Transactions ({data.transactions.length})</Text>
      {data.transactions.length === 0 ? <Text style={styles.empty}>No transactions yet</Text> : data.transactions.map((t) => (
        <View key={t.id} style={styles.card}>
          <Text>{t.type.toUpperCase()} · {t.amount} · {t.date}</Text>
          <Text style={styles.cardSub}>{t.description}</Text>
          <Pressable onPress={async () => { await api.transactions.delete(t.id); load(); }} style={styles.deleteBtn}><Text style={styles.deleteText}>Delete</Text></Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  card: { padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, gap: 4 },
  cardSub: { opacity: 0.6, fontSize: 12 },
  sectionTitle: { fontWeight: "600", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10 },
  row: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#ddd", borderRadius: 999 },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipTextActive: { color: "#fff" },
  addBtn: { backgroundColor: "#2f95dc", padding: 12, borderRadius: 8, alignItems: "center" },
  addText: { color: "#fff", fontWeight: "600" },
  empty: { opacity: 0.6 },
  deleteBtn: { marginTop: 6, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#fee", borderRadius: 6 },
  deleteText: { color: "#a00", fontSize: 12 },
});
