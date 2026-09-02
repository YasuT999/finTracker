import { StyleSheet, ScrollView, Pressable, Switch, Alert } from "react-native";
import { Text, View } from "@/components/Themed";
import { useEffect, useState } from "react";
import { useSettings } from "@/src/contexts/SettingsContext";
import { currencies } from "@/src/utils/currency";
import { api } from "@/src/api";
import { exportCSV, exportPDF, exportXLSX } from "@/src/utils/export";
import { Select } from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import type { Year } from "@/src/types";

export default function SettingsScreen() {
  const { settings, updateSettings, colorScheme } = useSettings();
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);

  useEffect(() => {
    api.years.list().then((ys) => {
      setYears(ys);
      if (ys.length > 0 && !selectedYear) setSelectedYear(String(ys[0].id));
    }).catch(() => {});
  }, []);

  const handleExport = async (kind: "csv" | "xlsx" | "pdf") => {
    if (!selectedYear) return Alert.alert("No year selected");
    try {
      const data = await api.years.getData(Number(selectedYear));
      if (!data) return Alert.alert("No data");
      const yearName = (data as any).year?.name ?? selectedYear;
      if (kind === "csv") await exportCSV(data, yearName, settings.currency.symbol);
      if (kind === "xlsx") await exportXLSX(data, yearName, settings.currency.symbol);
      if (kind === "pdf") await exportPDF(data, yearName, settings.currency.symbol);
    } catch (e: any) { Alert.alert("Export failed", e.message); }
  };

  const clearData = () => {
    Alert.alert("Clear all data?", "This deletes years, months, groups, categories, transactions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await api.data.clear();
            Alert.alert("Done", "All data cleared");
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance — {colorScheme}</Text>
        <View style={styles.row}>
          <Text>Theme</Text>
          <View style={styles.themeRow}>
            {(["system", "light", "dark"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => updateSettings({ theme: t })}
                style={[styles.chip, settings.theme === t && styles.chipActive]}
              >
                <Text style={settings.theme === t ? styles.chipTextActive : undefined}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.row}>
          <Text>Currency</Text>
          <View style={styles.themeRow}>
            {currencies.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => updateSettings({ currency: c })}
                style={[styles.chip, settings.currency.code === c.code && styles.chipActive]}
              >
                <Text style={settings.currency.code === c.code ? styles.chipTextActive : undefined}>{c.code}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.row}>
          <Text>Auto-copy previous month</Text>
          <Switch value={settings.autoCopyPreviousMonth} onValueChange={(v) => updateSettings({ autoCopyPreviousMonth: v })} />
        </View>
      </View>

      <Card>
        <CardContent>
          <Text style={styles.sectionTitle}>Export</Text>
          <Text style={{ opacity: 0.6, fontSize: 12, marginBottom: 8 }}>Export year data as CSV/XLSX/PDF via share sheet.</Text>
          {years.length > 0 ? <Select value={selectedYear} onValueChange={setSelectedYear} options={years.map((y) => ({ label: y.name, value: String(y.id) }))} placeholder="Select year" /> : <Text style={{ opacity: 0.5 }}>No years yet</Text>}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <Button size="sm" variant="outline" onPress={() => handleExport("csv")}>CSV</Button>
            <Button size="sm" variant="outline" onPress={() => handleExport("xlsx")}>XLSX</Button>
            <Button size="sm" variant="outline" onPress={() => handleExport("pdf")}>PDF</Button>
          </View>
        </CardContent>
      </Card>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: "#d00" }]}>Danger zone</Text>
        <Pressable style={styles.dangerBtn} onPress={clearData}>
          <Text style={styles.dangerText}>Clear all local data</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  section: { gap: 10, padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10 },
  sectionTitle: { fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  themeRow: { flexDirection: "row", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#ddd", borderRadius: 999 },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipTextActive: { color: "#fff" },
  dangerBtn: { backgroundColor: "#fee", padding: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#fcc" },
  dangerText: { color: "#a00", fontWeight: "600" },
});
