// Stateless presentational components only.
// Rules: props in, UI out. No useState/useEffect inside. All memo'd.
// State lives in screens via src/hooks.ts; data lives in src/db.ts.
import { memo, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export const ROW_H = 68;
export const TXN_H = 64;

export const C = {
  bg: "#f8fafc",
  card: "#ffffff",
  ink: "#0f172a",
  sub: "#64748b",
  line: "#e2e8f0",
  accent: "#2563eb",
  danger: "#dc2626",
  ok: "#16a34a",
};

export const Btn = memo(function Btn(props: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger";
}) {
  const v = props.variant ?? "primary";
  return (
    <Pressable
      onPress={props.onPress}
      style={[s.btn, v === "outline" && s.btnOutline, v === "danger" && s.btnDanger]}
    >
      <Text style={[s.btnText, v === "outline" && s.btnTextOutline]}>{props.title}</Text>
    </Pressable>
  );
});

export const Card = memo(function Card(props: { children: ReactNode }) {
  return <View style={s.card}>{props.children}</View>;
});

export const Stat = memo(function Stat(props: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statVal} numberOfLines={1}>
        {props.value}
      </Text>
      <Text style={s.statLabel}>{props.label}</Text>
    </View>
  );
});

// View-based bar (replaces recharts — zero dep, zero list cost)
export const Bar = memo(function Bar(props: { value: number }) {
  const w = Math.max(0, Math.min(100, props.value));
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${w}%` }]} />
    </View>
  );
});

export const Empty = memo(function Empty(props: {
  title: string;
  hint: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{props.title}</Text>
      <Text style={s.hint}>{props.hint}</Text>
      {props.actionTitle && props.onAction ? (
        <Btn title={props.actionTitle} onPress={props.onAction} />
      ) : null}
    </View>
  );
});

export const CenterLoad = memo(function CenterLoad() {
  return (
    <View style={s.center}>
      <ActivityIndicator />
    </View>
  );
});

export const Field = memo(function Field(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  return (
    <TextInput
      value={props.value}
      onChangeText={props.onChange}
      placeholder={props.placeholder}
      keyboardType={props.numeric ? "numeric" : "default"}
      style={s.field}
      placeholderTextColor={C.sub}
    />
  );
});

export const Sheet = memo(function Sheet(props: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <View style={s.sheetBg}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>{props.title}</Text>
          {props.children}
        </View>
      </View>
    </Modal>
  );
});

// ---- rows (fixed height → getItemLayout, memo → no re-render storms) ----

export const YearRow = memo(function YearRow(props: {
  name: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={s.row}>
      <Pressable onPress={props.onPress} style={s.rowGrow} hitSlop={8}>
        <Text style={s.rowTitle}>{props.name}</Text>
      </Pressable>
      <Pressable onPress={props.onDelete} hitSlop={12}>
        <Text style={s.del}>Delete</Text>
      </Pressable>
    </View>
  );
});

export const MonthRow = memo(function MonthRow(props: {
  name: string;
  budget: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={s.row}>
      <Pressable onPress={props.onPress} style={s.rowGrow} hitSlop={8}>
        <Text style={s.rowTitle}>{props.name}</Text>
        <Text style={s.sub}>{props.budget}</Text>
      </Pressable>
      <Pressable onPress={props.onDelete} hitSlop={12}>
        <Text style={s.del}>Delete</Text>
      </Pressable>
    </View>
  );
});

export const GroupRow = memo(function GroupRow(props: {
  name: string;
  meta: string;
  utilization: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={s.rowTall}>
      <Pressable onPress={props.onPress} style={s.rowGrow} hitSlop={8}>
        <Text style={s.rowTitle}>{props.name}</Text>
        <Text style={s.sub}>{props.meta}</Text>
        <Bar value={props.utilization} />
      </Pressable>
      <Pressable onPress={props.onDelete} hitSlop={12}>
        <Text style={s.del}>Delete</Text>
      </Pressable>
    </View>
  );
});

export const CategoryRow = memo(GroupRow);

export const TxnRow = memo(function TxnRow(props: {
  description: string;
  meta: string;
  amount: string;
  isIncome: boolean;
  onDelete: () => void;
}) {
  return (
    <View style={s.row}>
      <View style={s.rowGrow}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {props.description}
        </Text>
        <Text style={s.sub}>{props.meta}</Text>
      </View>
      <Text style={[s.amt, props.isIncome ? s.ok : s.bad]}>{props.amount}</Text>
      <Pressable onPress={props.onDelete} hitSlop={12}>
        <Text style={s.del}>✕</Text>
      </Pressable>
    </View>
  );
});

const s = StyleSheet.create({
  btn: { backgroundColor: C.accent, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: "center" },
  btnOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.line },
  btnDanger: { backgroundColor: C.danger },
  btnText: { color: "#fff", fontWeight: "600" },
  btnTextOutline: { color: C.ink },
  card: { backgroundColor: C.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.line },
  stat: { flex: 1, minWidth: 100, backgroundColor: C.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.line },
  statVal: { fontSize: 16, fontWeight: "700", color: C.ink },
  statLabel: { fontSize: 11, color: C.sub, textTransform: "uppercase", marginTop: 2 },
  barTrack: { height: 6, backgroundColor: C.line, borderRadius: 3, marginTop: 6, overflow: "hidden" },
  barFill: { height: 6, backgroundColor: C.accent, borderRadius: 3 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.ink },
  hint: { color: C.sub, textAlign: "center", marginBottom: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  field: { borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 10, backgroundColor: "#fff", color: C.ink, marginBottom: 8 },
  sheetBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  sheet: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 4 },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: C.ink },
  row: { height: ROW_H, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.card, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: C.line },
  rowTall: { minHeight: ROW_H, flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.line, gap: 8 },
  rowGrow: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: C.ink },
  sub: { fontSize: 12, color: C.sub, marginTop: 2 },
  del: { color: C.danger, fontSize: 13, marginLeft: 12 },
  amt: { fontWeight: "700", marginLeft: 8 },
  ok: { color: C.ok },
  bad: { color: C.ink },
});
