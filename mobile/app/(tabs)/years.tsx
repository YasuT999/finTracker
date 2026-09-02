import { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { Text, View } from "@/components/Themed";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog";
import { api } from "@/src/api";
import type { Year } from "@/src/types";

export default function YearsScreen() {
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [delId, setDelId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try { setYears(await api.years.list()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    if (!name.trim()) return;
    try { await api.years.create({ name: name.trim() }); setName(""); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };
  const remove = async () => {
    if (delId === null) return;
    try { await api.years.delete(delId); setDelId(null); load(); } catch (e: any) { Alert.alert("Error", e.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Years</Text>
      <View style={styles.row}>
        <Input style={{ flex: 1 }} placeholder="New year (e.g. 2027)" value={name} onChangeText={setName} />
        <Button onPress={create}>Add</Button>
      </View>
      {years.length === 0 ? <Text style={styles.empty}>No years yet. Create one.</Text> : years.map((y) => (
        <Card key={y.id}>
          <CardContent>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={styles.cardTitle}>{y.name}</Text>
                <Text style={styles.cardSub}>Tap to view months</Text>
              </View>
              <Button size="xs" variant="destructive" onPress={() => setDelId(y.id)}>Delete</Button>
            </View>
            <Link href={`/years/${y.id}` as any} asChild><Button variant="outline" size="sm" style={{ marginTop: 8 }}>Open →</Button></Link>
          </CardContent>
        </Card>
      ))}
      <Dialog visible={delId !== null} onClose={() => setDelId(null)}>
        <DialogHeader><DialogTitle>Delete Year?</DialogTitle></DialogHeader>
        <Text style={{ opacity: 0.7 }}>This will delete the year. Months remain orphaned — delete months separately.</Text>
        <DialogFooter><Button variant="outline" onPress={() => setDelId(null)}>Cancel</Button><Button variant="destructive" onPress={remove}>Delete</Button></DialogFooter>
      </Dialog>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  empty: { opacity: 0.6, marginTop: 12 },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  cardSub: { opacity: 0.6, fontSize: 12 },
});
