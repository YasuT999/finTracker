import { Pressable, Text, ActivityIndicator, type PressableProps, type TextStyle, type ViewStyle } from "react-native";

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
type Size = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

const variantStyles: Record<Variant, ViewStyle> = {
  default: { backgroundColor: "#111", borderColor: "#111" },
  outline: { backgroundColor: "transparent", borderColor: "#ddd" },
  secondary: { backgroundColor: "#f1f1f1", borderColor: "#f1f1f1" },
  ghost: { backgroundColor: "transparent", borderColor: "transparent" },
  destructive: { backgroundColor: "#fee", borderColor: "#fcc" },
  link: { backgroundColor: "transparent", borderColor: "transparent" },
};

const variantText: Record<Variant, TextStyle> = {
  default: { color: "#fff" },
  outline: { color: "#111" },
  secondary: { color: "#111" },
  ghost: { color: "#111" },
  destructive: { color: "#a00" },
  link: { color: "#2f95dc" },
};

const sizeStyles: Record<Size, ViewStyle> = {
  default: { height: 32, paddingHorizontal: 12 },
  xs: { height: 24, paddingHorizontal: 8 },
  sm: { height: 28, paddingHorizontal: 10 },
  lg: { height: 36, paddingHorizontal: 14 },
  icon: { width: 32, height: 32, paddingHorizontal: 0 },
  "icon-xs": { width: 24, height: 24, paddingHorizontal: 0 },
  "icon-sm": { width: 28, height: 28, paddingHorizontal: 0 },
  "icon-lg": { width: 36, height: 36, paddingHorizontal: 0 },
};

export function Button({
  variant = "default",
  size = "default",
  style,
  children,
  loading,
  disabled,
  ...props
}: PressableProps & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  const isTextChild = typeof children === "string";
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          borderWidth: 1,
          gap: 6,
          opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
        },
        variantStyles[variant],
        sizeStyles[size],
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" /> : null}
      {isTextChild ? <Text style={[{ fontSize: 14, fontWeight: "600" }, variantText[variant]]}>{children}</Text> : children}
    </Pressable>
  );
}
