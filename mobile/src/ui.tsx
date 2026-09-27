// Stateless presentational library (Figma spec §4).
// Rules: props in, UI out. No useState/useEffect inside.
// Exception: useTheme() context reads are allowed (theme flips rarely,
// never per-frame). State lives in screens, data in src/db.ts.
import { memo, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CHART_COLORS, R, useTheme } from "./theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ROW_H = 72;
export const TXN_H = 72;
export const MONTH_CARD_H = 96;

// Top clearance: 12px below the notification bar / notch on every device.
export function useTopPad(): number {
  const insets = useSafeAreaInsets();
  return insets.top + 12;
}

// ---------- buttons ----------

export const Btn = memo(function Btn(props: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
  block?: boolean;
}) {
  const t = useTheme();
  const v = props.variant ?? "primary";
  const sm = props.size === "sm";
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        s.btn,
        { backgroundColor: v === "primary" ? t.primary : "transparent" },
        v === "ghost" && { borderWidth: 1, borderColor: t.border },
        v === "danger" && { backgroundColor: t.danger },
        sm ? s.btnSm : s.btnMd,
        props.block && s.block,
      ]}
    >
      <Text
        style={[
          s.btnText,
          sm && s.btnTextSm,
          { color: v === "primary" ? t.onPrimary : v === "danger" ? "#FFFFFF" : t.text },
        ]}
      >
        {props.title}
      </Text>
    </Pressable>
  );
});

export const FAB = memo(function FAB(props: { onPress: () => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={props.onPress}
      style={s.fab}
      accessibilityLabel={props.label}
    >
      <LinearGradient
        colors={[t.primary, t.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={s.fabGrad}
      >
        <MaterialIcons name="add" size={28} color={t.onPrimary} />
      </LinearGradient>
    </Pressable>
  );
});

// ---------- cards / stats ----------

export const Card = memo(function Card(props: { children: ReactNode }) {
  const t = useTheme();
  return <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>{props.children}</View>;
});

export const Stat = memo(function Stat(props: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={s.statGrow}>
      <Text style={[s.statVal, { color: t.text }]} numberOfLines={1}>
        {props.value}
      </Text>
      <Text style={[s.statLabel, { color: t.sub }]}>{props.label}</Text>
    </View>
  );
});

// ---------- progress + charts (View-based, zero deps) ----------

export const Bar = memo(function Bar(props: { value: number }) {
  const t = useTheme();
  const w = Math.max(0, Math.min(100, props.value));
  return (
    <View style={[s.barTrack, { backgroundColor: t.border }]}>
      <View style={[s.barFill, { width: `${w}%`, backgroundColor: t.primary }]} />
    </View>
  );
});

export const BarChart = memo(function BarChart(props: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}) {
  const t = useTheme();
  const h = props.height ?? 140;
  const max = Math.max(1, ...props.data.map((d) => d.value));
  return (
    <View style={[s.chartRow, { height: h }]}>
      {props.data.map((d, i) => (
        <View key={i} style={s.chartCol}>
          <View style={[s.chartBarWrap, { height: h - 24 }]}>
            <View
              style={{
                width: 18,
                borderRadius: 4,
                height: Math.max(4, (d.value / max) * (h - 24)),
                backgroundColor: d.color ?? t.primary,
              }}
            />
          </View>
          <Text style={[s.chartLabel, { color: t.sub }]} numberOfLines={1}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

export const MiniBars = memo(function MiniBars(props: { values: number[]; height?: number }) {
  const t = useTheme();
  const h = props.height ?? 72;
  const max = Math.max(1, ...props.values.map((v) => Math.abs(v)));
  return (
    <View style={[s.miniRow, { height: h }]}>
      {props.values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            borderRadius: 2,
            height: Math.max(3, (Math.abs(v) / max) * h),
            backgroundColor: v > 0 ? t.success : v < 0 ? t.danger : t.border,
            opacity: v === 0 ? 0.4 : 1,
          }}
        />
      ))}
    </View>
  );
});

// Donut = proportional tick ring (72 ticks, no deps) + center label + legend.
const TICKS = 72;
export const DonutChart = memo(function DonutChart(props: {
  data: { name: string; amount: number }[];
  size?: number;
  centerLabel: string;
  format: (n: number) => string;
}) {
  const t = useTheme();
  const D = props.size ?? 168;
  const RING = 16;
  const r = D / 2 - RING / 2;
  const total = props.data.reduce((s, d) => s + d.amount, 0);
  const bounds: { upTo: number; color: string }[] = [];
  let acc = 0;
  props.data.forEach((d, i) => {
    acc += total > 0 ? d.amount / total : 0;
    bounds.push({ upTo: acc, color: CHART_COLORS[i % CHART_COLORS.length] });
  });
  const colorAt = (f: number) => bounds.find((b) => f <= b.upTo)?.color ?? t.border;
  const ticks = Array.from({ length: TICKS }, (_, k) => {
    const deg = (k / TICKS) * 360;
    return { deg, color: colorAt((k + 0.5) / TICKS) };
  });
  return (
    <View>
      <View style={{ width: D, height: D, alignSelf: "center" }}>
        {ticks.map((tk, k) => (
          <View
            key={k}
            style={{
              position: "absolute",
              left: D / 2 - RING / 2,
              top: D / 2 - 7,
              width: RING,
              height: 14,
              borderRadius: 7,
              backgroundColor: tk.color,
              transform: [{ rotate: `${tk.deg}deg` }, { translateY: -r }],
            }}
          />
        ))}
        <View style={s.donutCenter}>
          <Text style={[s.donutVal, { color: t.text }]} numberOfLines={1}>
            {props.centerLabel}
          </Text>
        </View>
      </View>
      <View style={s.legend}>
        {props.data.map((d, i) => (
          <View key={i} style={s.legendRow}>
            <View style={[s.dot, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
            <Text style={[s.legendName, { color: t.text }]} numberOfLines={1}>
              {d.name}
            </Text>
            <Text style={[s.legendPct, { color: t.sub }]}>
              {total > 0 ? `${Math.round((d.amount / total) * 100)}%` : "0%"}
            </Text>
            <Text style={[s.body, { color: t.sub }]}>{props.format(d.amount)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

// ---------- inputs ----------

export const Field = memo(function Field(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  numeric?: boolean;
  large?: boolean;
  error?: string;
}) {
  const t = useTheme();
  return (
    <View>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        keyboardType={props.numeric ? "numeric" : "default"}
        placeholderTextColor={t.sub}
        style={[
          s.field,
          props.large && s.fieldLarge,
          {
            backgroundColor: t.bg,
            borderColor: props.error ? t.danger : t.border,
            color: t.text,
          },
        ]}
      />
      {props.error ? <Text style={[s.err, { color: t.danger }]}>{props.error}</Text> : null}
    </View>
  );
});

// ---------- chips / segmented ----------

export const Chip = memo(function Chip(props: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  dot?: string;
}) {
  const t = useTheme();
  const sel = props.selected ?? false;
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        s.chip,
        {
          backgroundColor: sel ? t.primary : "transparent",
          borderColor: sel ? t.primary : t.border,
        },
      ]}
    >
      {props.dot ? <View style={[s.dot, { backgroundColor: props.dot }]} /> : null}
      <Text style={[s.chipText, { color: sel ? t.onPrimary : t.text }]}>{props.label}</Text>
    </Pressable>
  );
});

export const Segmented = memo(function Segmented(props: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={[s.seg, { backgroundColor: t.bg, borderColor: t.border }]}>
      {props.options.map((o) => {
        const sel = o === props.value;
        return (
          <Pressable
            key={o}
            onPress={() => props.onChange(o)}
            style={[s.segOpt, sel && { backgroundColor: t.primary }]}
          >
            <Text style={[s.chipText, { color: sel ? t.onPrimary : t.sub }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
});

// ---------- sheet / toast / states ----------

export const Sheet = memo(function Sheet(props: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const t = useTheme();
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <Pressable style={s.sheetBg} onPress={props.onClose}>
        <Pressable
          onPress={() => {}}
          style={[s.sheet, { backgroundColor: t.card, borderColor: t.border }]}
        >
          <View style={[s.grab, { backgroundColor: t.border }]} />
          <Text style={[s.h2, { color: t.text }]}>{props.title}</Text>
          {props.children}
        </Pressable>
      </Pressable>
    </Modal>
  );
});

export const Toast = memo(function Toast(props: { message: string | null }) {
  const t = useTheme();
  if (!props.message) return null;
  return (
    <View style={s.toastWrap} pointerEvents="none">
      <View style={[s.toast, { backgroundColor: t.primary }]}>
        <MaterialIcons name="check" size={16} color={t.onPrimary} />
        <Text style={[s.toastText, { color: t.onPrimary }]}>{props.message}</Text>
      </View>
    </View>
  );
});

export const EmptyState = memo(function EmptyState(props: {
  title: string;
  hint: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={s.empty}>
      <View style={[s.emptyArt, { backgroundColor: t.card, borderColor: t.border }]}>
        <MaterialIcons name="savings" size={40} color={t.primary} />
      </View>
      <Text style={[s.h2, { color: t.text }]}>{props.title}</Text>
      <Text style={[s.body, { color: t.sub, textAlign: "center" }]}>{props.hint}</Text>
      {props.actionTitle && props.onAction ? (
        <Btn title={props.actionTitle} onPress={props.onAction} />
      ) : null}
    </View>
  );
});

export const CenterLoad = memo(function CenterLoad() {
  const t = useTheme();
  return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator color={t.primary} />
    </View>
  );
});

// ---------- cards / rows ----------

export const Avatar = memo(function Avatar(props: {
  uri: string | null;
  name: string;
  size?: number;
}) {
  const t = useTheme();
  const size = props.size ?? 48;
  if (props.uri) {
    return (
      <Image
        source={{ uri: props.uri }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: t.border }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: t.onPrimary, fontWeight: "700", fontSize: size * 0.4 }}>
        {(props.name.trim().slice(0, 1) || "?").toUpperCase()}
      </Text>
    </View>
  );
});

export const YearCard = memo(function YearCard(props: {
  name: string;
  meta: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  return (
    <View style={[s.rowCard, { backgroundColor: t.card, borderColor: t.border }]}>
      <Pressable onPress={props.onPress} style={s.rowGrow} hitSlop={8}>
        <Text style={[s.yearTitle, { color: t.text }]}>{props.name}</Text>
        <Text style={[s.body, { color: t.sub }]}>{props.meta}</Text>
      </Pressable>
      <MaterialIcons name="chevron-right" size={22} color={t.sub} />
      <Pressable onPress={props.onDelete} hitSlop={12}>
        <MaterialIcons name="delete-outline" size={18} color={t.danger} />
      </Pressable>
    </View>
  );
});

export const MonthCard = memo(function MonthCard(props: {
  name: string;
  net: string;
  positive: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  return (
    <View style={[s.monthCard, { backgroundColor: t.card, borderColor: t.border }]}>
      <Pressable onPress={props.onPress} style={s.rowGrow} hitSlop={8}>
        <Text style={[s.rowTitle, { color: t.text }]} numberOfLines={1}>
          {props.name}
        </Text>
        <Text style={[s.amount, { color: props.positive ? t.success : t.danger }]}>{props.net}</Text>
      </Pressable>
      <Pressable onPress={props.onDelete} hitSlop={12}>
        <MaterialIcons name="close" size={16} color={t.danger} />
      </Pressable>
    </View>
  );
});

export const GroupCard = memo(function GroupCard(props: {
  name: string;
  meta: string;
  utilization: number;
  color: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  return (
    <View style={[s.rowCard, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[s.dotLg, { backgroundColor: props.color }]} />
      <Pressable onPress={props.onPress} style={s.rowGrow} hitSlop={8}>
        <Text style={[s.rowTitle, { color: t.text }]}>{props.name}</Text>
        <Text style={[s.caption, { color: t.sub }]}>{props.meta}</Text>
        <Bar value={props.utilization} />
      </Pressable>
      <Pressable onPress={props.onDelete} hitSlop={12}>
        <MaterialIcons name="delete-outline" size={18} color={t.danger} />
      </Pressable>
    </View>
  );
});

export const TxnRow = memo(function TxnRow(props: {
  name: string;
  category: string;
  date: string;
  amount: string;
  isIncome: boolean;
  color: string;
  onDelete: () => void;
}) {
  const t = useTheme();
  return (
    <View style={[s.txn, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[s.avatar, { backgroundColor: props.color, borderColor: t.border }]}>
        <Text style={s.avatarText}>{props.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={s.rowGrow}>
        <Text style={[s.rowTitle, { color: t.text }]} numberOfLines={1}>
          {props.name}
        </Text>
        <Text style={[s.caption, { color: t.sub }]}>
          {props.category} · {props.date}
        </Text>
      </View>
      <Text style={[s.amount, { color: props.isIncome ? t.success : t.danger }]}>{props.amount}</Text>
      <Pressable onPress={props.onDelete} hitSlop={12}>
        <MaterialIcons name="close" size={16} color={t.danger} />
      </Pressable>
    </View>
  );
});

const s = StyleSheet.create({
  btn: { borderRadius: R.btn, alignItems: "center", justifyContent: "center" },
  btnMd: { paddingVertical: 12, paddingHorizontal: 16 },
  btnSm: { paddingVertical: 8, paddingHorizontal: 12 },
  block: { width: "100%" },
  btnText: { fontSize: 16, fontWeight: "600" },
  btnTextSm: { fontSize: 13 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    elevation: 4,
  },
  fabGrad: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  card: { borderRadius: R.card, padding: 16, borderWidth: 1 },
  statGrow: { flex: 1 },
  statVal: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5, fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  caption: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  body: { fontSize: 15 },
  h2: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  yearTitle: { fontSize: 24, fontWeight: "700", letterSpacing: -0.3 },
  rowTitle: { fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
  amount: { fontSize: 16, fontWeight: "700", letterSpacing: -0.2, marginTop: 4, fontVariant: ["tabular-nums"] },
  barTrack: { height: 8, borderRadius: 4, marginTop: 8, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  chartCol: { flex: 1, alignItems: "center", gap: 4 },
  chartBarWrap: { justifyContent: "flex-end" },
  chartLabel: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  miniRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  donutCenter: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  donutVal: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3, fontVariant: ["tabular-nums"] },
  legend: { gap: 8, marginTop: 12 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendName: { flex: 1, fontSize: 15 },
  legendPct: { fontSize: 13, fontVariant: ["tabular-nums"] },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLg: { width: 12, height: 12, borderRadius: 6, marginRight: 4 },
  field: { borderWidth: 1, borderRadius: R.input, padding: 12, fontSize: 15, marginBottom: 4 },
  fieldLarge: { fontSize: 28, fontWeight: "800", textAlign: "center", padding: 16 },
  err: { fontSize: 12, marginBottom: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: R.tag,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 14, fontWeight: "600" },
  seg: { flexDirection: "row", borderWidth: 1, borderRadius: 12, padding: 4, gap: 4 },
  segOpt: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  sheetBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 32,
    gap: 6,
  },
  grab: { width: 48, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  toastWrap: { position: "absolute", left: 0, right: 0, bottom: 100, alignItems: "center" },
  toast: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: R.tag, paddingVertical: 10, paddingHorizontal: 18 },
  toastText: { fontWeight: "700", letterSpacing: 0.3 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  emptyArt: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: R.card,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  monthCard: { flex: 1, borderRadius: R.card, padding: 12, borderWidth: 1, minHeight: 96 },
  txn: { flexDirection: "row", alignItems: "center", borderRadius: R.card, padding: 12, borderWidth: 1, gap: 10 },
  rowGrow: { flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
