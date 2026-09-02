import { View, Text, ScrollView, type ViewProps, type TextProps } from "react-native";

export function Table({ children, style, ...props }: ViewProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[{ borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 10, overflow: "hidden" }, style as any]} {...props}>
        {children}
      </View>
    </ScrollView>
  );
}

export function TableHeader({ children, style, ...props }: ViewProps) {
  return (
    <View style={[{ flexDirection: "row", backgroundColor: "#fafafa", borderBottomWidth: 1, borderColor: "#e5e5e5" }, style as any]} {...props}>
      {children}
    </View>
  );
}

export function TableRow({ children, style, ...props }: ViewProps) {
  return (
    <View style={[{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#f0f0f0" }, style as any]} {...props}>
      {children}
    </View>
  );
}

export function TableHead({ children, style, ...props }: TextProps & { style?: any }) {
  const isText = typeof children === "string";
  return (
    <View style={[{ flex: 1, padding: 10, minWidth: 100 }, style]}>
      {isText ? <Text style={{ fontSize: 11, fontWeight: "700", opacity: 0.6, textTransform: "uppercase" }}>{children}</Text> : children}
    </View>
  );
}

export function TableCell({ children, style, ...props }: TextProps & { style?: any }) {
  const isText = typeof children === "string" || typeof children === "number";
  return (
    <View style={[{ flex: 1, padding: 10, minWidth: 100 }, style]}>
      {isText ? <Text style={{ fontSize: 13 }}>{String(children)}</Text> : children}
    </View>
  );
}

export function TableBody({ children, style, ...props }: ViewProps) {
  return (
    <View style={style as any} {...props}>
      {children}
    </View>
  );
}
