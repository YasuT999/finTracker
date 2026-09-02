import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, Link, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Progress } from "@/src/components/ui/progress";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog";
import { useSettings } from "@/src/contexts/SettingsContext";
import { formatCurrency } from "@/src/utils/currency";
import { api } from "@/src/api";
import type { GroupDetail } from "@/src/types";

export default function GroupDetailScreen() {
  const { settings } = useSettings();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const id = Number(groupId);
  const [data, setData] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [catName, setCatName] = useState("");
  const [catBudget, setCatBudget] = useState("");
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.groups.get(id)); } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createCat = async () => {
    if (!catName.trim()) return;
    try { await api.categories.create({ group_id: id, name: catName.trim(), allocated_budget: Number(catBudget) || 0 }); setCatName(""); setCatBudget(""); setShowNew(false); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!data) return <View style={styles.center}><Text>Group not found</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{data.name}</Text>
      <Card><CardContent><Text>Allocated {formatCurrency(Number(data.allocated_budget), settings.currency.symbol)} · Spent {formatCurrency(data.actual_spending, settings.currency.symbol)} · Remaining {formatCurrency(data.remaining_budget, settings.currency.symbol)} · {data.utilization_percentage}%</Text><Progress value={data.utilization_percentage} style={{ marginTop: 8 }} /></CardContent></Card>
      <View style={styles.header}><Text style={styles.sectionTitle}>Categories</Text><Button size="sm" onPress={() => setShowNew(true)}>+ Category</Button></View>
      {data.categories.length === 0 ? <Text style={styles.empty}>No categories yet</Text> : data.categories.map((c) => (
        <Card key={c.id}>
          <CardContent>
            <Text style={styles.cardTitle}>{c.name}</Text>
            <Text style={styles.cardSub}>Budget {formatCurrency(Number(c.allocated_budget), settings.currency.symbol)} · Spent {formatCurrency(c.actual_spending, settings.currency.symbol)} · {c.utilization_percentage}%</Text>
            <Progress value={c.utilization_percentage} style={{ marginTop: 6 }} />
            <Link href={`/categories/${c.id}` as any} asChild><Button variant="outline" size="sm" style={{ marginTop: 8 }}>Open →</Button></Link>
          </CardContent>
        </Card>
      ))}
      <Dialog visible={showNew} onClose={() => setShowNew(false)}>
        <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
        <Input value={catName} onChangeText={setCatName} placeholder="Category name" />
        <Input value={catBudget} onChangeText={setCatBudget} placeholder="Budget" keyboardType="numeric" />
        <DialogFooter><Button variant="outline" onPress={() => setShowNew(false)}>Cancel</Button><Button onPress={createCat}>Create</Button></DialogFooter>
      </Dialog>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontWeight: "600" },
  cardTitle: { fontWeight: "600" },
  cardSub: { opacity: 0.6, fontSize: 12 },
  empty: { opacity: 0.6 },
});
