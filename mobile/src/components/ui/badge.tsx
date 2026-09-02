import { View, Text, type ViewProps } from "react-native";

type Variant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";

const map: Record<Variant, { bg: string; color: string; border: string }> = {
  default: { bg: "#111", color: "#fff", border: "#111" },
  secondary: { bg: "#f1f1f1", color: "#111", border: "#f1f1f1" },
  destructive: { bg: "#fee", color: "#a00", border: "#fcc" },
  outline: { bg: "transparent", color: "#111", border: "#ddd" },
  ghost: { bg: "transparent", color: "#111", border: "transparent" },
  link: { bg: "transparent", color: "#2f95dc", border: "transparent" },
};

export function Badge({
  variant = "default",
  style,
  children,
  ...props
}: ViewProps & { variant?: Variant; children?: React.ReactNode }) {
  const v = map[variant];
  const isText = typeof children === "string";
  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          borderWidth: 1,
          backgroundColor: v.bg,
          borderColor: v.border,
        },
        style as any,
      ]}
      {...props}
    >
      {isText ? <Text style={{ fontSize: 11, fontWeight: "600", color: v.color }}>{children}</Text> : children}
    </View>
  );
}
