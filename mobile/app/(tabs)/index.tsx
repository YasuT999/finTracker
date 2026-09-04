import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { createYear, deleteYear, getCurrency, getSetting, yearStats, type YearStat } from "../../src/db";
import { formatCurrency } from "../../src/format";
import { useTheme } from "../../src/theme";
import { Btn, CenterLoad, EmptyState, FAB, Field, Sheet, Toast, YearCard } from "../../src/ui";

export default function Home() {
  const router = useRouter();
  const t = useTheme();
  const [years, setYears] = useState<YearStat[]>([]);
  const [profile, setProfile] = useState("");
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [ys, cur, prof] = await Promise.all([yearStats(), getCurrency(), getSetting("profile")]);
      setYears(ys);
      setCurrencyState(cur);
      setProfile(prof ?? "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const say = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const onCreate = useCallback(async () => {
    if (!name.trim()) return;
    try {
      await createYear(name);
      setName("");
      setShowNew(false);
      load();
      say("Saved ✓");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, [name, load, say]);

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert("Delete year?", "Months inside will be deleted.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteYear(id).then(load),
        },
      ]);
    },
    [load]
  );

  const openSheet = useCallback(() => setShowNew(true), []);
  const closeSheet = useCallback(() => setShowNew(false), []);
  const onName = useCallback((v: string) => setName(v), []);

  if (loading) return <CenterLoad />;
  return (
    <View style={[s.wrap, { backgroundColor: t.bg }]}>
      <View style={s.head}>
        <View>
          <Text style={[s.h1, { color: t.text }]}>My Years</Text>
          {profile ? <Text style={[s.hello, { color: t.sub }]}>Hello, {profile}</Text> : null}
        </View>
      </View>
      {years.length === 0 ? (
        <EmptyState
          title="No years yet"
          hint="Create your first year to start tracking."
          actionTitle="Create year"
          onAction={openSheet}
        />
      ) : (
        <FlatList
          data={years}
          keyExtractor={(y) => String(y.id)}
          windowSize={7}
          maxToRenderPerBatch={20}
          removeClippedSubviews
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <YearCard
              name={item.name}
              meta={`${item.months} months · ${formatCurrency(item.saved, currency)} saved`}
              onPress={() => router.push({ pathname: "/years/[yearId]", params: { yearId: String(item.id) } })}
              onDelete={() => onDelete(item.id)}
            />
          )}
        />
      )}
      <FAB onPress={openSheet} label="Add year" />
      <Sheet visible={showNew} onClose={closeSheet} title="Add year">
        <Field value={name} onChange={onName} placeholder="e.g. 2026" />
        <Btn title="Save" onPress={onCreate} block />
      </Sheet>
      <Toast message={toast} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  h1: { fontSize: 28, fontWeight: "800" },
  hello: { fontSize: 15, marginTop: 2 },
  list: { gap: 12, paddingBottom: 96 },
});
