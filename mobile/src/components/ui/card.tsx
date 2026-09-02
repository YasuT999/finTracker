import { View, Text, type ViewProps, type TextProps } from "react-native";

export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View
      style={[{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5", padding: 14, gap: 8 }, style as any]}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ style, children, ...props }: ViewProps) {
  return (
    <View style={[{ gap: 4 }, style as any]} {...props}>
      {children}
    </View>
  );
}

export function CardTitle({ style, children, ...props }: TextProps) {
  return (
    <Text style={[{ fontSize: 16, fontWeight: "600" }, style as any]} {...props}>
      {children}
    </Text>
  );
}

export function CardDescription({ style, children, ...props }: TextProps) {
  return (
    <Text style={[{ fontSize: 13, opacity: 0.6 }, style as any]} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ style, children, ...props }: ViewProps) {
  return (
    <View style={[{ gap: 8 }, style as any]} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ style, children, ...props }: ViewProps) {
  return (
    <View style={[{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }, style as any]} {...props}>
      {children}
    </View>
  );
}

export function CardAction({ style, children, ...props }: ViewProps) {
  return (
    <View style={style as any} {...props}>
      {children}
    </View>
  );
}
