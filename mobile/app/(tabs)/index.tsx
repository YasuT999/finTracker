import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog";
import { useSettings } from "@/src/contexts/SettingsContext";
import { formatCurrency } from "@/src/utils/currency";
import { api } from "@/src/api";
import type { DashboardSummary, Year } from "@/src/types";

export default function DashboardScreen() {
  const { settings } = useSettings();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [showYear, setShowYear] = useState(false);
  const [showMonth, setShowMonth] = useState(false);
  const [nyName, setNyName] = useState("");
  const [nmName, setNmName] = useState("");
  const [nmBudget, setNmBudget] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ys, sum] = await Promise.all([api.years.list(), api.dashboard.summary()]);
      setYears(ys); setSummary(sum);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createYear = async () => {
    if (!nyName.trim()) return;
    try { await api.years.create({ name: nyName.trim() }); setNyName(""); setShowYear(false); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };
  const createMonth = async () => {
    if (!nmName.trim() || years.length === 0) return;
    try { await api.months.create({ year_id: years[0].id, name: nmName.trim(), total_budget: Number(nmBudget) || 0 }); setNmName(""); setNmBudget(""); setShowMonth(false); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  if (years.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No Years Yet</Text>
        <Text style={{ opacity: 0.6, textAlign: "center" }}>Create your first year to start tracking.</Text>
        <Button onPress={() => setShowYear(true)}>Create Year</Button>
        <Dialog visible={showYear} onClose={() => setShowYear(false)}>
          <DialogHeader><DialogTitle>Create Year</DialogTitle></DialogHeader>
          <Input value={nyName} onChangeText={setNyName} placeholder="e.g. 2026" />
          <DialogFooter><Button variant="outline" onPress={() => setShowYear(false)}>Cancel</Button><Button onPress={createYear}>Create</Button></DialogFooter>
        </Dialog>
      </View>
    );
  }

  const s = summary;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button size="sm" onPress={() => setShowYear(true)}>+ Year</Button>
          <Button size="sm" variant="outline" onPress={() => setShowMonth(true)}>+ Month</Button>
        </View>
      </View>

      <View style={styles.grid}>
        <Card><CardContent><Text style={styles.statVal}>{s?.year_count ?? 0}</Text><Text style={styles.statLabel}>Years</Text></CardContent></Card>
        <Card><CardContent><Text style={styles.statVal}>{s?.month_count ?? 0}</Text><Text style={styles.statLabel}>Months</Text></CardContent></Card>
        <Card><CardContent><Text style={styles.statVal}>{s?.total_transactions ?? 0}</Text><Text style={styles.statLabel}>Transactions</Text></CardContent></Card>
        <Card><CardContent><Text style={styles.statVal}>{formatCurrency(s?.avg_monthly_spending ?? 0, settings.currency.symbol)}</Text><Text style={styles.statLabel}>Avg Spend</Text></CardContent></Card>
      </View>

      <View style={styles.grid}>
        <Card><CardContent><Text style={styles.smallLabel}>Highest</Text><Text style={styles.bold}>{s?.highest_spend_month?.name ?? "—"}</Text><Text style={styles.sub}>{s?.highest_spend_month ? formatCurrency(s.highest_spend_month.amount, settings.currency.symbol) : ""}</Text></CardContent></Card>
        <Card><CardContent><Text style={styles.smallLabel}>Lowest</Text><Text style={styles.bold}>{s?.lowest_spend_month?.name ?? "—"}</Text><Text style={styles.sub}>{s?.lowest_spend_month ? formatCurrency(s.lowest_spend_month.amount, settings.currency.symbol) : ""}</Text></CardContent></Card>
        <Card><CardContent><Text style={styles.statVal}>{s?.months_over_budget ?? 0}</Text><Text style={styles.statLabel}>Over budget</Text></CardContent></Card>
        <Card><CardContent><Text style={styles.smallLabel}>Top Group</Text><Text style={styles.bold}>{s?.highest_spend_group?.name ?? "—"}</Text><Text style={styles.sub}>{s?.highest_spend_group ? `${formatCurrency(s.highest_spend_group.amount, settings.currency.symbol)} in ${s.highest_spend_group.month}` : ""}</Text></CardContent></Card>
      </View>

      <Link href="/months" asChild><Button variant="outline">Browse All Months →</Button></Link>

      <Dialog visible={showYear} onClose={() => setShowYear(false)}>
        <DialogHeader><DialogTitle>Create Year</DialogTitle></DialogHeader>
        <Input value={nyName} onChangeText={setNyName} placeholder="e.g. 2027" />
        <DialogFooter><Button variant="outline" onPress={() => setShowYear(false)}>Cancel</Button><Button onPress={createYear}>Create</Button></DialogFooter>
      </Dialog>
      <Dialog visible={showMonth} onClose={() => setShowMonth(false)}>
        <DialogHeader><DialogTitle>Create Month</DialogTitle></DialogHeader>
        <Input value={nmName} onChangeText={setNmName} placeholder="e.g. July 2026" />
        <Input value={nmBudget} onChangeText={setNmBudget} placeholder="3000" keyboardType="numeric" />
        <DialogFooter><Button variant="outline" onPress={() => setShowMonth(false)}>Cancel</Button><Button onPress={createMonth}>Create</Button></DialogFooter>
      </Dialog>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statVal: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, opacity: 0.6, textTransform: "uppercase" },
  smallLabel: { fontSize: 11, opacity: 0.6 },
  bold: { fontWeight: "600" },
  sub: { fontSize: 11, opacity: 0.6 },
});
