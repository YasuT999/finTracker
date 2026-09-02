import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog";
import { useSettings } from "@/src/contexts/SettingsContext";
import { formatCurrency } from "@/src/utils/currency";
import { api } from "@/src/api";
import type { Year, Month } from "@/src/types";

export default function MonthsIndexScreen() {
  const { settings } = useSettings();
  const [years, setYears] = useState<Year[]>([]);
  const [months, setMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [nmName, setNmName] = useState("");
  const [nmBudget, setNmBudget] = useState("");
  const [nmYearId, setNmYearId] = useState<string | undefined>(undefined);
  const [delId, setDelId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const allYears = await api.years.list();
      setYears(allYears);
      if (allYears.length > 0 && !nmYearId) setNmYearId(String(allYears[0].id));
      setMonths(await api.months.list());
    } catch {}
    setLoading(false);
  }, [nmYearId]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCreate = async () => {
    if (!nmYearId || !nmName.trim()) return;
    try {
      await api.months.create({ year_id: Number(nmYearId), name: nmName.trim(), total_budget: Number(nmBudget) || 0 });
      setShowNew(false); setNmName(""); setNmBudget(""); load();
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  const handleCopy = async (id: number) => {
    const m = months.find((x) => x.id === id);
    if (!m) return;
    try { await api.months.copy(id, `${m.name} (Copy)`); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };

  const handleDelete = async () => {
    if (delId === null) return;
    try { await api.months.delete(delId); setDelId(null); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Months</Text>
        <Button onPress={() => setShowNew(true)}>New Month</Button>
      </View>

      {months.length === 0 ? (
        <Card><CardContent><Text style={{ opacity: 0.6, textAlign: "center" }}>No months yet</Text></CardContent></Card>
      ) : (
        months.map((m) => (
          <Card key={m.id}>
            <CardContent>
              <View style={styles.cardHead}>
                <View>
                  <Text style={styles.cardTitle}>{m.name}</Text>
                  <Text style={{ opacity: 0.6, fontSize: 11 }}>{years.find((y) => y.id === m.year_id)?.name ?? "Unknown year"}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Button size="xs" variant="outline" onPress={() => handleCopy(m.id)}>Copy</Button>
                  <Button size="xs" variant="destructive" onPress={() => setDelId(m.id)}>Del</Button>
                </View>
              </View>
              <View style={{ gap: 4, marginTop: 8 }}>
                <Text style={{ fontSize: 12 }}>Budget: {formatCurrency(Number(m.total_budget), settings.currency.symbol)}</Text>
                <Text style={{ fontSize: 12 }}>Income: {formatCurrency(Number(m.total_income), settings.currency.symbol)}</Text>
              </View>
              <Link href={`/months/${m.id}` as any} asChild>
                <Button variant="outline" size="sm" style={{ marginTop: 8 }}>Open →</Button>
              </Link>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog visible={delId !== null} onClose={() => setDelId(null)}>
        <DialogHeader><DialogTitle>Delete Month?</DialogTitle></DialogHeader>
        <Text style={{ opacity: 0.7 }}>This deletes all groups, categories, transactions.</Text>
        <DialogFooter>
          <Button variant="outline" onPress={() => setDelId(null)}>Cancel</Button>
          <Button variant="destructive" onPress={handleDelete}>Delete</Button>
        </DialogFooter>
      </Dialog>

      <Dialog visible={showNew} onClose={() => setShowNew(false)}>
        <DialogHeader><DialogTitle>Create Month</DialogTitle></DialogHeader>
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, opacity: 0.6 }}>Year</Text>
          <Select value={nmYearId} onValueChange={setNmYearId} options={years.map((y) => ({ label: y.name, value: String(y.id) }))} placeholder="Select year" />
          <Text style={{ fontSize: 12, opacity: 0.6 }}>Month Name</Text>
          <Input value={nmName} onChangeText={setNmName} placeholder="e.g. June 2026" />
          <Text style={{ fontSize: 12, opacity: 0.6 }}>Total Budget</Text>
          <Input value={nmBudget} onChangeText={setNmBudget} placeholder="3000" keyboardType="numeric" />
        </View>
        <DialogFooter>
          <Button variant="outline" onPress={() => setShowNew(false)}>Cancel</Button>
          <Button onPress={handleCreate}>Create</Button>
        </DialogFooter>
      </Dialog>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 16, fontWeight: "600" },
});
