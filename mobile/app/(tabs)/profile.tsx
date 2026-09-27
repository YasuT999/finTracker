import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";
import {
  MAX_PHOTO_BYTES,
  clearProfile,
  getCurrency,
  getProfile,
  getProfilePhoto,
  setCurrency,
  setProfilePhoto,
  type Profile,
} from "../../src/db";
import { useMode, useTheme } from "../../src/theme";
import { Avatar, Btn, Card, Chip, Field, Segmented, useTopPad } from "../../src/ui";

const SYMBOLS = ["$", "€", "£", "₹", "¥"];

export default function ProfileScreen() {
  const router = useRouter();
  const t = useTheme();
  const { mode, setMode } = useMode();
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cur, setCur] = useState("$");
  const [custom, setCustom] = useState("");
  const topPad = useTopPad();

  useEffect(() => {
    Promise.all([getProfile(), getProfilePhoto(), getCurrency()]).then(([p, uri, c]) => {
      setProfileState(p);
      setPhoto(uri);
      setCur(c);
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

  const changePhoto = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Allow photo access to set a profile picture.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      let bytes = asset.fileSize ?? 0;
      if (!bytes) {
        try {
          bytes = new File(asset.uri).size;
        } catch {
          bytes = 0;
        }
      }
      if (bytes > MAX_PHOTO_BYTES) {
        Alert.alert("Too large", "Please choose a photo under 1 MB.");
        return;
      }
      const dest = new File(Paths.document, "profile-photo.jpg");
      try {
        if (dest.exists) dest.delete();
        await new File(asset.uri).copy(dest);
        await setProfilePhoto(dest.uri);
        setPhoto(dest.uri);
      } catch {
        // keep the picked copy if the move fails (e.g. same location)
        await setProfilePhoto(asset.uri);
        setPhoto(asset.uri);
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, []);

  const signOut = useCallback(() => {
    Alert.alert("Sign out?", "Your data stays on this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await clearProfile();
          router.replace("/login");
        },
      },
    ]);
  }, [router]);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={[s.wrap, { paddingTop: topPad }]}>
      <Text style={[s.h1, { color: t.text }]}>Profile</Text>
      <Card>
        <View style={s.idRow}>
          <Pressable onPress={changePhoto} hitSlop={8}>
            <Avatar uri={photo} name={profile?.name ?? "?"} size={72} />
          </Pressable>
          <View style={s.grow}>
            <Text style={[s.name, { color: t.text }]}>{profile?.name ?? "—"}</Text>
            <Text style={[s.sub, { color: t.sub }]}>
              {[profile?.age && `${profile.age} yrs`, profile?.gender].filter(Boolean).join(" · ") || " "}
            </Text>
            <Btn title="Change photo" variant="ghost" size="sm" onPress={changePhoto} />
          </View>
        </View>
        {profile?.email ? <Text style={[s.row, { color: t.sub }]}>{profile.email}</Text> : null}
        {profile?.mobile ? <Text style={[s.row, { color: t.sub }]}>{profile.mobile}</Text> : null}
      </Card>
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
  h1: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  idRow: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 8 },
  grow: { flex: 1, gap: 6 },
  name: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  sub: { fontSize: 14 },
  row: { fontSize: 15, marginTop: 4 },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
});
