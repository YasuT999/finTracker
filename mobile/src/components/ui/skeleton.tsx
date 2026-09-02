import { View, type ViewProps } from "react-native";

export function Skeleton({ style, ...props }: ViewProps) {
  return <View style={[{ backgroundColor: "#e5e5e5", borderRadius: 8, opacity: 0.6 }, style as any]} {...props} />;
}
