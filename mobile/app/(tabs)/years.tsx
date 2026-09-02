import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { api } from "@/src/api";
import type { Year } from "@/src/types";

export default function YearsScreen() {
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.years.list();
      setYears(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const create = async () => {
    if (!name.trim()) return;
    try {
      await api.years.create({ name: name.trim() });
      setName("");
      load();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Years</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="New year (e.g. 2027)" value={name} onChangeText={setName} />
        <Pressable style={styles.addBtn} onPress={create}>
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>
      {years.length === 0 ? (
        <Text style={styles.empty}>No years yet. Create one.</Text>
      ) : (
        years.map((y) => (
          <Link key={y.id} href={`/years/${y.id}` as any} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{y.name}</Text>
              <Text style={styles.cardSub}>Tap to view months</Text>
            </Pressable>
          </Link>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10 },
  addBtn: { backgroundColor: "#2f95dc", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addText: { color: "#fff", fontWeight: "600" },
  empty: { opacity: 0.6, marginTop: 12 },
  card: { padding: 14, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  cardSub: { opacity: 0.6, fontSize: 12 },
});
