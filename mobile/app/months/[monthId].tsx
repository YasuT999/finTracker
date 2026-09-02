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
import type { MonthSummary } from "@/src/types";

export default function MonthDetailScreen() {
  const { settings } = useSettings();
  const { monthId } = useLocalSearchParams<{ monthId: string }>();
  const id = Number(monthId);
  const [data, setData] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [groupBudget, setGroupBudget] = useState("");
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.months.get(id)); } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try { await api.groups.create({ month_id: id, name: groupName.trim(), allocated_budget: Number(groupBudget) || 0 }); setGroupName(""); setGroupBudget(""); setShowNew(false); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!data) return <View style={styles.center}><Text>Month not found</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{data.name}</Text>
      <Card><CardContent>
        <Text>Budget {formatCurrency(Number(data.total_budget), settings.currency.symbol)} · Spent {formatCurrency(data.total_expenses, settings.currency.symbol)} · Remaining {formatCurrency(data.remaining_budget, settings.currency.symbol)}</Text>
        <Text>Savings {formatCurrency(data.savings, settings.currency.symbol)} · Utilization {data.utilization_percentage}%</Text>
        <Progress value={data.utilization_percentage} style={{ marginTop: 8 }} />
      </CardContent></Card>

      <View style={styles.header}><Text style={styles.sectionTitle}>Groups</Text><Button size="sm" onPress={() => setShowNew(true)}>+ Group</Button></View>
      {data.groups.length === 0 ? <Text style={styles.empty}>No groups yet</Text> : data.groups.map((g) => (
        <Card key={g.id}>
          <CardContent>
            <Text style={styles.cardTitle}>{g.name}</Text>
            <Text style={styles.cardSub}>Allocated {formatCurrency(Number(g.allocated_budget), settings.currency.symbol)} · Spent {formatCurrency(g.actual_spending, settings.currency.symbol)} · {g.utilization_percentage}%</Text>
            <Progress value={g.utilization_percentage} style={{ marginTop: 6 }} />
            <Link href={`/groups/${g.id}` as any} asChild><Button variant="outline" size="sm" style={{ marginTop: 8 }}>Open →</Button></Link>
          </CardContent>
        </Card>
      ))}

      <Dialog visible={showNew} onClose={() => setShowNew(false)}>
        <DialogHeader><DialogTitle>New Group</DialogTitle></DialogHeader>
        <Input value={groupName} onChangeText={setGroupName} placeholder="Group name" />
        <Input value={groupBudget} onChangeText={setGroupBudget} placeholder="Allocated budget" keyboardType="numeric" />
        <DialogFooter><Button variant="outline" onPress={() => setShowNew(false)}>Cancel</Button><Button onPress={createGroup}>Create</Button></DialogFooter>
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
