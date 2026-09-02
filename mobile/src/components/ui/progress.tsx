import { View, type ViewProps } from "react-native";

export function Progress({ value = 0, style, ...props }: ViewProps & { value?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[{ height: 8, backgroundColor: "#e5e5e5", borderRadius: 999, overflow: "hidden" }, style as any]}
      {...props}
    >
      <View style={{ width: `${pct}%` as any, height: "100%", backgroundColor: pct > 90 ? "#d00" : pct > 75 ? "#eab308" : "#111" }} />
    </View>
  );
}
