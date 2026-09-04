import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { getCurrency, setCurrency } from "../src/db";
import { Btn, C, Card, CenterLoad, Field } from "../src/ui";

const SYMBOLS = ["$", "€", "£", "₹", "¥"];

export default function Settings() {
  const [cur, setCur] = useState("$");
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrency()
      .then(setCur)
      .finally(() => setLoading(false));
  }, []);

  const pick = useCallback(async (s: string) => {
    try {
      await setCurrency(s);
      setCur(s);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, []);

  const saveCustom = useCallback(async () => {
    if (!custom.trim()) return;
    await pick(custom.trim().slice(0, 3));
    setCustom("");
  }, [custom, pick]);

  if (loading) return <CenterLoad />;
  return (
    <View style={s.wrap}>
      <Card>
        <Text style={s.title}>Currency: {cur}</Text>
        <View style={s.row}>
          {SYMBOLS.map((sym) => (
            <Btn
              key={sym}
              title={sym}
              variant={cur === sym ? "primary" : "outline"}
              onPress={() => pick(sym)}
            />
          ))}
        </View>
        <Field value={custom} onChange={setCustom} placeholder="Custom symbol" />
        <Btn title="Save custom" onPress={saveCustom} />
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 12 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  row: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
});
