import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Progress } from "@/src/components/ui/progress";
import { useSettings } from "@/src/contexts/SettingsContext";
import { formatCurrency } from "@/src/utils/currency";
import { api } from "@/src/api";
import type { CategoryDetail } from "@/src/types";

export default function CategoryDetailScreen() {
  const { settings } = useSettings();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const id = Number(categoryId);
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");

  const load = useCallback(async () => {
    try { setData(await api.categories.get(id)); } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addTx = async () => {
    const n = Number(amount);
    if (!n || !desc.trim()) return Alert.alert("Error", "Amount and description required");
    try { await api.transactions.create({ category_id: id, amount: n, type, description: desc.trim(), date: new Date().toISOString().slice(0, 10) }); setAmount(""); setDesc(""); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!data) return <View style={styles.center}><Text>Category not found</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{data.name}</Text>
      <Card><CardContent><Text>Budget {formatCurrency(Number(data.allocated_budget), settings.currency.symbol)} · Spent {formatCurrency(data.actual_spending, settings.currency.symbol)} · Remaining {formatCurrency(data.remaining_budget, settings.currency.symbol)} · {data.utilization_percentage}%</Text><Progress value={data.utilization_percentage} style={{ marginTop: 8 }} /></CardContent></Card>

      <Text style={styles.sectionTitle}>Add transaction</Text>
      <View style={styles.row}>
        <Button variant={type === "expense" ? "default" : "outline"} size="sm" onPress={() => setType("expense")}>Expense</Button>
        <Button variant={type === "income" ? "default" : "outline"} size="sm" onPress={() => setType("income")}>Income</Button>
      </View>
      <Input placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Input placeholder="Description" value={desc} onChangeText={setDesc} />
      <Button onPress={addTx}>Add transaction</Button>

      <Text style={styles.sectionTitle}>Transactions ({data.transactions.length})</Text>
      {data.transactions.length === 0 ? <Text style={styles.empty}>No transactions yet</Text> : data.transactions.map((t) => (
        <Card key={t.id}><CardContent>
          <Text>{t.type.toUpperCase()} · {formatCurrency(Number(t.amount), settings.currency.symbol)} · {t.date}</Text>
          <Text style={styles.cardSub}>{t.description}</Text>
          <Button size="xs" variant="destructive" style={{ marginTop: 6, alignSelf: "flex-start" }} onPress={async () => { await api.transactions.delete(t.id); load(); }}>Delete</Button>
        </CardContent></Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  cardSub: { opacity: 0.6, fontSize: 12 },
  sectionTitle: { fontWeight: "600", marginTop: 8 },
  row: { flexDirection: "row", gap: 8 },
  empty: { opacity: 0.6 },
});
