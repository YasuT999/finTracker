import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { setSetting } from "../src/db";
import { useTheme } from "../src/theme";
import { Btn, Card, Field } from "../src/ui";

// Mock local-only login: no backend exists, the name is stored on-device
// and used for greeting. Nothing leaves the phone.
export default function Login() {
  const router = useRouter();
  const t = useTheme();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const onName = useCallback(
    (v: string) => {
      setName(v);
      if (error) setError("");
    },
    [error]
  );

  const submit = useCallback(async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    try {
      await setSetting("profile", name.trim());
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, [name, router]);

  return (
    <View style={[s.wrap, { backgroundColor: t.bg }]}>
      <Text style={[s.h1, { color: t.text }]}>Sign in</Text>
      <Text style={[s.sub, { color: t.sub }]}>Local profile only — stored on this device.</Text>
      <Card>
        <Field value={name} onChange={onName} placeholder="Your name" error={error} />
        <View style={s.gap} />
        <Btn title="Continue" onPress={submit} block />
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 8, justifyContent: "center" },
  h1: { fontSize: 28, fontWeight: "800" },
  sub: { fontSize: 15, marginBottom: 12 },
  gap: { height: 8 },
});
