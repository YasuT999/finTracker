import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { setProfile } from "../src/db";
import { useTheme } from "../src/theme";
import { Btn, Card, Field, Segmented, useTopPad } from "../src/ui";

const GENDERS = ["Female", "Male", "Other"];

// Local-only profile: stored on-device in _meta, nothing leaves the phone.
// Route stays /login so existing redirects keep working.
export default function Login() {
  const router = useRouter();
  const t = useTheme();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const topPad = useTopPad();

  const submit = useCallback(async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter your name";
    const ageNum = Number(age);
    if (!age.trim()) e.age = "Please enter your age";
    else if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120)
      e.age = "Enter a valid age (1–120)";
    if (!gender) e.gender = "Please choose one";
    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) e.email = "Enter a valid email";
    if (mobile.trim() && mobile.replace(/[\s+\-()]/g, "").replace(/\d/g, "").length > 0)
      e.mobile = "Digits only";
    else if (mobile.trim() && mobile.replace(/\D/g, "").length < 7)
      e.mobile = "Enter at least 7 digits";
    setErrs(e);
    if (Object.keys(e).length > 0) return;
    try {
      await setProfile({
        name: name.trim(),
        age: String(ageNum),
        gender,
        email: email.trim(),
        mobile: mobile.trim(),
      });
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  }, [name, age, gender, email, mobile, router]);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={[s.wrap, { paddingTop: topPad }]}>
      <Text style={[s.h1, { color: t.text }]}>Your profile</Text>
      <Text style={[s.sub, { color: t.sub }]}>Stored only on this device.</Text>
      <Card>
        <View style={s.gap}>
          <Field value={name} onChange={setName} placeholder="Name" error={errs.name} />
          <Field value={age} onChange={setAge} placeholder="Age" numeric error={errs.age} />
          <Segmented options={GENDERS} value={gender} onChange={setGender} />
          {errs.gender ? <Text style={[s.err, { color: t.danger }]}>{errs.gender}</Text> : null}
          <Field value={email} onChange={setEmail} placeholder="Email (optional)" error={errs.email} />
          <Field value={mobile} onChange={setMobile} placeholder="Mobile (optional)" numeric error={errs.mobile} />
          <Btn title="Continue" onPress={submit} block />
        </View>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, padding: 20, gap: 8, justifyContent: "center" },
  h1: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  sub: { fontSize: 15, marginBottom: 12 },
  gap: { gap: 10 },
  err: { fontSize: 12 },
});
