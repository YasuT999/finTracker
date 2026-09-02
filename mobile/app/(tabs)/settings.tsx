import { StyleSheet, ScrollView, Pressable, Switch, Alert } from "react-native";
import { Text, View } from "@/components/Themed";
import { useSettings } from "@/src/contexts/SettingsContext";
import { currencies } from "@/src/utils/currency";
import { api } from "@/src/api";

export default function SettingsScreen() {
  const { settings, updateSettings, colorScheme } = useSettings();

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
