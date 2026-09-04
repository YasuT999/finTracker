import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getCurrency, getSetting, setCurrency, setSetting } from "../../src/db";
import { useMode, useTheme } from "../../src/theme";
import { Btn, Card, Chip, Field, Segmented } from "../../src/ui";

const SYMBOLS = ["$", "€", "£", "₹", "¥"];

export default function Settings() {
  const router = useRouter();
  const t = useTheme();
  const { mode, setMode } = useMode();
  const [cur, setCur] = useState("$");
  const [custom, setCustom] = useState("");
  const [profile, setProfile] = useState("");

  useEffect(() => {
    Promise.all([getCurrency(), getSetting("profile")]).then(([c, p]) => {
      setCur(c);
      setProfile(p ?? "");
    });
  }, []);

  const pick = useCallback(async (sym: string) => {
    try {
      await setCurrency(sym);
      setCur(sym);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, []);

  const saveCustom = useCallback(async () => {
    if (!custom.trim()) return;
    await pick(custom.trim().slice(0, 3));
    setCustom("");
  }, [custom, pick]);

  const onCustom = useCallback((v: string) => setCustom(v), []);
  const onMode = useCallback((v: string) => setMode(v === "Light" ? "light" : "dark"), [setMode]);

  const signOut = useCallback(() => {
    Alert.alert("Sign out?", "Your data stays on this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await setSetting("profile", "");
          router.replace("/login");
        },
      },
    ]);
  }, [router]);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={s.wrap}>
      <Text style={[s.h1, { color: t.text }]}>Settings</Text>
      {profile ? (
        <Card>
          <Text style={[s.row, { color: t.text }]}>Signed in as {profile}</Text>
        </Card>
      ) : null}
      <Card>
        <Text style={[s.h2, { color: t.text }]}>Appearance</Text>
        <Segmented options={["Dark", "Light"]} value={mode === "dark" ? "Dark" : "Light"} onChange={onMode} />
      </Card>
      <Card>
        <Text style={[s.h2, { color: t.text }]}>Currency: {cur}</Text>
        <View style={s.chips}>
          {SYMBOLS.map((sym) => (
            <Chip key={sym} label={sym} selected={cur === sym} onPress={() => pick(sym)} />
          ))}
        </View>
        <Field value={custom} onChange={onCustom} placeholder="Custom symbol" />
        <Btn title="Save custom" onPress={saveCustom} />
      </Card>
      <Btn title="Sign out" variant="ghost" onPress={signOut} block />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, gap: 12, paddingBottom: 32 },
  h1: { fontSize: 28, fontWeight: "800" },
  h2: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  row: { fontSize: 15, fontWeight: "600" },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
});
