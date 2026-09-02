import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, Link, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog";
import { useSettings } from "@/src/contexts/SettingsContext";
import { formatCurrency } from "@/src/utils/currency";
import { api } from "@/src/api";
import { exportCSV, exportPDF, exportXLSX } from "@/src/utils/export";
import type { Month } from "@/src/types";

export default function YearDetailScreen() {
  const { settings } = useSettings();
  const { yearId } = useLocalSearchParams<{ yearId: string }>();
  const id = Number(yearId);
  const [months, setMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try { setMonths(await api.months.listByYear(id)); } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createMonth = async () => {
    if (!newName.trim()) return;
    try { await api.months.create({ year_id: id, name: newName.trim(), total_budget: Number(newBudget) || 0 }); setNewName(""); setNewBudget(""); setShowNew(false); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };
  const handleCopy = async (mid: number) => {
    const m = months.find((x) => x.id === mid);
    if (!m) return;
    try { await api.months.copy(mid, `${m.name} (Copy)`); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };
  const handleDelete = async () => {
    if (delId === null) return;
    try { await api.months.delete(delId); setDelId(null); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };

  const handleExport = async (kind: "csv" | "xlsx" | "pdf") => {
    try {
      const data = await api.years.getData(id);
      if (!data) return Alert.alert("No data");
      const yearName = (data as any).year?.name ?? String(yearId);
      if (kind === "csv") await exportCSV(data, yearName, settings.currency.symbol);
      if (kind === "xlsx") await exportXLSX(data, yearName, settings.currency.symbol);
      if (kind === "pdf") await exportPDF(data, yearName, settings.currency.symbol);
    } catch (e: any) { Alert.alert("Export failed", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Year #{yearId}</Text>
        <Button onPress={() => setShowNew(true)}>+ Month</Button>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button size="sm" variant="outline" onPress={() => handleExport("csv")}>CSV</Button>
        <Button size="sm" variant="outline" onPress={() => handleExport("xlsx")}>XLSX</Button>
        <Button size="sm" variant="outline" onPress={() => handleExport("pdf")}>PDF</Button>
      </View>
      {months.length === 0 ? <Text style={styles.empty}>No months yet</Text> : months.map((m) => (
        <Card key={m.id}>
          <CardContent>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View><Text style={styles.cardTitle}>{m.name}</Text><Text style={styles.cardSub}>Budget {formatCurrency(Number(m.total_budget), settings.currency.symbol)}</Text></View>
              <View style={{ flexDirection: "row", gap: 6 }}><Button size="xs" variant="outline" onPress={() => handleCopy(m.id)}>Copy</Button><Button size="xs" variant="destructive" onPress={() => setDelId(m.id)}>Del</Button></View>
            </View>
            <Link href={`/months/${m.id}` as any} asChild><Button variant="outline" size="sm" style={{ marginTop: 8 }}>Open →</Button></Link>
          </CardContent>
        </Card>
      ))}
      <Dialog visible={showNew} onClose={() => setShowNew(false)}>
        <DialogHeader><DialogTitle>New Month</DialogTitle></DialogHeader>
        <Input value={newName} onChangeText={setNewName} placeholder="e.g. June 2026" />
        <Input value={newBudget} onChangeText={setNewBudget} placeholder="Budget 3000" keyboardType="numeric" />
        <DialogFooter><Button variant="outline" onPress={() => setShowNew(false)}>Cancel</Button><Button onPress={createMonth}>Create</Button></DialogFooter>
      </Dialog>
      <Dialog visible={delId !== null} onClose={() => setDelId(null)}>
        <DialogHeader><DialogTitle>Delete month?</DialogTitle></DialogHeader>
        <Text>Deletes groups, categories, transactions.</Text>
        <DialogFooter><Button variant="outline" onPress={() => setDelId(null)}>Cancel</Button><Button variant="destructive" onPress={handleDelete}>Delete</Button></DialogFooter>
      </Dialog>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  empty: { opacity: 0.6 },
  cardTitle: { fontWeight: "600" },
  cardSub: { opacity: 0.6, fontSize: 12, marginTop: 4 },
});
